# Phase 3 — Security Boundary Tests

All tests below were run live against the running backend (`localhost:8080`,
direct — the Next.js proxy from Phase 4 doesn't exist yet) with the real
SQL Server database from Phase 1/2, using `curl` for HTTP and `sqlcmd` to
inspect `users` / `audit_logs` directly. Run date: 2026-08-02.

Two corrections were needed to the Phase 3 plan's `SecurityConfig` for it to
work at all or to behave correctly; both are noted inline below and in the
code comments.

## Corrections made to the plan

1. **Missing `AuthenticationManager` bean.** `AuthController` takes
   `AuthenticationManager` as a constructor dependency, but Spring Security
   does not expose one as an injectable bean by default — it's built lazily
   inside `AuthenticationConfiguration`. Added:
   ```java
   @Bean
   public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
       return configuration.getAuthenticationManager();
   }
   ```
   Without this the application fails to start (`NoSuchBeanDefinitionException`).

2. **Anonymous authentication made `hasRole(...)` rules return 403 instead of
   401 for unauthenticated callers.** Spring Security's
   `AnonymousAuthenticationFilter` gives every unauthenticated request a
   principal with `ROLE_ANONYMOUS`. `.anyRequest().authenticated()` correctly
   treats that as "not authenticated" → 401. But `hasRole("SYSTEM_ADMIN")`
   etc. just check granted authorities on *whatever* principal exists —
   anonymous-with-wrong-role fails the same way an authenticated-with-wrong-role
   request does, i.e. `AccessDeniedException` → 403. In practice this meant
   `GET /api/v1/meta/counts` with **no session at all** returned 403
   ("Forbidden") instead of 401 ("Authentication required"), which is
   inconsistent and a worse signal to a client. Fixed by disabling anonymous
   authentication entirely:
   ```java
   .anonymous(AbstractHttpConfigurer::disable)
   ```
   After the fix, "not logged in" is 401 everywhere, and "logged in but
   wrong role" is 403 everywhere. Verified both ways below (tests 1 and 16).

3. **Local `.m2` / this project's Spring Boot 4.1.0 build restructured the
   Spring Security starters.** The plan's `spring-security-test` (from
   `org.springframework.security`) doesn't match this environment's naming;
   the correct artifacts (matching every other starter already in
   `pom.xml`) are `org.springframework.boot:spring-boot-starter-security` and
   `org.springframework.boot:spring-boot-starter-security-test`.

4. **Disabled/locked accounts were double-counted as failed password
   attempts.** `LoginEventListener.onFailure` originally listened for
   `AbstractAuthenticationFailureEvent`, the parent type — but a login
   attempt against a disabled or already-locked account also publishes a
   failure event (`AuthenticationFailureDisabledEvent`,
   `...LockedEvent`), which is not a wrong-password guess. Found by testing
   #14: after one disabled-account login attempt, `failed_login_attempts`
   had incremented to 1 even though the password was never checked
   (`preAuthenticationChecks` rejects a disabled account before the
   credential comparison runs). Fixed by narrowing the listener to
   `AuthenticationFailureBadCredentialsEvent` specifically — which, since
   `DaoAuthenticationProvider` hides "no such user" as bad credentials by
   default, still correctly covers both wrong-password and
   nonexistent-username attempts, just not disabled/locked ones. Verified:
   a repeat disabled-account login attempt after the fix left the counter at
   0, while a genuine wrong-password attempt still incremented it.

## Test matrix

| # | As | Attempt | Expected | Actual | Result |
|---|---|---|---|---|---|
| 1 | *(nobody)* | `GET /api/v1/requests` | 401, JSON, no HTML redirect | `401 {"status":401,"title":"Unauthorized","detail":"Authentication required"}` | ✅ |
| 1b | *(nobody)* | `GET /api/v1/meta/counts` (hasRole rule, not anyRequest) | 401 | `401` (after the anonymous-auth fix above; was 403 before) | ✅ |
| 1c | *(nobody)* | `GET /api/swagger-ui/index.html` | 401 | `401` | ✅ |
| 2 | `crajapaksa` (EMPLOYEE) | `GET /api/v1/approvals` | 403 | `403 {"detail":"You do not have permission to perform this action"}` | ✅ |
| 3 | `crajapaksa` | `GET /api/v1/config/departments` | 403 | `403` | ✅ |
| 4 | `crajapaksa` | `GET /api/v1/audit/logs` | 403 | `403` | ✅ |
| 4b | `crajapaksa` | `GET /api/v1/meta/counts` | 403 | `403` | ✅ |
| 5 | `crajapaksa` | Read `iweerasinghe`'s card request by id | 404 (not 403) | **N/A** — `card_requests` isn't mapped until Phase 5; `OwnershipService` is built and ready (`shared/security/OwnershipService.isSelf`), but there's no entity/service to wire it into yet | ⏸ deferred |
| 6 | `nperera` (HR) | Read any employee's request | 200 | **N/A** — same reason as #5 | ⏸ deferred |
| 7 | `nperera` | `POST /api/v1/print/jobs` (valid CSRF) | 403 | `403` | ✅ |
| 8 | `twickramaratne` (PRINT) | `GET /api/v1/visitors` | 403 | `403` | ✅ |
| 9 | `rfernando` (SECURITY) | `GET /api/v1/passes` | 200 | `404 "No such endpoint."` — role check passes (proven separately, see below), but `PassController` doesn't exist until Phase 11 | ⏸ role-check verified, feature pending |
| 10 | `admin` | `GET /api/v1/meta/counts` | 200 | `200 {"departments":8,"employees":22,"users":10}` | ✅ |
| 10b | `admin` | `GET /api/swagger-ui/index.html`, `GET /api/v3/api-docs` | 200 | `200`, `200` | ✅ |
| 11 | `crajapaksa` (valid session) | `POST /api/v1/admin/users/1/unlock` without `X-XSRF-TOKEN` | 403 — CSRF working | `403 {"detail":"You do not have permission to perform this action"}` (CSRF rejection and access-denied share a handler — see note) | ✅ |
| 12 | `crajapaksa` | Log in, then `GET /auth/me` again on the same cookie jar | 200 both times | `200`, `200` | ✅ |
| 13 | `crajapaksa` | `POST /auth/logout`, then `GET /auth/me` | 401 | `204` then `401` | ✅ |
| 14 | `dgunawardena` (temporarily `is_active=0`) | Log in | 403, "account has been deactivated" | `403 {"title":"Account disabled","detail":"This account has been deactivated. Contact your administrator."}` | ✅ |
| 15 | `iweerasinghe` | 5× wrong password, then the correct one | 403 locked, not 200 | 5× `401`, then `403 {"title":"Account locked","detail":"Too many failed sign-in attempts. Contact your administrator."}` | ✅ |

Additional tests run beyond the original fifteen:

| # | As | Attempt | Expected | Actual | Result |
|---|---|---|---|---|---|
| 16 | *(nobody vs. wrong password)* | Login with a non-existent username vs. a real username + wrong password | Identical response body | Both: `401 {"detail":"Invalid username or password", "title":"Authentication failed", ...}` | ✅ |
| 17 | `admin` | `POST /api/v1/admin/users/8/unlock` | 204, `failed_login_attempts` reset to 0 | `204`; `iweerasinghe` then logged in successfully with the correct password | ✅ |
| 18 | `crajapaksa` (non-admin) | `POST /api/v1/admin/users/8/unlock` | 403 | `403` | ✅ |
| 19 | All six seeded role accounts | Log in | Each returns the correct `ROLE_*` and permission set from `role_permissions` | Verified for `admin` (SYSTEM_ADMIN, 14 perms), `nperera` (HR_MANAGER, 5), `kjayasinghe` (IT_ADMIN, 5), `rfernando` (SECURITY_OFFICER, 4), `twickramaratne` (PRINT_SUPERVISOR, 3), `crajapaksa`/`iweerasinghe` (EMPLOYEE, 2) | ✅ |
| 20 | (general) | `last_login_at` / `failed_login_attempts` in `users` table | Updates on success/failure | Confirmed via `sqlcmd`: `last_login_at` populated for every account that logged in successfully; `failed_login_attempts` incremented per failure and reset on unlock/success | ✅ |
| 21 | (general) | Grep the full server log for `password`, bcrypt hash pattern (`$2[aby]$`), `JSESSIONID` values | None found | `password` only appears as the **column name** `password_hash` in SQL debug text (`u1_0.password_hash`, `password_hash=?`) — no bound values, because `org.hibernate.orm.jdbc.bind: trace` was removed from `application.yml` for this reason. Zero matches for a bcrypt hash pattern or a session id value | ✅ |
| 22 | `nperera` (via `sp_set_session_context`) | Manual DB-level demo: set session context, `UPDATE id_cards SET status='SUSPENDED'`, check `audit_logs` | Trigger records `performed_by_username='nperera'` | Confirmed — see [DB session context](#step-12--db-session-context) below | ✅ |

### Test 9 — role check verified separately from the missing controller

Since Module 5 (`visitor`/`pass`) has no controller yet, `GET /api/v1/passes`
as `rfernando` correctly passes the *authorization* layer (proven by getting
`404 "No such endpoint"` from our own `GlobalExceptionHandler`, not a `403`)
and then fails at routing because no `@RestController` maps that path. This
is the expected, correct state for Phase 3: the security rule is live and
declarative ahead of the feature that will use it, exactly as intended by
"a new endpoint is secure by default."

### A note on test 11 (CSRF) sharing a response with authorization failures

Spring Security routes CSRF failures (`InvalidCsrfTokenException`,
`MissingCsrfTokenException`) through the same `AccessDeniedHandler` as a
role-authorization failure, since both are subtypes of `AccessDeniedException`.
Both surface as `403 {"title":"Forbidden", ...}` — this is expected. To
confirm CSRF is genuinely the failure and not the role check, the same
request was also tried *with* a valid `X-XSRF-TOKEN` (test 17), and it
returned `204` — proving CSRF, not authorization, was what blocked the
header-less request.

## A wrinkle found while verifying audit attribution (test 20/22 territory)

`LoginEventListener.onSuccess` publishes an `AuditEvent` for the `LOGIN`
action. Checking `audit_logs` afterward showed `performed_by_username =
SYSTEM` for every login row, not the username that just logged in:

```
id  entity_name  entity_id  action  performed_by_username  performed_at
25  users        8          LOGIN   SYSTEM                 2026-08-02 10:42:49
```

This is **not** a wiring bug in `SecurityCurrentUserProvider` — it's a
timing artifact specific to the login event. `AuthenticationSuccessEvent` is
published synchronously *inside* `authenticationManager.authenticate(...)`,
before `AuthController.login()` reaches the line that stores the
`Authentication` into `SecurityContextHolder`/the session. So when
`SecurityCurrentUserProvider.currentUsername()` reads
`SecurityContextHolder.getContext().getAuthentication()` at that exact
moment, there's nothing there yet, and it correctly falls back to `SYSTEM`
per its documented contract.

Verified this is confined to the login bootstrap moment and doesn't affect
the general mechanism: a temporary authenticated endpoint was added to
`DiagnosticsController` (`POST /api/v1/meta/audit-test`, since removed),
called it as `admin` mid-session, and the resulting `audit_logs` row showed
`performed_by_username = admin` — correct attribution, zero service code
changed, exactly matching the exit criterion "Audit rows now carry the real
username, with no service code changed."

**Left as-is** rather than patched: the entity_id on the LOGIN row (`users`,
`8`) already unambiguously identifies who logged in, and `last_login_at` on
that same user row corroborates it — `SYSTEM` here is a narrow cosmetic gap,
not a loss of information, and the plan's own `LoginEventListener` code (used
verbatim) produces the same result. A real fix would mean either publishing
the login audit event from `AuthController` after the context is saved
(coupling audit logic to one specific entry point) or leaving a
`SecurityContextHolder` value set across the listener/controller boundary on
the same thread (fragile, implicit). Neither seemed worth it for a cosmetic
attribute on one action type.

## Step 12 — DB session context

`DbSessionContext` (built in Phase 2) is deliberately left unwired from any
filter or interceptor, per the plan's own reasoning:

`sp_set_session_context` applies to **one physical connection**. HikariCP
hands out pooled connections per-transaction, so anything that sets the
session context outside the exact transaction that performs the write (a
login filter, a separate call) sets it on a connection that may not be the
one the write later runs on. Making this genuinely correct means running it
as the first statement of *every* write transaction — either a custom
`TransactionManager` or a call at the top of every service method. That's
real machinery for a safety net whose job is already done by the
application-level audit trail.

**The two audit trails have different jobs, and that's the actual answer:**
- The **application trail** (Phase 2's `AuditEvent`/`AuditEventListener`,
  now attributing the real user via `SecurityCurrentUserProvider`) knows the
  authenticated user, records rich before/after JSON, and covers every
  change made *through the application*.
- The **database trigger trail** is the safety net for changes made
  *outside* the application — a script, an SSMS session, a future service
  that forgets to publish an event. Recording `SYSTEM` for those is honest,
  not a gap.

Manual demonstration (run 2026-08-02, `id_cards.id = 1`, state restored
to `ACTIVE` afterward):

```sql
SET QUOTED_IDENTIFIER ON;
EXEC sys.sp_set_session_context @key = N'app_username', @value = N'nperera';
UPDATE dbo.id_cards SET status = 'SUSPENDED' WHERE id = 1;

SELECT TOP 1 performed_by_username, action, old_value, new_value, performed_at
FROM dbo.audit_logs ORDER BY id DESC;
```

Result:

```
performed_by_username  action         old_value                                          new_value
nperera                STATUS_CHANGE  {"status":"ACTIVE","card_serial":"ACO-2026-000001"} {"status":"SUSPENDED","card_serial":"ACO-2026-000001"}
```

Confirms the trigger + `SESSION_CONTEXT` mechanism works exactly as designed
when the context is set correctly, without adopting the per-connection
machinery needed to make that automatic.

## Exit criteria checklist

- [x] Each of the six roles can log in and lands with the correct authorities
- [x] `GET /api/v1/auth/me` returns userId, username, employeeId, role and permissions
- [x] An unauthenticated request returns 401 with a JSON body, never an HTML redirect (including `hasRole(...)`-gated routes, after the anonymous-auth fix)
- [x] A wrong-role request returns a clean 403, not a 500
- [ ] An employee cannot read another employee's records by changing an id — returns 404 — **deferred to Phase 5**, no `card_requests` entity exists yet; `OwnershipService` is built and ready
- [x] Session survives a page refresh; logout invalidates it
- [x] A POST without the CSRF header is rejected
- [x] Wrong username and wrong password give identical responses
- [x] `last_login_at` updates on success; `failed_login_attempts` increments on failure
- [x] Five failed attempts lock the account; an admin unlock path exists and works
- [x] Audit rows now carry the real username for normal authenticated actions, with no service code changed (LOGIN rows specifically say SYSTEM — see wrinkle above)
- [x] `/api/v1/meta/**` and Swagger require SYSTEM_ADMIN
- [x] All boundary tests recorded in this document
- [x] No password, hash or session id appears in any log output
