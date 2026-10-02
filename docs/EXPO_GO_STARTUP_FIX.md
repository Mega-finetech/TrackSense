# Expo Go notification startup fix

## Root cause and change

ReminderSync and reminders eagerly imported expo-notifications. The root layout imports ReminderSync, and Focus/Profile import reminders, so native notification module initialization could fail before those route modules finished evaluating. Checking Platform.OS inside an effect/function was too late. The resulting default-export/ErrorBoundary warnings were consistent with that failed import chain; the route files themselves already export valid components.

Created:
- mobile/src/services/notificationsRuntime.ts: Expo-supported runtime detection and lazy notification import.
- mobile/src/services/notificationsRuntimePolicy.ts: testable eligibility policy and cached lazy loader.
- mobile/tests/notificationsRuntime.test.mjs: Expo Go/web import avoidance, installed/development client loading, safe import failure, actual adapter evaluation with mocked runtimes.

Changed:
- mobile/src/components/ReminderSync.tsx: guarded asynchronous setup, AppState/query-cache subscriptions retained, disposal check and subscription/timer cleanup.
- mobile/src/services/reminders.ts: every native operation obtains the guarded module first; unsupported runtimes return a safe message before notification APIs or reminder data fetching.
- mobile/package.json and package-lock.json: Expo-recommended compatible patches.

No route, navigation, UI, backend, database, auth or API URL changes. expo-notifications dependency and app.json plugin remain present. Root layout still mounts ReminderSync. Installed native reminder-plan generation, permissions, channel setup, cancellation and scheduling remain available.

The current SDK describes StoreClient as potentially including development clients. Runtime detection uses Expo's isRunningInExpoGo helper, with Constants execution environment/ownership as a compatibility fallback, rather than disabling all development clients or relying on __DEV__.

## Dependency recovery

The first expo install --fix was interrupted by ECONNRESET and Windows npm cleanup warnings. Resumed with npm install, then expo install --check and expo install --fix for the remaining recommended patches.

Final versions: expo 57.0.26; expo-constants 57.0.20; expo-linking 57.0.11; expo-notifications 57.0.21; expo-router 57.0.24.

## Validation

- PASS: npm run typecheck.
- PASS: npm test, 17/17 mobile tests.
- PASS: npx --yes expo-doctor@latest, 21/21 checks.
- PASS: npx expo install --check, dependencies up to date.
- Connected authorized Android device with Expo Go installed.
- PASS: physical Android Expo Go launches TrackSense and displays the splash/welcome screen. Root layout loads.
- PASS: current-device log scan reports zero notification-crash, missing-default-export and ErrorBoundary matches. No route file required changes.
- Dashboard/Focus/Profile physical navigation: currently blocked by phone DNS failure resolving the configured Supabase host. Session restoration therefore falls back to the welcome screen. Requires working phone internet/sign-in to finish those three screen checks; no auth/network configuration changed.
- Development/APK notification loading is covered by runtime-loader regression tests; actual installed-build delivery was not exercised.

## Metro/device setup

An existing process occupied 8081, so it was left untouched. The verification server uses 8082 with a cleared Metro cache and Expo Go target. An initial --localhost server bound only to IPv6 ::1, causing the phone's IPv4 USB-forwarded connection to fail downloading the update before app code ran. Only that verification process was restarted using a LAN listener and process-only REACT_NATIVE_PACKAGER_HOSTNAME=127.0.0.1. No environment file or API URL was changed.

Command used for the running verification server:

```powershell
$env:REACT_NATIVE_PACKAGER_HOSTNAME='127.0.0.1'
npx expo start --clear --go --lan --port 8082
```

ADB reverse forwards tcp:8082 to the PC. Expo Go opens exp://127.0.0.1:8082. The initial download error was a development-server connection problem, separate from the notification import crash.

The dependency audit still reports 22 findings (17 moderate, 5 high); unrelated audit fixes are outside this startup task.

## Physical verification notes

The USB forwarding rule also had to be established from the same host execution context as Metro. After that correction the Android bundle loaded and app JavaScript ran normally. ADB log checks were filtered to the requested crash signatures. Screenshot: `mobile/artifacts/expo-go-splash-verified.png`.

The remaining Supabase warnings concern deprecated lock configuration and a phone-side UnknownHostException. These are separate from notification startup and were not changed in this task.
