# TrackSense rebuild audit

Reviewed 16 September 2026. Scope: supplied product brief, master production/business plan, three supplied images, local source, schema definitions, configuration, and dependency manifests. This is a source audit, not a certification that existing features work in production. No application code or database records were changed.

## Decision

Rebuild the mobile experience around the supplied green design direction. Preserve the Express API and PostgreSQL domain knowledge, but repair authorization and establish one migration-managed schema before trusting them with the new app. The existing Expo app is a useful starting point, not a completed foundation.

The attachments are product references, not independent authorization to delete code, deploy, create external accounts, or migrate production data. The current request is to review what exists and identify where to begin.

## Existing structure and technology

| Location | What exists | Implication |
| --- | --- | --- |
| `src/`, `public/` | React 19 JavaScript web app, Vite 8, Tailwind 4, React Router 7, PWA setup | Preserve as legacy reference while native UI is rebuilt. README versions are stale. |
| `mobile/` | Expo 56, React Native 0.85, TypeScript, NativeWind 4/Tailwind 3, React Navigation 7 | Already contains screens for most domains. Uses React Navigation, not the proposed Expo Router. |
| `backend/` | Express 5, JavaScript ES modules, `pg`, bcrypt, JWT | Contrary to the plan's assumption, this is not a TypeScript/Prisma backend. Keep Express; introduce types incrementally. |
| `backend/db/` | Three SQL schema files | Native UUID, timestamp, boolean and JSONB definitions. |
| `backend/src/utils/db.js` | PostgreSQL pool plus automatic schema creation | A second, incompatible schema uses text IDs/dates, integer booleans and serialized JSON. |
| `backend/test_schema.mjs` | Another copy of schema creation statements | Mutates a database; not an assertion-based test suite. Do not run as an audit check. |
| `dist/`, `dev-dist/`, `node_modules/` | Generated output/dependencies | Not source to port. |

The workspace root is not a Git repository; `mobile/.git` exists. Repository ownership/history must be reconciled before moving directories or creating a monorepo.

Other existing dependencies include Axios, Zustand, React Hook Form, Lucide, web Recharts/calendar/drag-and-drop, mobile SecureStore, Expo Notifications, native date picker and Victory Native. TanStack Query, Zod, Supabase SDK, Expo Router and Prisma are absent from the inspected manifests. Package presence alone does not establish feature completion or compatibility.

## Product and design interpretation

The target is one connected life-management app: goals inform tasks; tasks connect to projects/courses; focus records execution; analytics summarizes actual activity. Spiritual tracking is optional. Launch free; defer payments, Pro gates and predictive AI.

Use the screenshot for visual direction: forest green, muted backgrounds, compact rounded cards, generous spacing, clear progress and calm typography. Use the supplied official T/leaf assets for identity. The screen sheet uses a simpler leaf mark, so its iconography should not replace the supplied branding.

The screenshot's tab labels vary, while the brief proposes Home / Tasks / Focus / Analytics / Profile. Proposed resolution: use that consistent five-tab structure, with Goals, Study, Projects and optional Spiritual accessible from Home/module navigation. This is a proposed specification choice, not an implemented change.

The logo visibly includes a checkerboard pattern; verify actual transparency before placing it on app surfaces. The supplied rounded icon also needs launcher-safe padding/background verification. Preserve original artwork and prepare platform derivatives deliberately.

Screens missing from the reference sheet still need design: password recovery, detail/edit forms, preferences, history, offline/error/empty states, and dark mode.

## Reuse classification

| Area | Classification | Work required |
| --- | --- | --- |
| Express routing/controller/model separation | KEEP | Retain framework and useful module boundaries. |
| PostgreSQL entities and relationships | KEEP concepts / REFACTOR implementation | Preserve IDs and useful records through explicit migrations. |
| Task filters and goal/project task associations | REFACTOR | Add ownership, validation, course links and reliable completion timestamps. |
| Milestone progress, recurring tasks, streaks | REFACTOR | Extract testable rules; check date boundaries, transactions and duplicate creation. |
| Course, assignment, exam, journal and project services | REFACTOR | Keep business workflows, validate parent ownership and typed contracts. |
| Axios services, Zustand, mobile SecureStore | KEEP patterns / REFACTOR contracts | Standardize responses; introduce server-state caching and refresh/session handling. |
| Export/account deletion and preferences | REFACTOR | Existing routes/models are worth preserving; audit coverage and behavior. |
| Web UI components | KEEP as interaction reference | DOM components cannot be reused directly as native components. |
| Old cyan/navy UI and mobile navigation shell | REPLACE | New design tokens, shared native components and agreed route structure. |
| Placeholder onboarding/dashboard | REPLACE | Persist focus areas/preferences and aggregate authenticated user records. |
| Mobile timer engine | REPLACE | Persist timestamps, pause/resume, background recovery, context and idempotent logging. |
| Automatic schema initialization | REPLACE | Versioned migrations and readiness checks. |
| Default JWT secret, arbitrary update fields, unprotected internal operations | REMOVE in implementation phase | Replace with validated configuration and explicit authorization. |
| Starter artwork, duplicate schemas and obsolete output | REMOVE only after replacement is verified | No deletion performed during this audit. |

## Authentication and security findings

1. **Critical: missing ownership checks.** `tasksController.js` updates/deletes by ID without comparing the authenticated user; `tasksModel.js` writes with `WHERE id` only. Similar gaps exist in goal/milestone and assignment paths. Authentication middleware alone does not prevent another logged-in user from operating on a known foreign ID. Add user scope to database operations and validate linked parents.
2. **Critical: unsafe update fields.** Models such as tasks, assignments and exams interpolate request body keys into SQL column expressions. Values are parameterized, identifiers are not. This permits mass assignment and creates SQL injection risk. Enforce a strict allowed-field schema; never accept ownership/identity fields from clients.
3. **Critical: hard-coded JWT fallback.** Both auth controller and middleware allow a predictable fallback signing secret. They also read environment at module initialization, before `server.js` calls `dotenv.config()`, making `.env` loading order material. Database configuration has the same initialization-order concern. Fail startup on missing configuration and load it before dependent imports.
4. **High: secret exclusion gap.** Root `.env` and backend `.env` exist; root `.gitignore` does not exclude them. This is a future commit risk, not evidence of a past leak. Actual values were not included in this report.
5. **High: database TLS verification disabled in production.** Pool configuration uses `rejectUnauthorized: false`. Configure verified certificates for the target service.
6. **High: internal notification operation exposed to ordinary authentication.** `/notifications/cron/check-all` has no distinct administrative/service authorization in its controller.
7. **Incomplete auth lifecycle.** Current auth is bcrypt/password + custom JWT with login/register routes. No password recovery, email verification, refresh-token rotation or Supabase identity integration was found in these auth routes. SecureStore persistence is useful but hydration trusts token presence.
8. **Hardening needed.** Open CORS, limited input validation, no auth rate limiter in server setup, and raw error messages in the error handler. Web tokens use localStorage. These need review appropriate to the final deployment.

The focus-session create controller already validates task ownership: reuse this intent consistently elsewhere. No RLS policies were found in the inspected SQL. Direct Supabase client access must wait for tested ownership policies; retaining a privileged API still requires server-side ownership enforcement.

## Database and existing data

Existing entities: users, goals, milestones, tasks, projects, project_milestones, courses, assignments, exams, study_sessions, spiritual_logs, bible_study_plans, bible_study_entries, streaks, journal_entries, focus_sessions, notifications, user_settings and notification_preferences.

The SQL files and runtime schema disagree on fundamental types and constraints. Runtime schema creation does not reproduce the indexes from the SQL files. `CREATE TABLE IF NOT EXISTS` does not reconcile existing columns. Milestone logic also mixes boolean inputs with integer comparisons. A database created from one source can behave differently from one created from the other.

| Current data | Proposed treatment |
| --- | --- |
| `users` | Map legacy IDs to Supabase identities/profiles; plan account transition before changing foreign keys. Do not assume password hashes can simply be copied into the new login flow. |
| Goals/projects and their milestones | Retain valid records; add agreed priority/start/update fields and completion semantics. |
| Tasks | Preserve one task record per item; add course relationship, category and `completed_at`. Normalize statuses intentionally. |
| Study sessions | Preserve subject/history; add optional course/task links without guessing from names. |
| Courses/assignments/exams | Preserve history and parent IDs; extend term, description, status/results where needed. |
| Spiritual logs/journals | Map to activities/reflections; preserve privacy and history. Add custom activities beyond the current three-type constraint. |
| Focus sessions | Preserve duration/history; add start/end/status and goal/project/course associations. Document units. |
| Settings | Extend to light/dark/system, module visibility, onboarding state, timer preferences and timezone. |
| Notifications | Preserve useful preferences; add delivery/scheduling metadata and device-token handling. |

Confirmed demo data exists in `dashboardController.js`: fixed counts, dates, tasks and progress. Its route is public and the mobile dashboard consumes it. Replace this with user-scoped aggregation; do not migrate those examples as personal records.

This audit inspected local data definitions and embedded examples, not live PostgreSQL rows. Live row counts, actual deployed schema, duplicates, orphaned relationships and production/test provenance remain unverified. Before migration, use a direct read-only database connection (not the application DB module, which performs DDL), inspect metadata/counts without exposing private journals, back up data, and rehearse transformations on a separate copy. Never infer that existing records are disposable.

Analytics already queries stored activity, but task completion is grouped by due date and completed goals by creation date. Those are not completion timestamps. Historical completion dates cannot safely be invented; mark unknown history and compute new metrics from captured events.

## API inventory

Current prefix is `/api`, not the README's `/api/v1`.

| Group | Existing endpoints (relative to `/api`) |
| --- | --- |
| Health/auth | GET `/health`; POST `/auth/register`, `/auth/login` |
| Dashboard | GET `/dashboard/summary` (sample response, no auth) |
| Goals | GET/POST `/goals`; PUT/DELETE `/goals/:id`; POST `/goals/:id/milestones`; PATCH `/goals/milestones/:id/toggle` and `/milestones/:id/toggle` |
| Tasks | GET/POST `/tasks`; PUT/DELETE `/tasks/:id`; GET `/tasks/project/:projectId`, `/tasks/goal/:goalId` |
| Courses | GET/POST `/courses`; PUT/DELETE `/courses/:id` |
| Assignments/exams | GET/POST each collection; PUT/DELETE each `/:id`; GET each `/course/:courseId` |
| Study sessions | GET/POST `/study-sessions`; PUT/DELETE `/:id`; GET `/weekly-hours` |
| Spiritual | GET/POST `/spiritual/prayer`, `/spiritual/devotion`; GET/POST `/spiritual/journal`; GET/PUT/DELETE `/spiritual/journal/:id` |
| Bible plans | GET/POST `/bible-plans`; PUT/DELETE `/:id`; GET/POST `/:id/entries` |
| Streaks | GET `/streaks`, `/streaks/:type`; POST `/streaks/update` |
| Projects | GET/POST `/projects`; GET/PUT/DELETE `/:id`; GET `/:id/tasks`; GET/POST `/:id/milestones`; PATCH `/milestones/:id/toggle` |
| Focus | GET/POST `/focus-sessions`; GET `/today-stats`, `/analytics` |
| Analytics | GET `/analytics` and `/productivity`, `/goals`, `/study`, `/spiritual`, `/review` |
| Notifications | GET collection and `/unread-count`; POST `/check`, `/cron/check-all`; PUT `/:notificationId/read`; DELETE `/clear-all` |
| Settings | GET/PUT `/settings/profile`, `/display`, `/notifications`; GET `/export`; DELETE `/account` |

Grouped suffixes apply to their group prefix. Auth and domain endpoints currently return inconsistent envelopes; normalize with adapters during migration so the legacy clients do not break unexpectedly.

## Environment and infrastructure

Current web variable names: `VITE_API_URL`, `VITE_APP_NAME`, `VITE_APP_VERSION`. Mobile reads `EXPO_PUBLIC_API_URL`, with a localhost fallback unsuitable for a physical Android device. Backend reads `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `NODE_ENV`.

Planned client configuration adds `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Privileged keys, if needed, stay server-side. Examples should contain variable names with empty values.

Missing or not evidenced in the inspected project: versioned migration workflow, meaningful automated backend tests, ownership tests, unified CI, EAS release configuration, Supabase Auth/Storage/RLS setup, crash monitoring, persistent offline mutation handling, complete push scheduling, and tested backup/restore procedures. Installed Expo Notifications does not by itself establish a notification delivery system.

## Verification performed

- Mobile TypeScript check (`node node_modules/typescript/bin/tsc --noEmit` from `mobile/`): passed.
- Root `npm run lint`: failed with 155 errors and 9 warnings. Findings include incorrect lint environments for Node code, generated `dev-dist` files being linted, and source issues. These are baseline findings, not regressions introduced by this audit.
- No database-mutating schema script, application server, device build or end-to-end test was run. Runtime behavior and live data remain unverified.
- Image transparency metadata verification could not run because Python Pillow is unavailable; visual review used the supplied images. No dependency was installed for the audit.
- Existing export code omits courses, milestones, Bible plans/entries and preferences, among other entities. Its route exists, but it is not yet a complete account export.

## Proposed structure and starting sequence

Keep the present top-level locations initially to avoid mixing a folder migration with functional changes:

```text
src/                         legacy web reference
mobile/
  app/                       proposed Expo Router routes
  src/components/ui/         shared native primitives
  src/theme/                 tokens and light/dark/system provider
  src/features/              domain screens, hooks and forms
  src/services/              API/auth adapters
  src/stores/                client-only state
  assets/branding/            supplied logo, icon and splash derivatives
backend/
  src/routes/ controllers/ models/
  src/services/              extracted business rules
  src/validation/            request schemas
  db/migrations/             single authoritative migration history
  tests/                     contracts, ownership and business rules
docs/                        specification and migration decisions
```

Exact proposed first implementation slice:

1. Preserve the current source and mobile Git history; establish root source control and safe ignore rules before committing anything.
2. Write the agreed MVP screen map, five-tab navigation, optional-module behavior and acceptance criteria. Separate beta scope from public-release account/data requirements.
3. Record baseline checks and known failures. Read the versioned Expo 56 documentation required by `mobile/AGENTS.md` before changing mobile code.
4. Set up validated environment handling, lint/typecheck scripts and explicit development API configuration. Do not connect a new client to production by default.
5. Reuse the installed Expo/TypeScript/NativeWind foundation; establish green light/dark/system tokens and a small shared component set. Integrate official assets after transparency checks.
6. Migrate the navigation shell to Expo Router in an isolated change, preserving screen workflows as reference. Add the planned server-state/form tools only for their specific caching and validation roles.
7. In the following backend foundation slice, fix ownership and update validation, consolidate schema/migrations, and design identity mapping before Supabase cutover. Retain Express; defer Prisma conversion until the real schema has been introspected.
8. Deliver the first complete journey: sign up/sign in -> optional focus-area selection -> persisted preferences -> dashboard with honest empty states -> create/complete a task -> dashboard reflects stored data.

Proceed next with goals/tasks, study/projects, optional spiritual tracking, a reliable linked timer, analytics and notification delivery. Test ownership and data integrity before exposing any rebuilt flow to real users.

Principal migration risks: identity/FK remapping, UUID/text and JSON/boolean conversion, timezone interpretation of text dates, unknown historical completion times, duplicate recurring tasks, stale legacy clients, and confusing sample dashboard values with real records. Each requires an explicit migration or compatibility decision rather than a blanket rewrite.
