# Tasks redesign

Updated mobile/src/features/tasks/TasksScreen.tsx and mobile/tests/browser-smoke.mjs.

- SectionList grouped by local due date, Today/This Week/All filtering, priority/module badges, overdue time color and completion styling.
- Horizontal Kanban with counts, per-column add actions and preserved Start task/completion mutations.
- Added a lightweight month calendar with date selection and task indicators using existing data; no dependency installation.
- Header create action and floating action preserve /task/new. Existing creation screen and payloads unchanged; no duplicate bottom sheet introduced.
- Existing useTasks/useUpdateTask API hooks unchanged. Shared TaskRow remains unchanged for other screens. No backend or navigation-tab changes.
- Module labels derive only from actual goal/project relationships; unlinked tasks show Personal. No fabricated Study module associations.
- Current Tasks screen has no edit/delete UI; this pass did not invent new CRUD flows.

TypeScript PASS; existing mobile tests 11/11 PASS. Browser verification pending. Physical Android review pending.

Final verification: web export PASS; browser smoke PASS after correcting fixture API task-ID matching. Date filters, List/Kanban/Calendar switching, Start task status updates and month navigation passed. Six 390x844 screenshots reviewed in light/dark themes. Existing app workflows and bottom-navigation geometry checks passed. All browser data is disposable fixtures, not live persistence verification.
