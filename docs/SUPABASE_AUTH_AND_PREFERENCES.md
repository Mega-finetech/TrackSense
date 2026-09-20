# Supabase authentication and account preferences

## Implementation status

Account preferences are implemented and verified against the live local `tracksense` PostgreSQL database. Supabase authentication code is implemented behind an explicit provider setting, but **hosted Supabase verification is pending configuration**. No project URL/key was present in the environment when this phase began. Existing legacy authentication remains active; real credentials and connection settings were not changed.

No Study/Spiritual or other application screen redesign was performed. Authentication-only flows were added using the existing components: email verification, secure legacy-account linking, and email-code password recovery.

## Data and identity design

- `0002_identity_preferences.sql` adds `auth_identities` and `account_preferences`. It does not rewrite existing users, passwords, goals or other records. The migration was rehearsed against existing test records before it was applied to `tracksense`.
- Supabase identities are keyed by the configured project origin and provider subject, mapping to the existing internal `users.id`. Core resource ownership remains attached to that internal ID.
- A verified provider email does **not** automatically claim an existing TrackSense account. Linking requires the current legacy password. A unique constraint prevents a second identity from claiming an already-linked account in the same project.
- Brand-new provider accounts receive a new internal ID and a random unshared bcrypt credential; their real password remains managed by Supabase.
- In Supabase mode, protected requests are verified against the configured project's `/auth/v1/user` endpoint before identity lookup. The backend does not trust decoded client claims, user metadata for ownership, or a user-supplied issuer.
- Legacy registration/login endpoints are disabled in Supabase mode. Leaving `AUTH_PROVIDER` unset preserves the working legacy mode; no automatic provider fallback occurs.
- This phase uses Supabase for Auth only. Application data continues through the Express API and its configured PostgreSQL connection. It does not migrate the local database to hosted Supabase or implement direct client Data API access/RLS.

## Account-synced preferences

`GET /api/preferences` returns the signed-in user's preferences or null. `PUT /api/preferences` accepts only `focusAreas`, `onboarded`, `theme`, and `revision`.

The database stores selected focus areas (including an empty selection), onboarding completion, and light/dark/system theme. Each save increments a revision; stale saves return 409 rather than silently replacing another device's choices. Supplying a different user ID is rejected. Query parameters cannot select another account.

On sign-in the mobile app loads the server preferences. If no server record exists, it seeds from the same account's local preferences. A local cache remains available if synchronization fails; offline edits are not silently queued or reported as saved. Profile displays synchronization failures with a reload action. Signing out resets the active account's preference state. Concurrent account switches use explicit request credentials and generation checks to keep preferences scoped correctly.

The live tests verify preferences through HTTP before/after restarting a dedicated backend process, along with stale-write rejection and two-user isolation. The database is local during these tests; hosted deployment and physical cross-device behavior are not claimed as verified.

## Configuration required to enable hosted Auth

Create or select a **development** project in the [Supabase dashboard](https://supabase.com/dashboard). Do not paste credentials into chat. Enter configuration only in the private local environment files.

| File | Variable | Purpose |
| --- | --- | --- |
| `backend/.env` | `AUTH_PROVIDER` | Set to `supabase` when ready; default is `legacy` |
| `backend/.env` | `SUPABASE_URL` | Project origin from the dashboard |
| `backend/.env` | `SUPABASE_PUBLISHABLE_KEY` | Public publishable key; `SUPABASE_ANON_KEY` is supported for older projects |
| `mobile/.env` | `EXPO_PUBLIC_AUTH_PROVIDER` | Set to `supabase` for the matching mobile build |
| `mobile/.env` | `EXPO_PUBLIC_SUPABASE_URL` | Same project origin |
| `mobile/.env` | `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Same public key; `EXPO_PUBLIC_SUPABASE_ANON_KEY` is also supported |
| `mobile/.env` | `EXPO_PUBLIC_API_URL` | Reachable TrackSense API URL, including `/api` |

Keep the existing `DATABASE_URL` and `JWT_SECRET` private. Do not replace the PostgreSQL connection merely to enable Supabase Auth. Neither the mobile app nor this Auth verifier needs a service-role/secret API key. The mobile client rejects secret/service-role keys.

Enable email/password authentication and email confirmation in the development project. For the in-app code flows, configure both confirmation and recovery email templates to include **`{{ .Token }}`**. The recovery screen verifies an email recovery code before updating the password. Default link-only recovery templates will not supply the code this implementation requests. Automatic deep-link session handling and social OAuth are not implemented in this phase.

Restart the backend to load new environment variables/code, and restart/rebuild Expo after public variable changes (clear Metro cache when changing providers/project values). Both server and mobile provider settings must match. An existing port-4000 server was not stopped by the tests; it needs its normal restart to serve the newly added endpoints.

## Verification completed

- **40 backend regression tests passed**, including provider-verification contract tests, rejection of unverified identities, account-link/password protection, identity uniqueness, preference validation/ownership/conflicts, and preservation of existing records across the additive migration.
- Provider HTTP responses in contract tests are test doubles. They do not prove hosted Supabase login or email delivery.
- Live PostgreSQL/HTTP integration passed with run `9e2f5092-4672-44e3-9e5e-6c560f7b0853`: preferences persisted across backend restart, ownership reassignment and stale writes were rejected, and the existing goals/tasks/projects/focus/auth checks still passed. Disposable accounts and dependent rows were cleaned up.
- Live migration status: `0001_initial.sql` and `0002_identity_preferences.sql` applied; no pending migration.
- Mobile TypeScript, web export and Android JS/assets export passed. The fixture-based browser regression passed with the new preference endpoint covering existing auth/onboarding/tasks/planning/theme/logout flows. That browser run is UI regression evidence, not hosted Auth evidence; no Android device run was performed.
- Installed mobile `@supabase/supabase-js` for session lifecycle handling. Backend verification uses Node's built-in HTTP client, avoiding an extra server dependency. The backend SDK install was not executed because automatic approval review timed out twice; the native HTTP implementation resolves that installation obstacle.
- The mobile install still reports 28 dependency advisories (16 moderate, 12 high); dependency triage remains pending.

## Hosted verification still required

With development configuration and email templates ready, verify signup/confirmation, login, email-code password recovery, access-token refresh across app foreground/background, sign-out, restoration after relaunch, legacy-account linking without changed IDs, and cross-user rejection against the actual Supabase project. Check native SecureStore session persistence and network-error behavior on Android. No hosted Auth success, email delivery, remote sign-out semantics, or device verification is claimed yet.

Local sign-out uses Supabase's local-session scope; it is not a global sign-out of all devices. Provider access-token expiration and account lifecycle behavior must be tested before production. No account deletion/data migration to Supabase Storage or hosted PostgreSQL is included.

After hosted validation, harden deployment/runtime grants and complete the separate Supabase Data API/RLS plan if direct client access is ever introduced. Study and Spiritual remain paused pending approval.

## References

- [Supabase React Native Auth](https://supabase.com/docs/guides/auth/quickstarts/react-native)
- [Supabase JWT verification through the Auth server](https://supabase.com/docs/guides/auth/jwts)
- [Supabase password authentication and recovery](https://supabase.com/docs/guides/auth/passwords)
- [Supabase authentication state events](https://supabase.com/docs/reference/javascript/auth-onauthstatechange)
- [Expo SDK 56](https://docs.expo.dev/versions/v56.0.0/)
