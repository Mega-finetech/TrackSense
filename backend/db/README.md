# TrackSense database setup

`migrations/` is the versioned source for **fresh PostgreSQL 13+ development databases**. The root SQL files are historical references, not additional setup steps. The baseline combines the original UUID schema, settings and notifications, and adds `goals.updated_at`, which the API already writes.

From `backend/`:

```powershell
npm run db:inspect
npm run db:status
npm run db:migrate -- --apply
```

Set the intended development connection in private `backend/.env` first. The inspection command reads catalog metadata in a read-only transaction with a timeout. It does not select application records or print credentials. PostgreSQL error `28P01` means the configured login was rejected.

The migration command requires the explicit `--apply` argument and uses a dedicated connection, a transaction advisory lock, lock/query timeouts and a single transaction for all pending files and their history. It refuses any existing public tables/views/sequences without a migration history. Applied file checksums are normalized for Windows line endings; editing or reordering previously applied migrations is rejected. Add a new numbered SQL file for future changes. Never manually create or modify the history to bypass these checks. Use transactional SQL only; do not put BEGIN/COMMIT or nontransactional commands in migration files.

## Existing databases

Do not run the baseline SQL directly against an existing database. First inspect metadata, make a verified backup, and rehearse conversion on a separate copy. The older runtime schema uses text IDs/dates/JSON and integer flags; it cannot safely be stamped as the UUID baseline. The data conversion and legacy-to-Supabase identity mapping remain unimplemented.

The fresh baseline and core persistence have been verified against the live development database. Notification/analytics boolean comparisons and journal text-array binding/search were corrected and tested. Preserved legacy modules still need broader business-rule verification before beta. A successful schema setup does not certify all old endpoints or provide Supabase RLS. Do not expose these tables directly through a public client.

## Tests

After the intended development database connects and its schema has been reviewed, `npm run test:persistence -- --run` performs opt-in live HTTP/database checks. It requires the database name `tracksense`, creates two random dedicated test accounts, verifies core writes and ownership, restarts only its own child backend process, and checks records again through HTTP and direct PostgreSQL queries. Test records are cleaned up transactionally using each account's exact ID and run-specific email; generated passwords/tokens remain in memory and are not printed or saved. It also tests goal deletion, foreign-key behavior and the corrected legacy SQL paths. The test never migrates schemas and refuses `NODE_ENV=production`. A failed connection means no persistence test passed. The backend refuses startup when its database connection fails, and `/api/health` checks actual database connectivity.

`npm test` runs authorization/unit tests and actual migration SQL in disposable in-memory PostgreSQL using [PGlite](https://pglite.dev/docs/). Migration tests never connect to `DATABASE_URL`. They cover initialization, repeat runs, core record constraints/cascades, refusal to overwrite existing records, rollback after SQL failure and history drift. Remote TLS, multi-connection lock contention and existing-data conversion still need integration testing on the chosen development service.

Transaction locking reference: [PostgreSQL advisory locks](https://www.postgresql.org/docs/17/explicit-locking.html#ADVISORY-LOCKS).
