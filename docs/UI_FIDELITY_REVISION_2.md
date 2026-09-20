# UI Fidelity Revision Pass 2 — 2026-09-19

Scope: Dashboard, Goals list, Goal detail, and their shared presentation components. This pass responds to the supplied physical-device review feedback. Review artifacts generated here are browser screenshots, not captures from a connected Android device.

## What changed in response to the review

| Feedback | Revision |
| --- | --- |
| Dark surfaces were too similar and too green | Scoped neutral charcoal page/card/control levels, a distinct elevated progress surface, green focus highlight and forest progress panel. Light mode uses warm off-white, white cards and restrained sage highlights. |
| Hierarchy relied on bold text | Larger, medium-weight greeting; separate screen/section/card/supporting/metadata sizes; deliberate line heights; larger progress numbers and quieter descriptive labels. No font dependency added. |
| Faint Create goal / Goals + | Solid contrasting primary fills with explicit foreground colors. Empty-state action is compact but substantial; + retains a 44px touch target with a visible rounded-square background. |
| Dashboard felt like repeated rounded rectangles | Removed the Quick Actions enclosing card, replaced module cards with understated links, reduced empty states to icon/copy/action groups and varied card/control radii. |
| Progress needed stronger emphasis | Forest hero panel with fresh-green ring, a clear completed/total task ratio, separate focus minutes and active-goal metrics. All numbers still come from the existing summary endpoint; no overall-life score. |
| Quick Actions were cramped | Full content width, equal slots, larger aligned icon containers, increased icon-label space, consistent labels. |
| Today’s Focus was a strong direction | Preserved the highlight; refined its icon surface, label tracking, spacing and trailing affordance. |
| Goals filters/empty state needed polish | Compact rounded-rectangle segmented control with explicit selected semantics; no oversized empty card; solid Create goal action. |
| Goal cards felt heavy | Borderless small-radius surfaces, restrained category icons, clearer progress color, separate deadline and milestone-progress state. Counts are not invented when the list API does not provide them. |
| Goal detail looked like a form | Elevated progress summary, calmer milestone rows with completion markers/dividers, and a New milestone disclosure that reveals the existing entry form. Existing add/toggle/task/edit/delete operations are preserved. |

## Scope protection

- `FidelityTheme` is an opt-in presentation boundary for the three approved screens. It reuses the existing mode and theme setter; it does not change preferences or auth stores.
- Original palettes remain the default for all deferred modules, auth/onboarding, project screens and navigation. Goals' bottom bar is outside the scoped theme boundary, matching the dashboard's unchanged tab bar.
- `BottomNavigation.tsx` is byte-for-byte unchanged: SHA-256 `C27978BCCB51F715F8EA9FAE519814FBA5A07D4FA1F3727F6BB593D56B1F8EC5` before and after.
- No backend, API client, authentication, route definitions, database schema, query functions, mutation payloads or domain rules changed. Goal editors retain their existing forms.
- Screenshot data exists only in browser fixtures. No production sample data or private configuration was changed.

## Files changed

- `mobile/src/theme/tokens.ts` — opt-in palettes, surface and type roles.
- `mobile/src/theme/ThemeProvider.tsx` — presentation-only FidelityTheme boundary.
- `mobile/src/components/ui/core.tsx` — refined scoped core controls, panels, ring, goals and compact empty state.
- `mobile/src/features/dashboard/DashboardScreen.tsx` — presentation and scoped theme.
- `mobile/src/features/planning/PlanningScreens.tsx` — Goals-only presentation and milestone-form disclosure; shared project branch preserved.
- `mobile/tests/fidelity-contrast.test.mjs` — light/dark contrast regressions.
- `mobile/tests/browser-smoke.mjs` — revised milestone disclosure interaction and empty/populated review captures.

## Verification

- TypeScript: **PASS** after the final screen changes.
- Web export: **PASS**. Existing browser smoke: **PASS**, including the new milestone-form disclosure, both compact empty-state captures, scrolling and horizontal-overflow checks.
- Mobile tests: **11/11 pass**, including all 9 existing regressions and 2 new contrast checks.
- Tested primary-button text, primary-on-highlight actions, muted/secondary text and hero-panel text meet at least 4.5:1 contrast in both modes.
- Existing browser smoke still covers auth/onboarding, task completion, goal/project creation/editing, milestone completion, linked tasks, delete confirmation, theme and logout. Its navigation geometry checks remain in place at 390px and 320px.
- All eight navigation cases pass (two widths, two themes, Home/Profile selected). The navigation source checksum is unchanged.
- All ten requested screenshots were generated at 390 × 844 and visually inspected. The empty-state Create goal action also passes a rendered-size check (at least 120px wide and 44px tall).

Commands from `mobile`: `npm run typecheck`, `npm test`, `node node_modules/expo/bin/cli export --platform web --output-dir web-preview` (process-only legacy fixture provider/API), and `node tests/browser-smoke.mjs`. Private Supabase configuration was not modified. No backend tests or live database checks were needed for this presentation-only pass.

## Screenshots — 390 × 844

| Screen | Light | Dark |
| --- | --- | --- |
| Dashboard top | [View](../mobile/artifacts/revision2-dashboard-light.png) | [View](../mobile/artifacts/revision2-dashboard-dark.png) |
| Dashboard lower sections | [View](../mobile/artifacts/revision2-dashboard-sections-light.png) | [View](../mobile/artifacts/revision2-dashboard-sections-dark.png) |
| Goals empty | [View](../mobile/artifacts/revision2-goals-empty-light.png) | [View](../mobile/artifacts/revision2-goals-empty-dark.png) |
| Goals populated fixtures | [View](../mobile/artifacts/revision2-goals-light.png) | [View](../mobile/artifacts/revision2-goals-dark.png) |
| Goal detail | [View](../mobile/artifacts/revision2-goal-detail-light.png) | [View](../mobile/artifacts/revision2-goal-detail-dark.png) |

Physical Android font rendering, safe-area appearance and comfort still need device review. These screenshots and tests do not constitute a new live-auth/database verification. This batch stops for approval; no further module redesign is started.
