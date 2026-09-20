# Bottom navigation correction

Scope: only `mobile/src/components/BottomNavigation.tsx`, navigation verification in `mobile/tests/browser-smoke.mjs`, and this report. The broader attached Revision Pass 2 is deferred in accordance with the explicit bottom-navigation-only request.

Routes remain **Home | Tasks | Focus | Analytics | Profile**. Navigation callbacks, authentication, API configuration, backend logic and all other screen implementations are unchanged.

## Corrections

- Five slots use the same `flexGrow: 1`, `flexShrink: 1`, `flexBasis: 0` and `minWidth: 0`. Label content cannot widen an individual slot. No positional offsets are used.
- Each slot centers an identical 36 × 28 icon container and a full-slot-width centered label, with a consistent 3px gap.
- Every label uses the same size (10px; 9.5px below 360px available bar width), 14px line height, one line and disabled Android font padding. Native font scaling is capped at 1.2, with shrink-to-fit available for constrained layouts. Full accessible tab labels remain present.
- All items have 52px-high touch targets. At the requested widths, slots are 78px wide (390px) and 64px wide (320px).
- Bottom padding is now **safe-area bottom inset + 8px**, so device navigation insets do not consume the visual breathing room. Left/right safe areas are also respected.
- The bar content is approximately 64px tall plus its hairline border and bottom inset. A neutral theme surface and subtle top border separate it from the page.
- The selected tab uses TrackSense green, a compact rounded icon background and a semibold label. The icon box does not change size when selected. Inactive items use the theme's readable secondary text color.

## Verification

- TypeScript passes; existing mobile tests pass (9/9).
- Browser checks measure slot widths, icon/label centering, actual text bounds, identical font sizes/line heights, label overflow, Analytics/Profile spacing, minimum touch height and bottom padding.
- Both 390px and 320px widths are checked in light/dark themes with Home and Profile selected.
- Measured slots are exactly 78px / 64px wide, 52px high, with 10px / 9.5px labels and a consistent 14px line height. With Profile selected, Analytics/Profile text has approximately 43.8px / 31.5px separation. The browser bar measures 65px high without a system inset.
- Added explicit selected-state accessibility markup after the browser check found that the renderer did not expose the existing selected accessibility state as `aria-selected`.
- Final web export and existing browser smoke pass. All eight navigation cases (two widths × two themes × Home/Profile selection) pass the geometry and selected-state checks. Screenshots and the measurements JSON were refreshed from the final build.
- Screenshots are browser captures at physical-device CSS widths, **not screenshots from an attached Android device**. Android inset logic is implemented but physical-device safe-area/font rendering needs the user's device recheck. `adb` is not available on PATH in this workspace.
- Test data stays in browser fixtures. No production/user data or private environment values are modified.

Commands run from `mobile`: `npm run typecheck`, `npm test`, web export with process-only fixture configuration, and `node tests/browser-smoke.mjs`. No other screen redesign is included.

## Screenshots

These captures show the entire navigation bar with Profile selected, specifically exposing the Analytics/Profile boundary. Full-screen versions and Home-selected variants are also in `mobile/artifacts`.

| Width | Light | Dark |
| --- | --- | --- |
| 390px | [Navigation](../mobile/artifacts/bottom-nav-390-light-profile.png) | [Navigation](../mobile/artifacts/bottom-nav-390-dark-profile.png) |
| 320px | [Navigation](../mobile/artifacts/bottom-nav-320-light-profile.png) | [Navigation](../mobile/artifacts/bottom-nav-320-dark-profile.png) |

[Measured geometry](../mobile/artifacts/bottom-navigation-measurements.json). Recheck on the physical Android device to confirm native text rendering and its system insets.
