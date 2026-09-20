# TrackSense UI fidelity — first review batch

Scope: visual tokens, reusable core components, bottom navigation, Dashboard, Goals list and Goal detail. Auth/session/linking, backend, database, routes and domain mutations are preserved. No further module redesign is included.

## KEEP / REFACTOR / REPLACE assessment

| Decision | Existing implementation | Result |
| --- | --- | --- |
| Keep | ThemeProvider and server-synced preference state | Same light/dark/system selection and persistence |
| Keep | Supabase services, auth store, API client, route guards | No changes in this batch |
| Keep | Dashboard summary, goal queries, task updates, milestone operations, editor and delete confirmation | Existing endpoints, payloads, ownership and invalidation behavior |
| Refactor | Color/spacing/type/radius tokens, Screen, Card, Button | Forest-green system, warm neutral surfaces, smaller controls, subtle shadows and coordinated dark equivalents |
| Refactor | Dashboard | Compact greeting and week context, real task-progress ring, quick actions, focus shortcut, today's tasks, active goals and project progress |
| Refactor | Goals list and detail | Reference-style list; detail prioritizes progress, category/status, deadline, milestones and linked tasks |
| Replace | Separate tab/module navigation rendering | Shared BottomNavigation; same five destinations |
| Replace | Repeated goal-card presentation | Shared GoalCard used on Dashboard and Goals |

## Visual system

Forest primary `#225C4B`, fresh-green accent `#49A577`, warm app background `#F6F7F4`, white cards, deep blue-green primary text. Semantic success/warning/error and category foreground/background pairs have matching dark-theme values. Shared tokens cover spacing, corner radii, type sizes, icon sizes, card and floating elevation.

New components: AppHeader, IconButton, SectionHeader, FilterBar, ProgressRing, StatLine, CategoryIcon, GoalCard, QuickAction and BottomNavigation. Existing Screen, Card, Button, Field, Progress, Empty, Notice and Loading remain the foundation. Components needed only by later modules (such as new bottom sheets/search/select/date controls) have not been introduced as unused scaffolding.

Dashboard reads its existing summary and the existing authenticated Projects endpoint. It shows only a short preview of tasks/goals/projects with routes to the full lists. Task progress is explicitly labeled as task completion, not an invented growth score. No production sample counts, goals or milestones were added. The date strip displays the current week and today; it is informational, not a new calendar filter.

## Files changed

- `mobile/src/theme/tokens.ts`
- `mobile/src/components/ui/index.tsx`
- `mobile/src/components/ui/core.tsx` (new)
- `mobile/src/components/BottomNavigation.tsx` (new)
- `mobile/app/(app)/(tabs)/_layout.tsx`
- `mobile/src/features/dashboard/DashboardScreen.tsx`
- `mobile/src/features/planning/PlanningScreens.tsx`
- `mobile/tests/browser-smoke.mjs`

Shared token/control updates also affect existing screens that already use them; their workflows and module layouts have not been rebuilt. Projects retains its existing screen structure and mutations, with shared navigation/section styling.

## Verification and screenshots

TypeScript passed after the foundation/navigation group, Dashboard/Goals group, and final refinements. All 9 mobile tests pass. Web export and browser regression pass, including registration/onboarding, dashboard task completion, goal/project create/edit/delete confirmation, milestones, linked tasks, theme and logout. Light/dark review captures have no horizontal overflow at 390 × 844. Screenshot inspection led to greeting-icon alignment, stronger muted-text contrast, removal of an extra Goals heading and correction of a text separator.

Browser screenshots use disposable in-memory fixtures; they do not assert live Supabase/PostgreSQL verification. Existing account credentials or production data are not used. The browser build uses process-only legacy fixture configuration; `mobile/.env` remains configured for Supabase and the real development API. No backend source or database was changed, so backend tests were not rerun for this visual-only batch.

Final screenshot review also verified dashboard scrolling. The lower-section captures show today's tasks, active goals and project progress. All documented screenshots were refreshed from the final web build.

| Screen | Light | Dark |
| --- | --- | --- |
| Dashboard | [Screenshot](../mobile/artifacts/fidelity-dashboard-light.png) | [Screenshot](../mobile/artifacts/fidelity-dashboard-dark.png) |
| Dashboard lower sections | [Screenshot](../mobile/artifacts/fidelity-dashboard-sections-light.png) | [Screenshot](../mobile/artifacts/fidelity-dashboard-sections-dark.png) |
| Goals | [Screenshot](../mobile/artifacts/fidelity-goals-light.png) | [Screenshot](../mobile/artifacts/fidelity-goals-dark.png) |
| Goal detail | [Screenshot](../mobile/artifacts/fidelity-goal-detail-light.png) | [Screenshot](../mobile/artifacts/fidelity-goal-detail-dark.png) |

Commands: `npm run typecheck`, `npm test`, `node node_modules/expo/bin/cli export --platform web --output-dir web-preview`, `node tests/browser-smoke.mjs`, and `npm run build:android` from `mobile`. Android export passes with the configured Supabase provider; it is a JS/assets bundle, not an installed APK or a physical-device test.

## Remaining fidelity differences / review boundaries

- The reference is a raster concept sheet, not a Figma specification or a supplied font package. System typography and the existing Lucide icon family remain; exact glyphs, gradients and pixel measurements will differ.
- Navigation retains Home / Tasks / Focus / Analytics / Profile to preserve the working routes. The reference sheet varies its labels/icons between screens.
- Dashboard contains the requested live-data previews, so lower sections scroll beyond the initial viewport. A reference with fewer sections is naturally shorter.
- Goal detail extends the reference's card language; no dedicated goal-detail mockup was supplied in the original 15-screen sheet.
- Native Android safe areas, keyboard behavior, font scaling and physical-device rendering still require device review; browser screenshots are not device screenshots.
- Tasks, Projects, Focus, Analytics, Profile, authentication and onboarding have not received their dedicated fidelity pass. Study and Spiritual final redesigns remain deferred.

Stop here for review before starting the next visual batch.
