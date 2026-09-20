# TrackSense reference-board alignment — 2026-09-19

Scope: Dashboard, Goals list, Goal detail, and their opt-in shared visual components. This pass supersedes the previous Revision 2 composition. The approved board is the visual source of truth.

## Changes from Revision 2
- Replaced the large solid-green Dashboard progress panel with a neutral card: slim green ring at left, compact task/focus/goal metrics at right, optional real study-hours metric. No synthetic score.
- Reduced greeting size from 32 to 25, restored the reference supporting copy, and used a forest-filled selected date.
- Grouped compact Quick Actions inside one surface, reduced icon boxes to 38px and labels to 11px, preserving each action.
- Restored circular header actions, smaller centered screen titles, and pill-shaped Goals filters.
- Reduced goal-card padding and internal gaps; retained category, progress, deadline and milestone state.
- Reduced Goal detail title/ring dimensions while preserving milestone toggles, milestone creation, linked tasks and editing/deletion.
- Neutral bordered cards with 12px radii replace oversized elevated cards; light text uses navy. Dark mode retains charcoal surfaces and readable green accents.

## Files changed
- mobile/src/features/dashboard/DashboardScreen.tsx
- mobile/src/features/planning/PlanningScreens.tsx
- mobile/src/components/ui/core.tsx
- mobile/src/theme/tokens.ts
- mobile/tests/browser-smoke.mjs (new screenshot prefix, existing workflows preserved)

Reused: FidelityTheme, Screen, Label, Progress, TaskRow, CategoryIcon, IntentEmpty and all existing queries/mutations. Refined: FidelityPanel, ProgressRing, AppHeader, IconButton, FilterBar, GoalCard, QuickAction. Removed the Dashboard hero composition; no domain component replaced.

BottomNavigation source hash remains C27978BCCB51F715F8EA9FAE519814FBA5A07D4FA1F3727F6BB593D56B1F8EC5. Its five routes and equal-width geometry are unchanged. No auth, API, environment, backend or database changes.

## Verification
- TypeScript: PASS (`npm run typecheck`).
- Mobile tests: PASS, 11/11 (`npm test`). Existing Node module-type warnings are non-fatal.
- Web fixture export: PASS (`expo export --platform web --output-dir web-preview`, process-only legacy provider and localhost fixture API overrides).
- Browser results and screenshot inspection recorded below after completion.

## Remaining intentional deviations
- Current navigation remains Home / Tasks / Focus / Analytics / Profile, as requested.
- Quick Actions use existing working task/focus/goal/project routes rather than introducing the board's unimplemented note/activity actions.
- Dashboard uses available task, focus, goal and study data; no fabricated spiritual metric. Active goals, projects and Today's Focus remain useful live-data sections beyond the board's short preview.
- Goal cards retain milestone-state text; Goal detail extends the board, which has no detail screen.
- Touch targets remain practical at 390px rather than reproducing the tiny board thumbnails literally. System fonts and existing vector icons remain.
- Dark mode is an adaptation; the supplied board only specifies light mode.
- The exact landing-background.png asset exists and is reserved unchanged for Batch 4. Welcome/authentication and all other deferred modules were not redesigned.
- Browser viewport screenshots are not physical Android verification. Device approval remains outstanding.

## Screenshots (390 x 844, fixture data only)
| Screen | Light | Dark |
|---|---|---|
| Dashboard top | [Light](../mobile/artifacts/reference-dashboard-light.png) | [Dark](../mobile/artifacts/reference-dashboard-dark.png) |
| Dashboard lower | [Light](../mobile/artifacts/reference-dashboard-sections-light.png) | [Dark](../mobile/artifacts/reference-dashboard-sections-dark.png) |
| Goals empty | [Light](../mobile/artifacts/reference-goals-empty-light.png) | [Dark](../mobile/artifacts/reference-goals-empty-dark.png) |
| Goals populated | [Light](../mobile/artifacts/reference-goals-light.png) | [Dark](../mobile/artifacts/reference-goals-dark.png) |
| Goal detail | [Light](../mobile/artifacts/reference-goal-detail-light.png) | [Dark](../mobile/artifacts/reference-goal-detail-dark.png) |

Stop after this batch for review; no later batch is authorized automatically.

Browser smoke: PASS (auth/onboarding fixture workflows, task and goal/project CRUD workflows, milestone completion, theme and logout). Navigation geometry checks passed at 390px and 320px in both themes. All ten fresh 390x844 screenshots visually inspected. Screenshots use fixture data, not evidence of live database integration.
