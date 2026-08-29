# Design Patterns in AccessOne

Four patterns are implemented as deliberate design decisions, plus one recognised
in code that was written for other reasons. Every claim below names a file that
can be opened in the IDE in under ten seconds.

---

## 1. Strategy — access decisions

**Files**
- `entry/decision/AccessDecisionStrategy.java` — the interface
- `entry/decision/EmployeeCardStrategy.java`
- `entry/decision/VisitorPassStrategy.java`
- `entry/service/AccessDecisionService.java` — selects and delegates

**Problem.** Employee cards and visitor passes are refused for genuinely
different reasons, checked in a different order. A card is controlled by
status, revocation and employment; a pass by a validity window checked live
against the moment of the attempt, never the stored status alone. The entry
point must ask one question of both.

**Why not a conditional.** The two rule sets share almost no checks. A
branching method would grow every time either rule set changed, and the
branch itself would be the thing a third credential type had to edit.

**Benefit, verified.** `AccessDecisionServiceTest.aStrategyAddedToTheListIsUsedWithNoChangeToTheService`
constructs the service with a hand-built `AccessDecisionStrategy` the service
has never seen and confirms it is used — exactly the mechanism Spring's
constructor injection relies on with `List<AccessDecisionStrategy>` at
runtime. Adding a real class to that list is the whole change; nothing in
`AccessDecisionService` names a concrete strategy.

**Constraint, verified.** Strategies are pure: `grep -rn "save(|publishEvent|log\." entry/decision/`
returns nothing. The service writes the log row and publishes the event; a
strategy that did either would produce it a second time.

**Failing loudly.** `AccessDecisionService.evaluate()` used to fall back to
`AccessDecisionResult.unknownCredential(...)` when no strategy matched the
inferred credential type — the same result as a credential that simply
doesn't exist in the database. Those are different failures: one is a
deployment mistake (a credential type with nothing registered to evaluate
it), the other is a normal, loggable, everyday event. It now throws
`IllegalStateException` instead, covered by
`AccessDecisionServiceTest.aCredentialTypeWithNoRegisteredStrategyFailsLoudlyInsteadOfDenyingSilently`.

---

## 2. State — every lifecycle

**Files**
- `shared/enums/StatefulEnum.java` — the common interface
- `shared/enums/CardStatus.java` — 11 states, the most complex
- `RequestStatus`, `Decision`, `PrintStatus`, `DispatchStatus`, `PassStatus`

**Problem.** Six lifecycles, each owned by a different module. Without one
definition of "what may follow what," a status change in one module can
silently disagree with the assumption another module made about it.

**Implementation.** Each enum now `implements StatefulEnum<Self>` and owns
a transition map. Every domain entity's `move`-style method (`IdCard.moveTo`,
`Approval.move` (private), `CardRequest.move`, `PrintJob.move`,
`DispatchRecord.move`, `VisitorPass.move`) checks `canTransitionTo` before
assigning and throws `InvalidStateTransitionException` when refused.

**Two real bypasses found and fixed this phase.** Grepping for direct status
assignment outside a `move`-style method found two live ones, not the zero
this phase expected:

- `VisitorPass.changeWindow()` set `this.status = PassStatus.ACTIVE` directly
  when an extension reopened an expired pass — `EXPIRED → ACTIVE` was not in
  `PassStatus`'s map, so the direct assignment was silently relying on a
  transition the state machine did not actually define. Fixed by adding
  `EXPIRED → ACTIVE` to the map and routing the call through `move()`.
- `Approval.reopen()` set `this.decision = Decision.PENDING` directly. This
  looked like dead code on a first grep for `.reopen()` — the only call site
  is `Approval::reopen`, a method reference in
  `approval/service/RequestSubmittedListener.java`, invoked when a rejected
  request is resubmitted. `REJECTED → PENDING` was not in `Decision`'s map.
  Fixed the same way: added the transition, routed through `move()`.

Both are the exact failure mode Phase 14 exists to catch: a rule the code
depended on that was never actually written down.

**Verification.** `CardStatusTest` and `RequestStatusTest` assert terminal
states have no outgoing transitions and every other state has at least one —
the test that would have caught `Map.of()` quietly capping at ten entries and
omitting a state.

---

## 3. Observer — cross-module messaging

**Files**
- `shared/event/DomainEvent.java` — marker with a timestamp
- `shared/audit/AuditEventListener.java`
- `entry/alert/SecurityAlertListener.java`
- `notification/service/NotificationListener.java`
- `approval/service/RequestSubmittedListener.java`
- `card/service/CardGenerationListener.java`

**Problem.** Approving a request must generate a card, write an audit entry
and notify the employee. Calling all three from the approval service would
couple it to modules it has no reason to know about.

**Evidence it works.** `approval/event/EmployeeExited.java` was published
from `ApprovalService.recordExit()` with nothing subscribed. `card/service/CardService.on(EmployeeExited)`
subscribes to it and revokes the employee's still-active cards — added
later, with no change to the publisher.

**Transaction phases, audited.**

| Listener | Annotation | Why |
|---|---|---|
| `AuditEventListener` | `@TransactionalEventListener(AFTER_COMMIT)` | An audit row for a rolled-back change is a false record |
| `NotificationListener` (7 handlers) | `@TransactionalEventListener(AFTER_COMMIT)` | Telling someone about work that rolled back is worse than silence |
| `SecurityAlertListener` | `@TransactionalEventListener(AFTER_COMMIT)` | An alert for an attempt that was not logged has nothing to reference |
| `RequestSubmittedListener` | plain `@EventListener` + `@Transactional` | The approval row must be created with the submission, atomically |
| `CardGenerationListener` | plain `@EventListener` + `@Transactional` | A card without its approval, or vice versa, is a broken state |
| `CardService.on(EmployeeExited)` | plain `@EventListener` | Revoking usable cards is part of recording the exit, not a side effect that may lag behind it |
| `LoginEventListener` (2 handlers) | plain `@EventListener` | Failed-attempt counting must be atomic with the login attempt itself |

All seven were already correct; this phase's contribution was auditing and
recording the reasoning, not changing any of them.

**Every event now carries a timestamp.** `DomainEvent.occurredAt()` is
implemented by all twelve event records plus `AuditEvent`. Each record kept
its original constructor as a convenience overload that fills in
`LocalDateTime.now(UTC)`, so no publish call site anywhere in the codebase
needed to change.

| Event | Published by | Subscribed by |
|---|---|---|
| `CardRequestSubmitted` | `CardRequestService` | `RequestSubmittedListener` — opens the approval |
| `CardRequestApproved` | `ApprovalService` | `CardGenerationListener`; `NotificationListener` |
| `CardRequestRejected` | `ApprovalService` | `NotificationListener` |
| `EmployeeExited` | `ApprovalService` | `CardService` — revokes usable cards |
| `CardGenerated` | `CardGenerationService` | `NotificationListener` |
| `CardActivated` | `DispatchService` | `NotificationListener` |
| `CardRevoked` | `CardService` | `NotificationListener` |
| `CardReportedLost` | `CardService` | *(none yet — candidate: security alerting)* |
| `PrintQualityFailed` | `PrintJobService` | *(none yet — candidate: a live production-alerts dashboard)* |
| `AccessEvaluated` | `AccessDecisionService` | `SecurityAlertListener` |
| `SecurityAlertRaised` | `SecurityAlertService` | `NotificationListener` |
| `PassExpiringSoon` | `PassExpiryScheduler` | `NotificationListener` — notifies the host |
| `AuditEvent` | every module | `AuditEventListener` |

**Framework choice.** Spring's `ApplicationEventPublisher` rather than a
hand-rolled registry, because it provides transaction-phase binding
(`AFTER_COMMIT`) that a hand-rolled version would not.

---

## 4. Singleton — sequence-backed generators

**Files**
- `shared/sequence/SequenceGenerator.java` — the shared implementation
- `card/service/CardSerialGenerator.java`
- `print/service/PrintJobNumberGenerator.java`
- `CardRequestService.nextRequestNo()`, `VisitorPassService.nextPassNo()`

**Singleton, honestly.** The Spring container guarantees one bean per
generator, but that alone would not make serials unique: two application
instances would each have their own counter. The real guarantee is the
database sequence (`dbo.seq_card_serial`, `seq_print_job_no`,
`seq_card_request_no`, `seq_pass_no`) — it allocates atomically for every
caller, on any instance, on any thread. A Java-side counter would be a
textbook Singleton and would be wrong the moment the application ran on two
machines. Naming this class Singleton describes the single point of access;
the correctness comes from the database.

**Consolidation.** The identical "SELECT NEXT VALUE FOR … then format"
pattern previously appeared once in each of four places. `SequenceGenerator.next(sequenceName, prefix, width)`
is now the one implementation; `CardSerialGenerator` and
`PrintJobNumberGenerator` are thin named wrappers kept because their class
names are the ones referenced elsewhere (and are more specific about what
they generate), while `CardRequestService` and `VisitorPassService` call
the shared generator directly. `VisitorService.nextVisitorCode()` was left
alone — its format (`VIS-NNNN`, no year) is genuinely different, not a fifth
case of the same shape.

The sequence name is interpolated into the native query rather than bound,
because SQL Server does not accept a parameter there. Every call site passes
a compile-time string literal, never user input.

---

## 5. Factory — credential payloads

**Files**
- `card/service/CredentialPayloadFactory.java`

All knowledge of what a QR or NFC payload contains — encoding, hashing,
encryption — lives in one class. Changing the format is one file, not a
search across the codebase.

**Considered and descoped: Factory Method for card layouts.** A replacement
card could carry a visibly distinct layout (a version marker) so a security
officer can tell at a glance that an older card has been superseded, via a
`CardLayoutFactory` selecting between a standard and a replacement
`CardLayout`. Not built this phase — the PDF layout is currently one
template, and introducing a second implementation and a factory to select
between them for a feature nobody has asked for yet is exactly the kind of
decoration this phase is meant to eliminate. Noted here as the honest
alternative to overclaiming it.

---

## 6. Facade — recognised, not designed

`entry/service/AccessDecisionService.evaluate()` hides strategy selection,
credential lookup, blacklist checking, access-level evaluation, log writing
and event publication behind one method. The Entry Point Simulator, and any
future physical reader integration, calls it and knows none of that.

Written as a service to be the single decision entry point; recognised
afterwards as a Facade, and the class-level Javadoc now says so.

---

## 7. Builder — access decision results

**Files**
- `entry/decision/AccessDecisionResult.java` (nested `Builder`)

`AccessDecisionResult` has a nine-component canonical form and three
positional-argument static factories (`granted`, `denied`,
`unknownCredential`). Both strategies called `denied(...)` and `granted(...)`
with seven or eight arguments including one that was always `null` — the id
of whichever credential type the result was *not* about
(`card.getId(), null, area.getId()` or `null, pass.getId(), area.getId()`).

`AccessDecisionResult.builder()` replaces those call sites in both
strategies. `.card(Long)` and `.pass(Long)` each set `credentialType` and the
matching id together, so neither call site writes the other id at all —
tighter than a builder that still takes a type-plus-two-ids triple, which
would keep the same positional null one level down. The three original
static factories are unchanged and still covered by
`AccessDecisionResultTest` — this was an additive change, not a breaking one.

---

## 8. Framework-supplied patterns

Repository (Spring Data), MVC (Spring Web) and Dependency Injection (Spring
Core) are provided by the framework and used throughout. They are not
claimed as design work — Spring Data generates the repository
implementations from interface method names and `@Query` annotations; there
is no hand-written Repository pattern here to point at.

---

## Patterns considered and rejected

| Pattern | Considered for | Why not |
|---|---|---|
| Chain of Responsibility | The sequential checks inside each `AccessDecisionStrategy` | The order matters for which denial reason is recorded (blacklist before status, for instance), and a chain of handler objects would obscure that ordering behind indirection. A sequence of early returns reads directly as "cheapest and most serious checks first" |
| Command | Status transitions | The enums already hold the rules as data (a transition map), which is simpler to reason about and test than the equivalent set of Command objects would be |
| Decorator | Card layouts | The same one-variant problem that descoped Factory Method there — decorating a single base case is indirection with no second case to justify it yet |
| Template Method | The six feature modules' CRUD services | Phase 6 already extracted the shared pieces (generic CRUD service/controller conventions, shared frontend components) as composition rather than inheritance. The modules' actual business rules differ enough that forcing them through one template method would fight the differences rather than express them |

Being able to say why a pattern was *not* used is worth as much as using
one — it shows the choice was made rather than defaulted into.

---

## What this phase did not touch

No `.puml` or other diagram source exists yet in this repository to
reconcile against the refactored code (Phase 14's Step 7 assumes diagrams
were generated in an earlier phase; that step did not happen here). If and
when a class/sequence diagram pack is produced, it should be drawn from the
code as it stands after this phase — in particular: `StatefulEnum` as an
interface implemented by all six lifecycle enums, `DomainEvent` as the
event marker, and `AccessDecisionResult.Builder` rather than the old
positional factories at the two strategies' call sites.
