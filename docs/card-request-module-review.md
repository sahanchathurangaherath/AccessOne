# Review — Module 1: Card Request & Status Tracking

Written immediately after building the module, while the pain points are still fresh. This is the input the next round of module work uses to decide what becomes the shared layer.

## What was repetitive

- **List screen**: a status filter tab strip, a table with an `identifier`-styled key column, a loading skeleton, an empty state with a call-to-action button, and page/next/previous controls reading `PageResponse`. Every one of the next five modules (approvals, cards, visitors, passes, dispatch) wants this same shape with different columns.
- **Detail screen**: a two-column layout — a details card and a related-records card on the left, an "Actions" card on the right whose buttons are gated by server-computed booleans. The gating pattern itself (`editable` / `withdrawable` / `deletable` computed once in the mapper, never re-derived from a status string in the UI) is the part worth generalising, not the layout.
- **Status timeline**: reads `audit_logs` filtered by entity name and id, maps `AuditAction` to a human sentence, renders a bulleted vertical list with a badge, a username and a timestamp. Modules 2, 4, 5 and 6 all want a status history and none of them need anything different from this.
- **Confirm-before-destructive-action dialogs**: withdraw and delete both needed "are you sure" dialogs with the same shape (title, one sentence of consequence, cancel/confirm). Wrote the same `Dialog` boilerplate twice in one module.
- **`useX` query hook file**: the `keys` object (`all` / `list` / `detail` / `timeline`), a `useXList`, a `useX`, and a `useCreateX`/`useUpdateX`/`useDeleteX` mutation that all invalidate `keys.all` on success. This is almost mechanical — only the entity name and DTO shape change.
- **Backend mapper**: manual `toSummary` / `toDetail` pairs pulling fields off an entity and its lazy associations. Not worth a library at this size, but the *shape* of "one summary DTO, one detail DTO, a mapper class with two methods" will repeat six times.
- **Ownership check**: "HR/SYSTEM_ADMIN sees everything, everyone else sees only their own employee's records, and a record outside your scope 404s rather than 403s" is exactly the kind of rule that belongs in one place. `OwnershipService` already existed from earlier work for this reason, and Module 1 was the first real consumer of it.

## What was awkward

- **`RequestDocument` cannot extend `AuditableEntity`**: the table has `uploaded_at`, not `created_at`/`updated_at`, because a document is never edited, only replaced. It ended up standing alone the same way `AuditLog` does — a second example of the same shape, which suggests "an append-only record with its own single timestamp column" deserves a named pattern (or at least a comment pointing at the precedent) rather than being solved twice independently.
- **The submit() bug in the walkthrough spec**: transitioning state *before* checking the photo requirement left the entity half-mutated when the check failed — invisible until a unit test asserted the status was still `DRAFT` after a rejected submit. Any state-changing method needs its guards evaluated before `transitionTo` is called, not after. Worth calling out explicitly for whoever builds Module 2's approve/reject flow, since it has the same shape (validate, then transition).
- **Combining a `Page<>` query with `join fetch`**: needed an explicit `countQuery` on the repository method or Hibernate silently falls back to counting the fetch-joined result set. Easy to get wrong, and the failure mode (wrong pagination totals, not an exception) is the kind of thing that only shows up once there's enough data to page through.
- **No employee-facing access-level catalogue yet**: the `CreateCardRequest` DTO carries `requestedAccessLevelId`, but Module 3 (`/api/v1/config/**`) is IT/SYSTEM_ADMIN-only and doesn't expose a read endpoint an employee can call. The frontend form leaves this field out entirely rather than inventing an endpoint outside this module's scope. Module 3 needs to decide whether access-level selection belongs on the request form at all, or is something HR assigns during verification.
- **Jackson `ObjectMapper` wasn't an auto-registered bean** in this Spring Boot setup, which the timeline code originally assumed. Switched to a small regex extraction of the one field (`status`) needed out of the hand-built audit JSON, since pulling in a JSON library for one field wasn't worth chasing the missing bean.

## What should be generic (candidates for a shared layer)

- A `PagedTable<T>` component: columns, a page of data, loading/empty/error states, pagination controls. Parameterise the columns, not the markup.
- A `StatusTimeline` component that takes `entityName` + `id`, calls a generic `/{module}/{id}/timeline` shape, and renders exactly what Module 1's did. If every module's timeline endpoint returns `RequestTimelineEntry`-shaped data, this can be one component today rather than five near-identical ones later.
- A `ConfirmDialog` wrapper: title, description, confirm label, danger styling — replacing the two hand-written `Dialog` blocks in this module.
- A `useEntityQueries(basePath)` factory that returns the `keys` object plus list/detail/create/update/delete hooks, so a new module's data layer is a one-line call instead of a 100-line file.
- A backend `OwnedEntityService` pattern (not necessarily a class, possibly a documented convention): `loadOwned(id)` that 404s rather than 403s when the caller can't see the record, built on `OwnershipService`. Module 1's version is already generic-shaped; it just needs pulling up once a second module needs the identical check.

## What should stay specific

- **The domain rules themselves** (`validateTypeRules`, the `RequestStatus` transition table, `PHOTO_REQUIRED`, `REQUEST_IN_PROGRESS`) are Module 1's alone and must not leak into a shared layer — Module 2's approval rules and Module 4's card-issuance rules are differently shaped, and forcing them through one "generic request lifecycle" abstraction is exactly the over-generalisation this build was warned against.
- **`FileStorageService`'s validation limits** (2 MB photo, 5 MB document, JPEG/PNG/PDF) are Module 1's numbers, taken from `chk_reqdocs_size`. A future module with different file rules should get its own constants, not a shared "max upload size" config that quietly changes behaviour here when someone tweaks it there.
- **The mapper and DTOs**: manual mapping stays manual. A mapping library would need justifying in the viva for a five-module system this size, and the two-method-per-entity pattern is cheap enough to repeat by hand.
- **The three-layer validation repetition** (zod on the frontend, the service's `validateTypeRules`, the database's `chk_card_requests_reason`) is deliberate defence in depth, not duplication to clean up. Each layer catches a different bypass — a slow form, a script hitting the API directly, and a bug in the service, respectively — and collapsing them into one shared validator would remove that.
