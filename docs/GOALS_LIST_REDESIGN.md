# Goals list redesign

Changed GoalsListView.tsx (new presentation component), PlanningScreens.tsx (Goals list wiring/filter), browser-smoke.mjs (labels and filter regression checks).

FlatList replaces the Goals root scroll view. New header, independent pill filters, category icons/colors, animated progress, overdue date treatment, centered empty state and three pulsing loading cards. Goal detail, Projects, backend and bottom navigation unchanged.

Active now includes only active/in_progress, as explicitly requested; paused/overdue goals remain available in All. API calls, query keys, create/edit/delete mutations and detail navigation remain intact.

The + action preserves the existing /goal/new screen and its validated title/category/description/deadline inputs. No duplicate modal or second creation implementation was added. The existing deadline field uses YYYY-MM-DD; a new date picker was not introduced in this list-only pass.

TypeScript PASS; mobile tests 11/11 PASS. Browser verification pending.

Final validation: TypeScript PASS; web export PASS; browser smoke PASS, including creation/edit/delete, milestone completion, Completed/All filters and retained navigation geometry checks. Removed accidental native stack header gap and repeated checks. Four fresh empty/populated Goals screenshots visually reviewed at 390x844 in both themes. Screenshots use fixture data. Physical Android review pending.
