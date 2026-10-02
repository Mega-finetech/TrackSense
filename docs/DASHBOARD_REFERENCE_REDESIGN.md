# Dashboard reference redesign

Updated DashboardScreen.tsx and browser-smoke.mjs. Existing summary/project queries, auth/preferences stores and task mutation preserved. Added quick-add modal, journal/spiritual quick-action destinations, weekly strip, task progress ring, semantic metric rows, sorted upcoming cards and animated loading placeholders. Retained goal/project/module access below the requested main sections.

The summary API exposes study hours this week and prayer streak, not Study/Spiritual completed/total ratios. UI displays these real units. Upcoming is limited to today's tasks by the existing endpoint; future assignments require a separately authorized data change. No backend changes or fabricated counts.

Navigation is unchanged: Home / Tasks / Focus / Analytics / Profile, preserving the approved geometry and the request's keep-navigation instruction. Awaiting clarification on the contradictory alternate tab list.

TypeScript PASS. Mobile tests 11/11 PASS. Browser results pending.

Final verification: web export PASS; browser smoke PASS after updating old heading assertions. Quick-add open/close and existing task/goal/project/onboarding workflows passed. Light/dark Dashboard top and lower screenshots reviewed at 390x844. Navigation geometry checks retained at 390/320 widths. Screenshot data is fixture-only. Physical Android review pending.

Complete implementation: mobile/src/features/dashboard/DashboardScreen.tsx. No other screen redesigns performed.
