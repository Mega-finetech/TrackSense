# Supabase post-auth diagnosis — 2026-09-18

## Confirmed cause and evidence

`mobile/.env` supplied `EXPO_PUBLIC_API_URL=http://192.168.0.200:4000/`, without `/api`. The app used that value unchanged. After Supabase signup/login, `acceptProviderSession()` posted to `/auth/supabase/session`; Express mounts that route at `/api/auth/supabase/session`.

Live probes reproduced HTTP 404 (HTML) at the old URL and HTTP 401 (JSON, without credentials) at the correct URL. The backend has no general request logger, so the unmatched 404 did not reach its identity route or error middleware. This explains the quiet terminal; it does not prove that no HTTP request was sent. The original mobile device request was not captured.

The response interceptor unwraps `response.data`; auth service then reads the backend envelope's `data`. This shape and the `Authorization: Bearer <Supabase access token>` format are correct. The original form treated errors from account creation and subsequent linking as a single signup failure.

Backend `/api/auth/config` reports `supabase`; mobile and backend project origins/public keys match (compared without printing). `/api/health` returns 200. Invalid tokens are rejected with 401 at both linking and `/auth/me`.

Read-only SQL verified the database name is `tracksense` and found **0 users and 0 auth_identities**. Therefore the reported Supabase signup had not created a local TrackSense account at inspection time. No duplicate profile was inserted. An initial history lookup used the wrong table name (`schema_migrations`); the actual migration-status command then confirmed both migrations in `tracksense_migrations`, with no pending changes. No migrations were applied.

## Changes

- Private `mobile/.env`: corrected only `EXPO_PUBLIC_API_URL` to include `/api`. The IP remains environment configuration, not application source.
- `mobile/src/services/apiUrl.ts` and `constants/index.ts`: normalize a server origin to its `/api` base, preserve an explicit base path, reject credential-bearing or invalid URLs, and report the development API source/base.
- `services/authDiagnostics.ts`: development-only stage labels and allowlisted error codes/statuses. Never serialize errors, request/response bodies, identities, or headers.
- `services/auth.ts` and `postAuth.ts`: distinguish provider signup success, missing session/email verification, session retrieval, and backend linking. Post-signup failures explicitly say the account was created and direct the user to sign in.
- `stores/authStore.ts`: log preference loading, session saving, auth state update/restoration; preserve the post-signup message if subsequent local setup fails.
- `features/auth/AuthForm.tsx`: safe failure diagnostics; replace the signup action with “Continue to sign in” after an existing-account or post-signup failure. Existing account linking still requires the legacy password on sign-in.
- `app/_layout.tsx`: log the guarded onboarding/dashboard navigation decision. Navigation still follows authenticated state and persisted onboarding preferences.
- `backend/src/routes/authRoutes.js`: development logs for received link requests, verified provider session, completed mapping, and safe failures. Existing transactional identity mapping and duplicate protection remain intact.
- `backend/tests/foundation.test.js`: explicitly select legacy mode for the legacy middleware test so local Supabase configuration cannot change its behavior.
- `mobile/tests/post-auth.test.mjs`: regressions for API routing, post-signup success/failure, confirmation, duplicates, and diagnostic redaction.
- `backend/scripts/verify-supabase-link.js`: real-service login/link/refresh/logout/login/database duplicate check using the existing disposable account, without registration or deletion.

## Checks and actions

- Read the specified source, auth components/layout, environment configuration (redacted), migration tooling, and Expo instructions.
- Read-only HTTP probes: old/new link routes, provider config, health, and invalid-token rejection.
- Read-only SQL: database identity and aggregate account/mapping counts; `npm run db:status` passes, both migrations applied.
- `npm test` in backend: initial sandbox spawn EPERM; elevated run exposed 1 legacy test configuration failure. After test isolation fix, **40/40 pass**.
- `npm test` in mobile: initial sandbox spawn EPERM; elevated run **9/9 pass** (4 existing timer tests, 5 post-auth tests).
- `npm run typecheck`: passes.
- Live script: `node scripts/verify-supabase-link.js` stops safely before login because dedicated test credentials are unavailable.
- Web export passes (`node node_modules/expo/bin/cli export --platform web --output-dir web-preview`, process-only legacy fixture provider/API settings). `node tests/browser-smoke.mjs` passes auth, onboarding, tasks, planning, milestones, editing, theme and logout. The private environment remains Supabase with the corrected API URL. Fixtures are not real Supabase or persistence evidence.
- `node --check` passes for the backend route and new live verification script. Final TypeScript check passes after the form change.

## Remaining live verification

Do not register the existing account again. Provide `TRACKSENSE_TEST_EMAIL` and `TRACKSENSE_TEST_PASSWORD` privately in `backend/.env`, then run `node scripts/verify-supabase-link.js` from backend. Remove those temporary test credential variables after testing. It retains the intended existing account/profile and signs out only its own test session.

Restart/reload the backend normally to load route diagnostics. Restart Expo with `npx expo start --clear` from mobile so the corrected public environment value is compiled. Sign in using the already-created account. Expect `SESSION_AVAILABLE`, `BACKEND_LINK_START`, backend `BACKEND_LINK_RECEIVED` → `SUPABASE_SESSION_VERIFIED` → `BACKEND_LINK_OK`, then mobile `AUTH_STORE_UPDATED` and `NAVIGATION_START_ONBOARDING` (or dashboard for an onboarded account).

Valid-account hosted login, actual linking/duplicate prevention, device onboarding, close/reopen restoration, and logout/login remain unverified until account access/device interaction is available. No success is inferred from fixtures or contract tests. No Study, Spiritual, Analytics redesign, unrelated database access, data cleanup, destructive SQL, or duplicate signup was performed.
