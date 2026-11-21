import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tabBarBottomInset, tabBarHeight } from './tabBarLayout';

export {
  TAB_BAR_CONTENT_GAP,
  TAB_BAR_CONTENT_HEIGHT,
  TAB_BAR_COUNT,
  TAB_BAR_HORIZONTAL_PADDING,
  TAB_BAR_SAFE_AREA_FLOOR,
  tabBarBottomInset,
  tabBarHeight,
  tabBarSlotWidth,
} from './tabBarLayout';

/** Resolved bottom padding for the bar on the current device. */
export function useTabBarBottomInset(): number {
  return tabBarBottomInset(useSafeAreaInsets().bottom);
}

/** Total height the bar occupies on the current device. */
export function useTabBarHeight(): number {
  return tabBarHeight(useSafeAreaInsets().bottom);
}
