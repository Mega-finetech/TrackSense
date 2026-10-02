# Focus Areas UI update

Changed `mobile/src/features/auth/FocusAreasScreen.tsx` and `mobile/tests/browser-smoke.mjs`.

- Five progress dots, header/back control, six two-column module cards, semantic icon backgrounds, selection borders/checkmarks, privacy note and Continue button.
- Light/dark themes; safe areas; scrollable content and 56px action.
- New onboarding starts empty and requires at least one choice. Editing preferences retains saved selections.
- Existing preferences.save(selected), API/store behavior, errors and dashboard navigation retained.
- Existing sign-out escape is presented as an accessible back control during onboarding; authenticated users cannot navigate into the protected welcome route without signing out. Saved preferences use router.back().
- No OnboardingComplete route exists. Its implementation is deferred; Continue still saves and opens the dashboard. Five dots follow the requested visual, not five implemented onboarding routes.
- Exact requested padding and card content can exceed short viewports; scrolling remains available.

Validation: TypeScript PASS; existing mobile tests 11/11 PASS. Browser verification pending at report creation. Screenshots use fixtures, not live database proof.

Final verification: Browser smoke PASS for selection/deselection, disabled Continue, saving and existing downstream workflows. Recaptured dark mode with the saved preference override and visually inspected both 390x844 captures. Physical Android review remains pending.
