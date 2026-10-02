# Analytics UI redesign

## Scope and files

- `mobile/src/features/analytics/AnalyticsScreen.tsx`: complete StyleSheet-based four-tab screen.
- `mobile/package.json`, `mobile/package-lock.json`: added only react-native-chart-kit 7.0.4. Existing react-native-svg retained.
- `mobile/tests/browser-smoke.mjs`: Analytics API fixtures, tab/range/error/empty-state checks and screenshots.

No backend, authentication, stores, other module UI, or bottom-navigation changes.

## UI changes

Safe-area-aware back/title/date-range header; horizontally scrolling Overview, Time, Goals and Study pills; light/dark cards, charts, stat rows, skeletons, retry states and empty states. Charts use the installed Chart Kit v2 API. Reference: https://github.com/chart-kit/react-native-chart-kit.

The existing task completion calculation is preserved: done/non-archived task count, across all dates. The original recent focus total and latest-ten list remain in the Time tab, explicitly scoped to the latest 50 returned sessions.

New read-only connections use existing endpoints: productivity and study summaries, goals and exams. Range presets request the existing week/month/threeMonths values. Focus data is filtered locally within the latest-50 response; this cap is disclosed beside the charts.

## Data limits and deliberate differences from the mockup

- Productivity API groups completed tasks by due week. The chart is labelled accordingly; it is not presented as daily task completion history.
- Task completion timestamps and previous-period comparisons are unavailable. No invented week-over-week increase, on-time rate, monthly completion count or daily task counts.
- Time distribution uses actual Pomodoro/Deep Focus minutes. The requested Study/Projects/Personal/Spiritual percentages are not supplied by the API and are not fabricated.
- Focus time and daily average/best recorded day are based on the selected period within the last 50 sessions. They may omit older records and are labelled as such.
- Goals show current active/completed counts, completion ratio, progress and deadlines across all dates. The backend's created_at-based count is not represented as a six-month completion trend.
- Study uses existing subject-duration and weekly session aggregates. Daily consistency dots are omitted because those aggregates do not provide daily activity. Course-to-subject colors are not stored; semantic accents cycle by subject.
- Range selection supports This Week, This Month and Last 3 Months. Week follows the server's Sunday-based convention. Custom dates are deferred because the query contract does not reliably support them. Current goal status and original all-time task/focus totals remain labelled as unfiltered.
- Supporting text uses stronger contrast than the requested very muted dark text.

## Validation

- PASS: TypeScript after correcting an explicit daily-chart array type.
- PASS: existing mobile regression tests, 11/11.
- PASS: Expo web export, using process-only fixture configuration; no environment-file changes.
- PASS: `node tests/browser-smoke.mjs` from mobile. Existing auth/onboarding/module regressions plus Analytics tabs, date-range requests, empty state, API error/retry and light/dark navigation checks passed with API fixtures.
- PASS: fresh 390px browser screenshots reviewed, including Time, Goals and Study. Screenshot capture resets scroll position between tabs. The error fixture now answers OPTIONS preflight successfully so the intended API error is tested.
- Physical Android and live-service analytics validation not performed. Browser results are fixture UI evidence only.

The dependency install reported 21 audit vulnerabilities (16 moderate, 5 high) across the dependency tree. No automatic audit fix or unrelated dependency upgrades were applied; attribution/remediation was not part of this UI pass.

## Review screenshots

All captures are in `mobile/artifacts/`, at 390px browser width:

- `analytics-overview-light.png`, `analytics-overview-dark.png`
- `analytics-overview-lower-light.png`, `analytics-overview-lower-dark.png`
- `analytics-time-light.png`, `analytics-time-dark.png`
- `analytics-goals-light.png`, `analytics-goals-dark.png`
- `analytics-study-light.png`, `analytics-study-dark.png`
- `analytics-range-light.png`, `analytics-range-dark.png`
- `analytics-empty-dark.png`, `analytics-error-dark.png`

This batch is complete for UI review. Live-service/physical Android verification and backend support for the unavailable metrics remain separate follow-up work.
