# Module template

Skeleton files for building a new module (verification, cards, visitors, print) on the shared reuse layer built for Module 1. Each `.txt` file below is a real file with its extension changed so it stays out of the build — copy it to its real location, rename it, and work through the numbered `TODO`s in order.

Read `docs/RECIPES.md` first. This template is the same recipes as files you can copy-paste from.

## Files

| Template | Copy to | Real example to compare against |
|---|---|---|
| `backend/ExampleEntity.java.txt` | `backend/src/main/java/lk/AccessOne/<module>/domain/<Entity>.java` | `cardrequest/domain/CardRequest.java` |
| `backend/ExampleRepository.java.txt` | `.../repository/<Entity>Repository.java` | `cardrequest/repository/CardRequestRepository.java` |
| `backend/ExampleDto.java.txt` | `.../web/dto/<Entity>Summary.java` + `<Entity>Detail.java` | `cardrequest/web/dto/*.java` |
| `backend/ExampleService.java.txt` | `.../service/<Entity>Service.java` | `cardrequest/service/CardRequestService.java` |
| `backend/ExampleController.java.txt` | `.../web/<Entity>Controller.java` | `cardrequest/web/CardRequestController.java` |
| `frontend/hooks.ts.txt` | `frontend/src/app/(app)/<area>/_hooks/use<Entities>.ts` | `employee/_hooks/useRequests.ts` |
| `frontend/list-page.tsx.txt` | `frontend/src/app/(app)/<area>/page.tsx` | `employee/page.tsx` |
| `frontend/detail-page.tsx.txt` | `frontend/src/app/(app)/<area>/<entities>/[id]/page.tsx` | `employee/requests/[id]/page.tsx` |
| `frontend/form.tsx.txt` | `frontend/src/app/(app)/<area>/_components/<Entity>Form.tsx` | `employee/_components/RequestForm.tsx` |

## Order to build in

1. Migration (new table, matching `chk_*` constraints for anything the entity will validate)
2. Entity + repository + unit tests for the domain rules
3. DTOs + mapper
4. Service, wired onto `EntityLookup` / `OwnershipGuard` / `StatusChangeSupport` / `TimelineService` / `FileStorageService`
5. Controller
6. `mvn test`, then boot the app and hit it with `curl` before touching the frontend
7. Frontend hooks via `createResource`
8. List screen via `DataTable`
9. Detail screen via `DetailHeader` / `StatusTimeline` / `ConfirmDialog`
10. Form via `Field` / `FormShell` / `FileUploadField`
11. `npm run build`, then click through it in a browser

Skipping straight to the frontend before the backend compiles and passes its tests is the most common way to lose an afternoon to a bug that was actually in the entity.
