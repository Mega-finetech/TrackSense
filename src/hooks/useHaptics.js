/**
 * Haptic feedback hook using navigator.vibrate()
 * Gracefully degrades on browsers/devices that don't support it.
 */
export function useHaptics() {
  const vibrate = (pattern) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  return {
    /** Light tap — for selections, toggles */
    tap: () => vibrate(10),
    /** Double tap — for confirmations */
    doubleTap: () => vibrate([10, 50, 10]),
    /** Success pulse — for task completion */
    success: () => vibrate([10, 30, 60]),
    /** Error — for delete / destructive actions */
    error: () => vibrate([50, 30, 50, 30, 100]),
    /** Long press indicator */
    longPress: () => vibrate(25),
  };
}
