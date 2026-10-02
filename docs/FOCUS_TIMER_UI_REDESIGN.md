# Focus Timer UI pass

## Scope

This pass preserves the existing timer engine and session-saving behavior, following the UI-only constraint. New timer functionality is explicitly deferred below.

## Files and changes

- `mobile/src/features/focus/FocusTimerView.tsx`: StyleSheet-only presentation with safe-area header, Timer/Sessions tabs, animated 260px SVG ring, supplied branding image, tabular time, Start/Pause/Resume states, press animation, Reset, duration settings sheet and session history.
- `mobile/src/features/focus/FocusScreen.tsx`: retains the original session schema, wall-clock ticking, secure/local storage key, pause/resume, restore, discard and manual save functions. Connects them to the presentation and adds a user-scoped read of the existing session-history endpoint.
- `mobile/tests/browser-smoke.mjs`: adds fixture checks for focus start/pause/resume, paused/running reload restoration, reset, custom duration, elapsed-session restoration, explicit save, completion timestamp and history.

The Reset control invokes the existing discard behavior. Manual Save completed session remains required. Custom duration remains local screen state as before; Apply duration does not claim to sync preferences.

The session history displays actual returned session types (Pomodoro or Deep Focus), durations, dates and linked task titles when supplied. Empty, loading and retry states are distinct.

## Deferred functionality

These requested features did not exist in the original timer and were not implemented as part of a UI-only change:
- Short/long break modes (tabs are visibly unavailable).
- Session context linking (header action disabled).
- Sound playback/toggling (No sound action disabled).
- Four-session cycle counting and automatic break/focus transitions.
- Auto-save on completion or completion alerts with break actions.
- Persisted timer preferences and auto-start toggles.

No fake cycle count, unsaved preference controls, or break sessions misclassified as focus work were introduced. Completing these features requires a separate functional pass. The backend currently accepts only pomodoro/deep session types.

## Verification

- Existing mobile tests: 11/11 passed, including all four clock regressions. Existing Node module-type warnings remain.
- PASS: final TypeScript check and Expo web export.
- PASS: full browser fixture suite, including start/pause/resume/reset, restoration, one-minute custom duration, elapsed-session completion timestamp, manual save and session history. The final full run also passed after strengthening the reload checks to wait for a new document and allowing screenshot transitions to settle.
- Previous test/build attempt was blocked by automatic approval review reaching a usage limit. The retry on September 29 executed successfully.
- Browser verification uses isolated API fixtures, not live database evidence. Physical Android and native background/sound behavior are not verified by browser screenshots.
- Backend, auth, preferences, clock.ts and approved bottom-navigation geometry remain unchanged. Existing bottom-navigation checks pass at 390px and 320px in both themes.
- Reviewed light/dark timer, paused, settings and history screenshots. Physical Android and real-service persistence checks remain outstanding. No live user data was changed.


## Screenshots

Browser viewport: 390 x 844 CSS pixels.

- Timer: [light](../mobile/artifacts/focus-timer-light.png), [dark](../mobile/artifacts/focus-timer-dark.png).
- Running: [light](../mobile/artifacts/focus-running-light.png), [dark](../mobile/artifacts/focus-running-dark.png).
- Paused: [light](../mobile/artifacts/focus-paused-light.png), [dark](../mobile/artifacts/focus-paused-dark.png).
- Settings: [light](../mobile/artifacts/focus-settings-light.png), [dark](../mobile/artifacts/focus-settings-dark.png).
- Sessions: [light](../mobile/artifacts/focus-sessions-light.png), [dark](../mobile/artifacts/focus-sessions-dark.png).
- [Empty sessions](../mobile/artifacts/focus-sessions-empty-light.png).
- [Completed timer awaiting save](../mobile/artifacts/focus-complete-light.png).
