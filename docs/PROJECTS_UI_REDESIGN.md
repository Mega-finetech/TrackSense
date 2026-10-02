# Projects UI redesign

## Scope and implementation

Read the existing routed Projects list/editor/detail implementation and project API before editing. Replaced Projects list and new-project presentation only. Auth, stores, query keys, API endpoints, detail/edit/delete handlers, task linking, milestone operations and the approved bottom navigation remain intact.

Files:
- `mobile/src/features/projects/ProjectsListView.tsx`: complete list and creation-sheet presentation using StyleSheet.
- `mobile/src/features/planning/PlanningScreens.tsx`: connects the existing data/CRUD handlers to the new presentation.
- `mobile/tests/browser-smoke.mjs`: updates create-form selectors and adds Projects visual/filter checks.

Features:
- Safe-area-aware back/title/36px plus header with 44px touch targets.
- All, Active and Completed pills. Active now follows the requested active/in_progress rule; planning/on-hold remain in All.
- FlatList cards with six cycling accents, status badges, deadlines/overdue treatment, animated progress, completed/total task counts and milestone counts supplied by the API.
- Completed projects are not labelled overdue. Unknown counts display a dash instead of invented zeros.
- Three pulsing loading skeletons, errors/retry and filter-aware empty states.
- New Project bottom sheet at the existing `/project/new` route. Uses the existing validated create mutation and navigation return behavior.
- Project Name, description, optional calendar date picker, Active/Planning/On Hold choices, loading spinner and Cancel. New projects default to Active as requested.
- Light and dark themes. Supporting text uses stronger contrast than the very muted requested date colors.

## Deliberate limitation

No persistent color/icon field exists in the Projects controller/model. The color picker was not added because its selection could not survive a reload with the current API. Accents cycle by the full project-list index and stay stable while switching filters. Adding saved custom colors requires a separate data-contract change; no backend/schema changes were made here.

The date picker is an in-app calendar built with existing React Native components; no new dependency was added.

## Verification

- PASS: TypeScript (`npm run typecheck`).
- PASS: Existing mobile tests (`npm test`), 11/11. Existing Node module-type warnings remain.
- PASS: Expo web export using process-only fixture configuration. No .env file edits.
- PASS: `node tests/browser-smoke.mjs`. Full regression flow includes project creation through the sheet, calendar selection, detail navigation, milestone completion, editing, linked-task creation, deletion/cancel-delete, theme rendering and logout. New checks cover All/Active/Completed filters, in_progress support, exclusion of planning/on_hold from Active, real-shaped task/milestone statistics and suppression of overdue styling for completed projects.
- PASS: 390 x 844 browser screenshots reviewed for populated lists, empty state and creation sheet in light/dark themes. Additional Active/Completed filter screenshots captured.
- PASS: existing 390/320-width bottom-navigation geometry checks. BottomNavigation.tsx SHA256 unchanged: `C27978BCCB51F715F8EA9FAE519814FBA5A07D4FA1F3727F6BB593D56B1F8EC5`.
- Physical Android and live service persistence have not been tested in this UI pass. Browser data is disposable in-memory fixture data; no real database records are created/modified.


## Screenshots

- Populated list: [light](../mobile/artifacts/projects-populated-light.png), [dark](../mobile/artifacts/projects-populated-dark.png).
- Empty list: [light](../mobile/artifacts/projects-empty-light.png), [dark](../mobile/artifacts/projects-empty-dark.png).
- Creation sheet: [light](../mobile/artifacts/projects-create-light.png), [dark](../mobile/artifacts/projects-create-dark.png).
- Active filter: [light](../mobile/artifacts/projects-active-light.png), [dark](../mobile/artifacts/projects-active-dark.png).
- Completed filter: [light](../mobile/artifacts/projects-completed-light.png), [dark](../mobile/artifacts/projects-completed-dark.png).

Stopped after Projects presentation and regression verification; no other module redesign started.
