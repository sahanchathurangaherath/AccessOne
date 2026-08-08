# Recipes

How to build a new screen or endpoint using the shared reuse layer. Written as instructions, not explanation — if you need the why, see `docs/card-request-module-review.md`.

## Add a list screen

1. Copy `frontend/src/app/(app)/employee/page.tsx` into your area.
2. Change four things:
   - the `createResource` path and key in your `_hooks` file
   - the `Column[]` array
   - the `rowHref`
   - the `empty` text
3. Done. Do not add loading, empty or error handling — `DataTable` (`frontend/src/components/data-table.tsx`) has them.

## Add a detail screen

1. Copy `frontend/src/app/(app)/employee/requests/[id]/page.tsx`.
2. Change the resource, the fields shown in the details card, and the action buttons.
3. Drive every button from a server boolean — `detail.editable`, never `detail.status === "DRAFT"`.

## Add a status action (submit, approve, cancel, check-in…)

Backend:

```java
@PostMapping("/{id}/approve")
public XDetail approve(@PathVariable Long id) { return service.approve(id); }
```

```java
@Transactional
public XDetail approve(Long id) {
    X entity = lookup.require(repository, id, "X");
    guard.requireOwnerOr(entity.ownerId(), "X", id, "HR_MANAGER", "SYSTEM_ADMIN");
    statusChanges.apply("x_table", id, entity::getStatus, entity::approve);
    return mapper.toDetail(entity);
}
```

Frontend:

```ts
export const useApprove = () => resource.useAction("approve");
```

## Add a timeline

```java
@Transactional(readOnly = true)
public List<XTimelineEntry> timeline(Long id) {
    findById(id);   // ownership check first
    return timelineService.forEntity("x_table", id).stream()
        .map(e -> new XTimelineEntry(e.status() != null ? e.status() : e.action(),
                                      e.changedBy(), e.changedAt(), e.note()))
        .toList();
}
```

```tsx
<StatusTimeline entries={timeline.data ?? []} />
```

## Add a file upload

```java
String path = storage.store("visitors", id, file,
                            FileStorageService.IMAGES, 2L * 1024 * 1024);
```

Deleting the owning record? Call `storage.deleteFolder("visitors", id)` in the same service method — nothing does this for you.

## Add a business rule

In the **service**, never the controller and never the UI:

```java
if (!employee.isActivelyEmployed()) {
    throw new BusinessRuleException("EMPLOYEE_NOT_ACTIVE",
        "A card cannot be requested for an employee who has left.");
}
```

The message says what happened and what to do. "Operation not permitted" makes people guess.

## What's shared vs. what you write fresh

| Shared (use it) | Yours (write it) |
|---|---|
| `EntityLookup`, `OwnershipGuard`, `StatusChangeSupport`, `TimelineService`, `FileStorageService` | Business rules, validation, the status transition table |
| `DataTable`, `DetailHeader`, `ConfirmDialog`, `StatusTimeline`, `Field`, `FormShell`, `FileUploadField` | Column definitions, field lists, DTO shapes |
| `createResource(path, key)` | The mutation body types, the action names |
| `GlobalExceptionHandler`, `PageResponse` | Your controller, your entity |

If a shared piece needs a module-specific prop to work, it has absorbed a business rule — move the rule back to your module and pass a rendered node instead.
