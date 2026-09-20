## 2026-09-19 ? UI Fidelity Revision Pass 2

Completed the scoped Dashboard, Goals list and Goal detail visual revision. Added opt-in neutral light/dark surface hierarchy, stronger action contrast, a forest progress panel, open Quick Actions, compact empty states, lighter goal cards and a milestone-entry disclosure. Auth, APIs, stores and domain behavior are preserved; the bottom-navigation component checksum is unchanged. TypeScript, all 11 mobile tests (9 existing + 2 contrast), web export and browser smoke pass, including all eight navigation geometry cases. Ten fresh 390px screenshots and the physical-review change list are in [UI_FIDELITY_REVISION_2.md](UI_FIDELITY_REVISION_2.md). Stopped for review; other modules remain deferred.

## 2026-09-18 ? UI fidelity, first review batch

Implemented shared light/dark visual tokens, reusable headers/cards/rings/actions, shared bottom navigation, Dashboard, Goals list and Goal detail. Preserved auth, API, PostgreSQL and all existing domain mutations. TypeScript, 9 mobile tests, web export and browser regression pass. Review screenshots and changed-file details: [UI_FIDELITY_BATCH_1.md](UI_FIDELITY_BATCH_1.md). Other module redesigns remain paused for review of this batch.

## 2026-09-18 ? Supabase post-auth route fix

Confirmed mobile API base omitted `/api`, causing profile-link requests to receive 404. Corrected private environment and normalized origin-only API configuration. Added redacted stage diagnostics, specific account-created/profile-link-failed messaging, and sign-in recovery for existing accounts. Backend 40/40 tests, mobile 9/9 tests, TypeScript, web export, and fixture browser regression pass. Live database has both migrations applied, no pending changes; initial read-only inspection found zero internal users/identities. Valid-account hosted linking and device navigation/reopen tests remain blocked by unavailable test credentials/device interaction. See [POST_AUTH_DIAGNOSIS.md](POST_AUTH_DIAGNOSIS.md) for evidence, changes, actions, and resumption instructions. No other screen rebuilds were started.

# Rebuild progress

## Supabase Auth and account preferences — implementation phase

Final checks: web and Android exports succeed, and the fixture-based browser regression passes with account-preference synchronization enabled. Hosted Supabase Auth and Android device checks remain outstanding; export success is not an installed-device test.

Added optional Supabase authentication, server-side provider verification, password-proven legacy identity linking, mobile session refresh, email verification and email-code recovery. Legacy mode remains active because Supabase project configuration is not present. Added server-synced theme/focus/onboarding preferences with revision conflict handling and local-cache fallback. Safely applied additive migration `0002_identity_preferences.sql` to `tracksense`; no pending migrations. All 40 backend tests, mobile TypeScript and web export pass. Live preference persistence/restart/ownership/conflict tests and existing core persistence checks pass; disposable data was cleaned up. Hosted Supabase/email/device verification is still blocked by missing project configuration. See `SUPABASE_AUTH_AND_PREFERENCES.md` for setup, exact scope and verification limits. Study/Spiritual and screen redesigns remain paused.

## Live persistence verified — September 17

After the user's configuration update, verified the live target is `tracksense` (PostgreSQL 17.11). It was empty; safely applied `0001_initial.sql`. Final status has no pending migrations. Real HTTP/PostgreSQL tests passed for two-account registration/login, authentication rejection, goal CRUD, goal/project milestones, linked task persistence, projects, idempotent focus sessions, backend restart, direct persisted-row checks, and two-user isolation. Disposable test data was removed with ID-and-email-scoped cleanup; zero test accounts remain. All 35 regression tests pass. Fixed existing boolean/array SQL incompatibilities and verified them live. Other databases, port-4000 server process and all screens were left untouched. See `DATABASE_PERSISTENCE_VERIFICATION.md` for the current PASS table and full action log; earlier blocked notes below are historical.

## Database persistence stabilization — September 17

Server-side PostgreSQL logs identify the exact login failure: the role in `backend/.env` does not exist on the running local PostgreSQL 17 server. No inherited database environment override is active. Added fail-closed database startup/readiness, secret-safe error logging, read-only migration status and an opt-in real persistence runner. All 35 backend regression tests pass. Live connection/status/persistence preflight still fails with `28P01`; no test accounts were created and no migration/data changes occurred. See `DATABASE_PERSISTENCE_VERIFICATION.md` for the action log, schema concerns and blocked live checks. Screens and Study/Spiritual work were not changed in this phase.

## Goals and Projects follow-up — September 17

- Replaced the legacy goal/project list and placeholder detail screens with shared themed planning screens: compact headers, green segmented filters, icon cards, progress bars and due dates based on the supplied screen sheet.
- Added creation and editing routes, categories for goals, status/deadline editing, milestone creation/completion, linked task creation/completion and explicit deletion confirmation. Project progress remains based on tasks; goal progress remains based on milestones, with the basis labeled on each detail screen.
- Added owned goal-detail and milestone-list API endpoints, server validation for planning fields and milestone creation, and task-to-project cache refresh.
- The routes call the existing API. The live database login and Supabase development setup remain unresolved; no existing user data was migrated.
- TypeScript passes and all 34 backend tests pass. Web and Android exports succeed. The fixture-based browser flow passes for creation, detail, milestone completion, editing, linked-task creation, deletion cancellation/confirmation, and existing auth/task/theme flows. Screenshots were reviewed at 390 × 844; centered list headers and bottom navigation were corrected to follow the supplied sheet. The Android export is a JS/assets bundle, not an installed APK or device test.
- Android platform tools were not found on PATH or at the standard local SDK location; no physical-device/emulator test has been performed.
- Study, Spiritual, Supabase authentication, cloud preferences, reminders, existing-data conversion and Android device verification remain outstanding. These planning changes do not complete the full rebuild or certify an exact visual match for every screen.

## Database foundation follow-up

- Added `backend/scripts/inspect-db.js` (`npm run db:inspect`) for read-only catalog inspection without account records or credentials in output.
- The configured PostgreSQL login was rejected with `28P01`. Live schema inspection and data migration remain pending; no remote data or schema was changed.
- Added a versioned fresh-database baseline and transactional migration runner with checksums, an advisory lock, timeouts and refusal to initialize an existing unversioned schema. Baseline includes the missing `goals.updated_at` column.
- Added disposable PostgreSQL migration tests via development-only PGlite. All 33 backend tests pass (29 existing, 4 new). Verified the migration CLI refuses execution without `--apply`. See `backend/db/README.md` for usage, migration boundaries and remaining legacy-module compatibility work.
- Supabase authentication and conversion of existing data are still outstanding. The database choice and valid development credentials are needed before live integration.
- Backend dependency installation reported 3 advisory findings (1 low, 1 moderate, 1 high); security triage remains pending.

## Implemented

- Source snapshot in `backups/before-rebuild-20260916-152538.zip`, excluding secrets, dependencies and build output. Existing `mobile/.git` history stays in place. Root source-control consolidation is deferred to avoid nesting or discarding history.
- Expo Router entry and protected auth/onboarding/application routes, with Home / Tasks / Focus / Analytics / Profile tabs. The replaced navigation entry points are preserved in the snapshot. Existing domain screens remain accessible through a small route adapter while their individual rebuilds follow.
- Central green light/dark/system tokens and reusable native screens, buttons, cards, labels, inputs, password visibility, progress, loading, empty and error states. New screens use the token-based styling system; preserved legacy screens still use NativeWind until migrated.
- Supplied icon copied unchanged into branding assets and configured for the app and splash. The supplied wordmark is also preserved; its PNG has no alpha channel and the visible checkerboard is baked in, so it is not placed on app surfaces. A clean transparent source is needed for the full wordmark.
- New welcome and validated sign-in/register forms connected to the existing API. OAuth and password recovery have not been fabricated; Supabase authentication is a subsequent migration.
- Per-account focus-area selection, with Spiritual optional. Onboarding and theme preferences persist on the device. Cloud preference synchronization is not implemented yet.
- Real user-scoped dashboard API replacing sample figures. Progress is explicitly completion of tasks **due today**, not a claim about historical completion times. Client timezone is passed to aggregation.
- Task creation, list/Kanban switching, starting/completing/reopening tasks, API errors, and query invalidation after changes. Full task editing, arbitrary due-date picking and linked-parent selectors follow in the tasks phase.
- Focus timer with custom duration, pause/resume, restart/background recovery based on timestamps, local persistence, and explicit saving of completed sessions. Stable client session IDs make repeated saves idempotent using the existing primary key. Native background notifications and goal/course/project context follow later.
- Analytics tab shows actual non-archived task completion and recent stored focus history. It does not display invented trends or the older completion-by-due-date metrics.
- Native sessions use SecureStore; web preview sessions use sessionStorage. User changes clear the API query cache.

## Backend protection

Resource middleware checks record and parent ownership across tasks, goals, projects, milestones, courses, assignments, exams, study sessions, Bible plans and notifications. User-controlled update fields are rejected; model update/delete queries are scoped by user as a second layer. Related goal/project/course IDs are checked before accepting writes.

Ordinary user sessions cannot invoke the all-user notification cron route. JWT configuration has no default secret and requires at least 32 characters. Environment loading occurs before database/auth configuration. JWT verification allows HS256 explicitly. Server errors no longer return raw database error messages. Production database TLS now verifies certificates.

The existing local JWT key failed the new length check. Only that key was replaced with a securely generated value; the prior local environment is preserved in ignored `backend/.env.before-rebuild`. No secret value was printed. Configuration validation now passes. Existing local sessions need a fresh sign-in; database connection settings were preserved.

Importing the database module no longer performs schema creation. Historical runtime DDL is retained in `backend/db/legacy-runtime-schema.sql` for comparison, not execution. **No live schema migration or data write was performed as part of the rebuild work.** The existing database must already be provisioned to use the API.

## Running locally

1. Keep `backend/.env` private. Set `DATABASE_URL` to a development database and `JWT_SECRET` to a securely generated secret of at least 32 characters. Optional settings are listed in `backend/.env.example`. A weak or missing secret now deliberately prevents startup; old tokens signed by a fallback key will need a fresh sign-in.
2. Run `npm install` and `npm start` from `backend/` once the development schema is verified. Starting the API does not migrate the database.
3. In `mobile/`, copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to the API URL including `/api`. A physical phone needs the development computer's reachable LAN address. Development defaults use `10.0.2.2:4000/api` for the Android emulator and `localhost:4000/api` for web/iOS. Release builds require an explicit API URL.
4. Run `npm start` in `mobile/` for Expo, `npm run android` for Android development, or `npm run web` for browser preview. Root `npm run dev` still opens the old web application.

Only public publishable/anon Supabase keys belong in public Expo variables, never secret/service-role keys. Optional Supabase Auth configuration is documented in `SUPABASE_AUTH_AND_PREFERENCES.md`; the local environment remains in legacy mode until that configuration is supplied.

## Verification commands

- `mobile/`: `npm run typecheck`, `npm test`, `npm run build:android`.
- `backend/`: `npm test` (authorization regression tests; no database connection).
- `mobile/`: `npx expo export --platform web --output-dir web-preview` for a static browser preview.

An exported Android JS/assets bundle is not a signed APK or proof of on-device behavior. Native device verification, actual database integration tests and migrations remain release gates.

Verified so far: 29 backend tests and 4 timer tests pass; mobile TypeScript checking passes; Android and web exports succeed. The backend configuration validator also passes against the local environment without connecting to the database. TypeScript includes are limited to application source so exported bundles are not treated as source files.

For the isolated browser smoke test, export web with `EXPO_PUBLIC_API_URL=http://localhost:4000/api` in the build environment, then run `node tests/browser-smoke.mjs` from `mobile/`. It uses a hidden local Chrome instance and intercepts all API requests with test fixtures; it never writes to the configured database. If changing Expo public variables between exports, clear Metro's transform cache. Test screenshots are written to ignored `mobile/artifacts/`.

The browser smoke test passes for welcome, registration, optional focus-area onboarding, task creation/completion with dashboard refresh, dark theme and sign-out. Screenshots were visually reviewed at a 390 × 844 viewport. Bottom-tab spacing and web checkbox accessibility were corrected during that review. This is a fixture-based UI check, not a live-database integration test.

The dependency install reported 28 advisory findings (16 moderate, 12 high). These have not been fully triaged; a dependency security review remains required before beta. No forced breaking dependency updates were applied.

## Next work

1. Inspect live development schema metadata read-only, reconcile text/UUID/boolean/timestamp differences and establish one versioned migration history. Rehearse with a copy before any real migration.
2. Decide legacy-account mapping and integrate Supabase Auth/Storage with tested server ownership/RLS, recovery, session refresh and account lifecycle flows.
3. Rebuild goals, study, projects and spiritual screens with the shared component system and complete their workflows. Existing placeholders remain explicitly unfinished.
4. Add server-synced preferences, completion timestamps, linked focus contexts, richer analytics and native reminders.
5. Finish lint cleanup, dependency security review, CI/EAS configuration, full ownership/integration tests and Android device testing before beta.

Expo 56 implementation reference: https://docs.expo.dev/versions/v56.0.0/ and https://docs.expo.dev/versions/v56.0.0/sdk/router/ . Native dependency versions are aligned with the installed Expo SDK's bundled module manifest.
