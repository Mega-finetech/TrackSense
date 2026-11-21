/**
 * Pure geometry for the bottom tab bar. Kept free of React Native imports so it
 * can be unit tested in isolation from the hook that reads device insets.
 *
 * The bar is rendered in normal flow as the last child of the tabs navigator's
 * flex column, so the navigator already reserves its height and every screen
 * ends directly above it. Screens need these constants only for floating
 * controls and for trailing list padding.
 */

/** Height of the icon + label band, excluding the device safe-area inset. */
export const TAB_BAR_CONTENT_HEIGHT = 72;

/** Breathing room kept clear of the Android navigation bar / gesture handle. */
export const TAB_BAR_SAFE_AREA_FLOOR = 10;

/** Gap between a screen's bottom edge and the top of the tab bar. */
export const TAB_BAR_CONTENT_GAP = 16;

/** Destination count. The bar is a fixed set of equal slots, never content sized. */
export const TAB_BAR_COUNT = 5;

/** Symmetric inset between the screen edge and the first/last tab slot. */
export const TAB_BAR_HORIZONTAL_PADDING = 8;

/** Resolved bottom padding for the bar. */
export function tabBarBottomInset(deviceBottomInset: number): number {
  const inset = Number.isFinite(deviceBottomInset) ? deviceBottomInset : 0;
  return Math.max(inset, TAB_BAR_SAFE_AREA_FLOOR);
}

/** Total height the bar occupies on the current device. */
export function tabBarHeight(deviceBottomInset: number): number {
  return TAB_BAR_CONTENT_HEIGHT + tabBarBottomInset(deviceBottomInset);
}

/**
 * Width of one tab slot. The bar divides the space inside its balanced edge
 * padding evenly, so a long label can never widen its own slot and push a
 * neighbour out of the row.
 */
export function tabBarSlotWidth(screenWidth: number): number {
  const width = Number.isFinite(screenWidth) ? screenWidth : 0;
  return Math.max(0, width - TAB_BAR_HORIZONTAL_PADDING * 2) / TAB_BAR_COUNT;
}
