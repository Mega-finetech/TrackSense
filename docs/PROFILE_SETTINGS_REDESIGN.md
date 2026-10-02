# Profile and Settings implementation

## Scope

The user explicitly expanded this pass beyond UI to implement missing profile uploads, notification preferences, deletion and export. Existing theme/preferences connections, sign-out implementation and navigation routes are retained. Supporting muted text is intentionally stronger than the very faint reference colors for readability. Bottom navigation geometry is unchanged.

## Completed

- StyleSheet Profile screen: avatar/initials, grouped setting rows, themed colors, version, confirmation-based sign-out.
- Edit Profile modal: name and bio validation, email read-only, API save and local session name refresh.
- Expo photo picker and Supabase Storage upload integration (public avatars, owner-only writes; hosted configuration still required).
- Light/Dark/System picker using existing setMode/preferences flow, including sync retry.
- Per-account notification preferences with the original assignment toggle preserved, plus focus completion and weekly review.
- Device-local reminder scheduling: future tasks, exam/goal alerts three days before, today's unlogged spiritual practice, current running focus timer and next Sunday review. Refreshed on foreground, relevant data changes and preference changes. Scheduled entries are capped at 50; this is not a server push/background summary service. Date-only task reminders use 09:00 local time, reflection 21:00 and weekly review Sunday 18:00. Weekly notification opens an invitation to review, not a generated statistical summary.
- JSON export via browser download or native share sheet, including courses, child milestones, Bible entries and preferences omitted by the previous exporter. Password hashes/provider credentials are excluded.
- Confirmed account deletion: exact current email required; durable queue; account locked immediately once accepted; provider/storage cleanup before local cascade. Failed provider cleanup remains pending and can be retried. Missing service-role configuration rejects the request before deleting data.
- API authentication checks account existence/deletion state, so old local tokens cannot continue after deletion. Provider provisioning checks the deletion ledger to prevent stale identity recreation.

## Database / verification

Only the development `tracksense` database was used. Applied additive migration `0003_profile_settings.sql`: bio, focus/weekly preference columns and deletion queue. Migration status is current with no pending migrations. No existing user was deleted; disposable verification accounts were cleaned up.

- PASS: backend regression suite, 41/41 (includes PGlite ownership/export/deletion retry tests).
- PASS: mobile tests, 13/13 (includes reminder planning tests).
- PASS: TypeScript.
- PASS: web export.
- PASS: `node scripts/verify-settings.js`: real PostgreSQL profile/bio, preference saves and export isolation, inside a rolled-back transaction.
- PASS: `node scripts/verify-settings-api.js`: isolated loopback API with disposable users; anonymous rejection, profile update/read, owner isolation, preference save, export, deletion confirmation and invalidated deleted-user token. Legacy fixture authentication; no hosted Supabase account deleted.
- PASS: browser smoke suite including Profile edits, notification preference saving, theme changes, sign-out cancellation/confirmation and the prior app regressions. Fresh 390px light/dark captures reviewed. Existing bottom-nav checks also pass at 390px and 320px. Browser data is fixture-only.
- PASS: Android JavaScript/Hermes export (3,945 modules). This is a bundle check, not a native install/device test.
- Physical Android, native photo picking/sharing, notification delivery and hosted Supabase deletion/upload are not yet verified.

Initial checks exposed expected migration/auth test assumptions; tests were updated to cover the additive column and asynchronous account-status validation. The first browser run required its exact-text Theme selector to use the row's accessible label. A root-directory npm test and a wrong-relative-path script invocation did not run tests; corrected backend/mobile invocations above were used.

## Files

Mobile: `src/features/profile/ProfileScreen.tsx`; `src/services/profile.ts`, `reminders.ts`, `reminderPlan.ts`; `src/components/ReminderSync.tsx`; root layout mounting reminder synchronization; FocusScreen reminder refresh after timer persistence; package files/app.json; browser harness and reminder tests.

Backend: settings controller; `services/profileSettings.js`, `accountDeletion.js`; authentication middleware and provider provisioning checks; notification generation now honors stored opt-outs; additive migration; tests; `scripts/verify-settings.js`, `verify-settings-api.js`, `process-account-deletions.js`; `db/supabase-avatars.sql`.

## Remaining configuration / limits

1. Configure the server-only `SUPABASE_SERVICE_ROLE_KEY` securely. It was checked only for presence and is currently absent. Never put it in an EXPO_PUBLIC variable. Hosted deletion cannot complete until this is configured.
2. Review/apply `backend/db/supabase-avatars.sql` in the intended hosted project: public avatars bucket, 5 MB image limit and per-subject write policies. This SQL has not been applied. Public URLs are suitable only for photos the user intentionally makes public; uploads use the current Supabase user folder. Photo replacement uploads immediately when selected, before Save Changes.
3. Arrange recurring execution of `node scripts/process-account-deletions.js` on the backend host for retrying pending requests. This worker has not been scheduled or run against existing accounts. It handles only requests already confirmed through the endpoint. Minimal identity subjects remain in the deletion ledger to prevent reprovisioning.
4. Provide `EXPO_PUBLIC_PRIVACY_URL`, `EXPO_PUBLIC_TERMS_URL` and `EXPO_PUBLIC_SUPPORT_URL`; no destinations were invented. Unconfigured links report that they are unavailable.
5. Restart the development backend to ensure it loads the new handlers if it is not running with automatic reload. The existing port-4000 process was not stopped; live API tests used a temporary loopback listener.
6. Build/reload the native app for the new image-picker/sharing/notification plugins. Check permission denial, narrow layout, keyboard, uploads, exports and real notification delivery on Android. The Focus Timer's existing ambient-sound control remains unchanged; focus completion alerts use the notification preference.
7. Notification scheduling refresh failures do not alter persisted preferences. Device delivery depends on permissions/OS scheduling and reopening the app to refresh later reminders; no background cron/push service was added.

Dependency installation reported 22 audit findings (17 moderate, 5 high). No unrelated automatic audit fixes were applied.

## References used

- Expo project-required SDK reference: https://docs.expo.dev/versions/v56.0.0/
- Image picker: https://docs.expo.dev/versions/latest/sdk/imagepicker/
- Notifications: https://docs.expo.dev/versions/latest/sdk/notifications/
- Supabase admin deletion: https://supabase.com/docs/reference/javascript/auth-admin-deleteuser

## Screenshots

At `mobile/artifacts/`: `profile-light.png`, `profile-dark.png`, `profile-lower-light.png`, `profile-lower-dark.png`, plus `profile-edit-{light,dark}.png`, `profile-notifications-{light,dark}.png`, `profile-privacy-{light,dark}.png` and `profile-about-{light,dark}.png`.
