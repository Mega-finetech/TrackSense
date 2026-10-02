# Spiritual screen redesign

Scope: Spiritual Overview and Journal presentation, with supported actions wired to the existing API. No backend, authentication, preferences, optional-module selection, bottom navigation or unrelated screens were changed.

## Files

- `mobile/src/features/spiritual/SpiritualScreen.tsx`: complete StyleSheet-based screen.
- `mobile/app/(app)/spiritual/index.tsx`: uses the new Overview screen.
- `mobile/app/(app)/spiritual/journal.tsx`: retains the existing journal URL and opens the Journal tab.
- `mobile/tests/browser-smoke.mjs`: isolated Spiritual API fixtures and interaction coverage.

## Changes

- Safe-area-aware back/title/plus header; Overview and Journal pills.
- Weekly activity cards, distinct category icons and progress bars, a labelled prayer streak and seven rotating daily scriptures.
- Counts represent distinct calendar days logged during the current Monday-based week, out of seven. Multiple reflections or Bible entries on one day count once.
- Journal cards show date, saved mood, title, preview and tags. Tapping opens a full-reading detail sheet.
- Devotion logging bottom sheet retains the existing per-date upsert endpoint. Existing notes for the selected date are loaded before editing/saving is enabled. The backend already updates the devotion streak; no redundant second streak update is sent.
- Reflection creation supports title, body, date, tags and the five moods the current backend accepts.
- Separate loading, error/retry and empty states. Failed requests are not presented as an empty journal.
- Light and dark palettes; readable muted text uses a stronger shade than the requested low-contrast dark date color.
- Privacy copy says "Your spiritual data is private to your account." Encryption was not verified and is not claimed.

## Existing limitations retained

- Prayer Tracker and Bible Study routes remain available, but their existing screens are placeholders. This UI pass does not rebuild them.
- No fellowship logging endpoint exists. Its progress is unavailable, not fabricated.
- Devotion records do not have a supported completion toggle in the write API. Only checked/completed submissions can save; unchecked drafts cannot be persisted.
- The backend has separate activity streaks, not a combined spiritual streak. The card explicitly identifies the prayer streak.
- The API accepts Happy, Peaceful, Grateful, Loved and Growing mood emoji. Unsupported Struggling/Faithful options are not sent.
- Journal detail is a reading sheet at the existing route, not a new route. Date entry uses a validated YYYY-MM-DD input rather than adding a date-picker dependency.
- Existing API date values are treated as calendar date strings. The legacy runtime schema uses TEXT dates; a separate schema.sql uses DATE. Any deployment emitting timezone-shifted timestamps needs a backend date-contract check.
- Browser checks use fixtures only. They do not prove live database persistence, encryption, ownership isolation or physical Android rendering.

## Verification

- PASS: `npm run typecheck` from `mobile` (`tsc --noEmit`). An initial invocation from the repository root found no typecheck script; it was rerun from the correct mobile directory.
- PASS: `npm test` from `mobile`: 11 existing tests, zero failures. Existing Node module-type warnings remain.
- PASS: Expo web export using process-only fixture configuration (legacy auth, localhost fixture API). No environment files changed.
- PASS: `node tests/browser-smoke.mjs`: existing auth/onboarding/tasks/goals/projects/Study flows plus Spiritual devotion create/update, saved-note preload, journal creation with mood/tags, full-entry reading, direct Journal route, failure/retry, light/dark screenshots and logout.
- Browser selector issues encountered during verification were corrected: modal/page buttons share a label, and inactive navigation elements must not be mistaken for the visible Journal route. Final full run passes.
- Screenshots reviewed at 390 x 844 browser CSS pixels. Top and lower Overview, Journal, logging sheet and empty/detail examples are in `mobile/artifacts/spiritual-*.png`.
- Approved bottom-navigation SHA256 remains `C27978BCCB51F715F8EA9FAE519814FBA5A07D4FA1F3727F6BB593D56B1F8EC5`; existing 390/320-width navigation geometry checks pass in both themes.
- NOT RUN: physical Android verification, live API/database write tests and backend tests (backend unchanged). No real user data was created or modified by the browser fixtures.

## Screenshot links

- [Overview light](../mobile/artifacts/spiritual-overview-light.png)
- [Overview dark](../mobile/artifacts/spiritual-overview-dark.png)
- [Overview lower light](../mobile/artifacts/spiritual-overview-lower-light.png)
- [Overview lower dark](../mobile/artifacts/spiritual-overview-lower-dark.png)
- [Journal light](../mobile/artifacts/spiritual-journal-light.png)
- [Journal dark](../mobile/artifacts/spiritual-journal-dark.png)
- [Log activity light](../mobile/artifacts/spiritual-log-light.png)
- [Log activity dark](../mobile/artifacts/spiritual-log-dark.png)
- [Empty Overview](../mobile/artifacts/spiritual-empty-light.png)
- [Empty Journal](../mobile/artifacts/spiritual-journal-empty-light.png)
- [Reflection detail](../mobile/artifacts/spiritual-reflection-detail-light.png)
