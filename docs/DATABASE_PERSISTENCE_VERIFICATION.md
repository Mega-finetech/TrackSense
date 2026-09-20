# Database integration and persistence verification — 2026-09-17

## Current result: PASS after configuration was updated

Verified against **the live `tracksense` database on PostgreSQL 17.11** using the actual Express backend and PostgreSQL driver. No browser fixtures, mock database or in-memory substitute was used for the live checks. The historical failed-authentication investigation below is retained for context; its blocker is now resolved.

### Migration and schema state

- Confirmed `current_database() = 'tracksense'` before test writes. No connections were opened to `bethel_drms`, `bethel_drms_shadow` or other databases.
- Initial read-only catalog inspection found zero non-system relations, including in non-public schemas. There was no application data or migration history in this database.
- Applied only `0001_initial.sql` through the transactional migration runner. This created the fresh schema; no reset, drop, truncate or conversion of existing data was performed.
- Final migration status: versioned; applied `0001_initial.sql`; **no pending migrations**.
- Final public schema has **20 tables including migration history, and 23 foreign-key constraints**. Relevant IDs are UUIDs, completion/read flags are booleans, `goals.updated_at` is TIMESTAMPTZ, and journal tags are TEXT[]. No Prisma client exists or needs regeneration.

### PASS/FAIL results

| Verification | Result | Evidence |
| --- | --- | --- |
| Database connection / target | PASS | Server-side target check; PostgreSQL 17.11 |
| Migration status | PASS | Baseline applied atomically; no pending migrations |
| Dedicated user registration/login | PASS | Two randomly named disposable accounts registered and logged in through HTTP |
| Authentication rejection behavior | PASS | Wrong password 401; duplicate registration 409; missing, malformed, expired and incorrectly signed tokens 401 |
| Goals CRUD | PASS | Create, read, edit, restart read, owner delete, subsequent 404/list absence |
| Goal milestones | PASS | Create, toggle completion, read after restart; goal deletion cascades milestones |
| Tasks and relationships | PASS | Create/edit/complete; same task returned through goal and project paths before/after restart |
| Projects and project milestones | PASS | Create/edit/read, milestone toggle, restart read and owner deletion |
| Focus sessions | PASS | Save, retry same session ID without duplication, restart read, direct PostgreSQL ownership query |
| Backend restart persistence | PASS | Stopped and relaunched this run's dedicated backend child process; logged in again and verified records |
| User B isolation | PASS | Lists exclude A's records; direct reads/updates/deletes/toggles and foreign parent links rejected; foreign focus links rejected; foreign session-ID reuse rejected |
| Non-destructive relationship behavior | PASS | Goal/project deletion preserves task and clears corresponding link; task deletion preserves focus history |
| Live SQL compatibility corrections | PASS | Notification read flags/count, journal TEXT[] insert/search and analytics aggregations succeed, including after restart |
| Existing backend regressions | PASS | **35 passed, 0 failed** after compatibility fixes |
| Test cleanup | PASS | Exact run-specific account IDs AND emails deleted transactionally; dependent-row absence checked; final global test-account-prefix count zero |
| Existing server on port 4000 | PASS | Left running; final `/api/health` returns HTTP 200 and database connected |

### Incompatibilities found and corrected

Read-only live queries initially reproduced PostgreSQL `42883` for integer comparisons against boolean columns in notifications/analytics and `LIKE` against the journal text array. Corrections are confined to existing backend SQL/data binding:

1. Notification unread/read queries now use PostgreSQL `FALSE` / `TRUE`.
2. Analytics completion aggregation now compares with `TRUE`.
3. Journal creation binds the tag array directly through `pg`, rather than JSON-stringifying it; tag search explicitly converts the array to text.

No table changes were required for these corrections. No screen or Study/Spiritual feature rebuild occurred. The live compatibility tests use only disposable journal/notification/activity records and remove them through account-scoped cleanup.

### Integration test additions and cleanup

Expanded `backend/scripts/verify-persistence.js`, invoked with `npm run test:persistence -- --run`, to enforce the `tracksense` target, exercise authentication rejection, verify task relationships, verify owner CRUD deletion and foreign-key behavior, test the corrected SQL paths, and clean up automatically even when a check fails. Generated passwords/tokens remain in memory and are not printed or written to disk.

Successful core run: `0e4576e3-11f7-48fb-9050-92091a6a2316`.

Successful expanded compatibility run: `bfef8cac-053b-41ac-937e-ea13437db0d7`.

Both runs returned `status: passed` and `cleanup: passed`. Cleanup deletes only users matching both the exact returned ID and the run-specific generated email, then checks dependent tables. Goal/project milestone deletion and surviving-task/focus link behavior were verified before final account cleanup. No existing user records were touched. The live runner is opt-in and separate from `npm test`.

### Commands/actions in this successful phase

1. `npm run db:status` and `npm run db:inspect`: confirmed initially empty schema.
2. Redacted Node/pg read-only checks: confirmed target `tracksense`, version 17.11, and absence of non-system relations.
3. `npm run db:migrate -- --apply`: applied only the pending fresh baseline.
4. `npm run db:status`: confirmed applied baseline/no pending migrations.
5. `npm run test:persistence -- --run`: core live integration and automatic cleanup passed.
6. Read-only live compatibility queries under savepoints: reproduced boolean/array SQL mismatches without modifying records.
7. Corrected the existing notification/analytics/journal model statements and expanded integration coverage.
8. `npm run test:persistence -- --run`: expanded live integration, process restart, isolation, compatibility and cleanup passed.
9. `npm test`: the sandbox initially blocked Node test workers with `spawn EPERM`; reran with approved escalation. All 35 regressions passed. Reran after compatibility fixes: all 35 passed again.
10. `node --check` for the integration script and changed model/controller files: syntax checks passed.
11. Final read-only migration/cleanup/privilege checks: no pending migrations, zero remaining test accounts, 23 foreign keys. Verified application role is not superuser, cannot create databases/roles, and cannot bypass RLS.
12. GET `http://127.0.0.1:4000/api/health`: existing backend remained healthy. Only temporary child backend processes were restarted.

### Security and limits

- Verified ownership at the actual HTTP/API/database boundary for the requested core records. This is not a certification of every untested endpoint or of direct Supabase access/RLS policies.
- The application role has no superuser, create-database, create-role or RLS-bypass privileges. Its ability to apply the fresh migration does mean it has schema-creation privileges; separating deployment and runtime privileges remains a production-hardening task.
- Replaced remaining raw error logging in settings, notification and analytics controllers with the existing secret-safe error-code helper.
- Secret values were not printed. Credentials, auth configuration and role grants were not changed in this phase.
- Existing dependency advisories, full account/session lifecycle hardening, concurrency/load behavior and untested legacy module business rules remain outside this verification. No claim of complete production readiness is made.
- No blockers remain for the requested core database/persistence checks. The SQL incompatibilities reproduced in this phase are fixed. The running port-4000 process may need its normal restart to load these model/controller edits; the live suite tested fresh child processes with the new code.

Recommended next phase: Supabase authentication/session lifecycle and cloud preferences integration, with explicit identity mapping and ownership tests. Do not assume this local schema is automatically ready for direct Supabase client access. Study/Spiritual and other UI work remain paused until the user approves the next phase.

## Historical investigation before the configuration update

Status: **blocked by an invalid database role configuration; live persistence is not verified.** No screen changes, Study/Spiritual work, migrations, role/password resets or user-data modifications were performed in this phase.

## Exact authentication diagnosis

The running local service is PostgreSQL 17 (`postgresql-x64-17`). The configured connection reaches the loopback server on port 5432. Client authentication returns SQLSTATE `28P01`. The PostgreSQL server log explicitly reports that the role named by the configured connection **does not exist**. This is stronger evidence than the client's generic password-authentication message; it is not evidence that an existing role's password is wrong.

The log was read locally and filtered programmatically. Only timestamp, cause category and authentication method were emitted. Role names, passwords, connection strings and unrelated log statements were not printed. Loopback authentication uses SCRAM-SHA-256. Authentication rules and PostgreSQL service configuration were not altered.

## Effective configuration and startup

- `backend/src/config/env.js` resolves `../../.env` relative to its own file, loading **backend/.env** regardless of the shell working directory.
- dotenv retains already-set process variables. This run had no inherited `DATABASE_URL` and no `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` or `PGSSLMODE` overrides. The effective URL matched `backend/.env`.
- Backend environment file keys: `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`. `NODE_ENV` was not production.
- Root `.env` contains only `VITE_API_URL`, `VITE_APP_NAME`, `VITE_APP_VERSION`; it is not the backend database source. `mobile/.env` was absent.
- `backend/.env.before-rebuild` contains the same database URL as the active backend file. No connection credential was changed during this investigation.
- The parsed URL contains username/password/database components, uses the PostgreSQL protocol, has no URL fragment or query parameters, and no surrounding whitespace in the parsed password. These structural checks do not validate a password.
- The backend passes the URL directly to node-postgres (`pg.Pool`); it does not build it from separate username/password variables.
- There is no Prisma schema, Prisma dependency or generated database client in the active backend. Client regeneration is **not applicable**.
- Startup imports the environment and routes, then initializes Express. Previously it listened without checking the database; `/api/health` always returned success. This phase adds a database probe before listening and a database-backed health response.

## Safe changes made

1. Startup refuses to listen if `SELECT 1` fails. Verified exit code 1 and redacted SQLSTATE `28P01` on the configured connection.
2. Added a 10-second pool connection timeout and a handler for idle-pool errors.
3. Replaced raw error logging with validated error codes, preventing driver messages, query details and connection data from being serialized into logs.
4. `/api/health` now returns 503 when its database probe fails.
5. Added `npm run db:status`: read-only catalog/migration-history inspection, history checksum validation and refusal to describe an unversioned/empty-history existing schema as ready for initialization.
6. Added `npm run test:persistence -- --run`: an opt-in real PostgreSQL/HTTP runner using two dedicated test accounts. It exercises registration/login, goal/project/task create/read/update, goal/project milestone creation/completion, idempotent focus saving, backend restart, record persistence and cross-account read/write/delete/parent-link rejection. It retains only its own generated records for evidence and does not print/save generated passwords or session tokens. No fixture server is used.

## Database and migration status

Only `backend/db/migrations/0001_initial.sql` is present locally. It is the fresh-database baseline. Applied migration history, actual database existence/schema and safe pending migrations **cannot be established before authentication succeeds**. The baseline was not run. No migration was applied, reset or stamped into history.

Source-level incompatibilities that must be checked against the real database:

- Historical runtime DDL uses text IDs/dates/JSON and integer flags; the baseline uses UUID/date/timestamp/JSONB/boolean types.
- The original canonical SQL omitted `goals.updated_at`, which the model writes; the new baseline includes it. Whether the live database has it is unknown.
- The legacy journal model serializes tags as JSON while the canonical/baseline schema uses a text array.
- Some legacy notification/analytics queries compare boolean-like columns with integer literals. Their compatibility depends on the actual schema.

These are repository findings, not claims that the inaccessible database has any particular schema. Existing tables must be inspected before any migration is selected.

## Commands and actions performed

All shell work occurred in the workspace or was read-only against local PostgreSQL configuration/logs. No credentials were placed on command lines.

| Command/action | Result |
| --- | --- |
| `Get-Content` on backend env loader/validator, pool, server, package, migration scripts, routes/controllers/models and example files | Traced active startup, connection and persistence paths; secret-bearing env file contents were never printed |
| `rg --files` for Prisma, migration, AGENTS and example/config files; `rg` for database/env constructors | Confirmed node-postgres backend and no Prisma setup |
| Node/dotenv inspection of root/backend/backup/mobile env files | Emitted variable names, presence/equality flags and redacted URL structure only; confirmed active source |
| `Get-Service '*postgres*'` and PostgreSQL installation/data directory listings | Confirmed running local PostgreSQL 17 and located its active log |
| Read `current_logfiles`; filtered active log and `pg_hba.conf` using Node | Confirmed nonexistent configured role and SCRAM authentication without exposing raw log content |
| `npm run db:inspect` | Failed `28P01`; no application records read |
| `npm start` after startup fix | Correctly refused startup, exit 1, `28P01` |
| `npm run db:status` | Failed `28P01`; migration state unknown; nothing applied |
| `npm run test:persistence -- --run` | Failed initial database preflight with `28P01`; zero completed checks, zero accounts created, zero records written |
| `npm test` | **35 passed, 0 failed**; includes authorization, environment/JWT, focus idempotency, disposable PGlite migration tests and secret-safe error reporting |
| `node --check` on server, migration-status and persistence scripts | Passed syntax checks |
| Local source/doc edits | Only backend diagnostics/startup/test tooling and documentation changed; no UI changes |

The first env-inventory command used some root-relative candidate paths while running from `backend/`, so those candidates were initially reported absent. A corrected inventory used `../.env`, `.env`, `.env.before-rebuild`, and `../mobile/.env`; all findings above use that corrected inventory.

## Live verification matrix

| Check | Status |
| --- | --- |
| Configured database authentication | **Failed: configured role does not exist** |
| Read-only migration/schema inspection | Blocked before catalog query |
| Safe pending migration application | Not attempted; pending state unknown |
| Dedicated-account registration/login | Not reached |
| Goal, milestone, task and project persistence | Not reached |
| Focus-session persistence | Not reached |
| Persistence after backend restart | Not reached |
| Second-user live read/write isolation | Not reached |

The 35 passing backend tests are regression/disposable-database tests. They are **not proof of live database integration**. No browser fixtures were used as persistence evidence.

## Remaining blocker and next action

Update the private `backend/.env` DATABASE_URL with a valid existing login for the intended development database. Do not paste credentials into chat. If the database/application role has not been provisioned, say so; provisioning requires a valid authorized administrative connection and confirmation of the intended database, not password guessing or disabling authentication.

After the configuration is corrected: rerun connection and read-only schema/status checks; review actual compatibility; apply only appropriate safe pending migrations; rerun the backend suite and real persistence runner; record exact results here. Study and Spiritual remain paused pending completion of this phase and the user's approval.
