import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  TAB_BAR_CONTENT_GAP,
  TAB_BAR_CONTENT_HEIGHT,
  TAB_BAR_COUNT,
  TAB_BAR_HORIZONTAL_PADDING,
  TAB_BAR_SAFE_AREA_FLOOR,
  tabBarBottomInset,
  tabBarHeight,
  tabBarSlotWidth,
} from '../src/components/tabBarLayout.ts';

const source = readFileSync(new URL('../src/components/BottomNavigation.tsx', import.meta.url), 'utf8');

test('tab bar pads for the Android navigation inset instead of a fixed offset', () => {
  // Gesture bar, three-button nav, and a device with no inset at all.
  assert.equal(tabBarBottomInset(0), TAB_BAR_SAFE_AREA_FLOOR);
  assert.equal(tabBarBottomInset(24), 24);
  assert.equal(tabBarBottomInset(48), 48);
  assert.equal(tabBarBottomInset(10), 10);
  assert.equal(tabBarBottomInset(9), TAB_BAR_SAFE_AREA_FLOOR);
  assert.equal(tabBarBottomInset(NaN), TAB_BAR_SAFE_AREA_FLOOR);
  // The bar must grow with the inset so the content band is never squeezed.
  assert.equal(tabBarHeight(0), TAB_BAR_CONTENT_HEIGHT + TAB_BAR_SAFE_AREA_FLOOR);
  assert.equal(tabBarHeight(48), TAB_BAR_CONTENT_HEIGHT + 48);
  assert.ok(tabBarHeight(48) > tabBarHeight(0));
});

test('every destination gets an equal slot that fits its own label', () => {
  assert.equal(TAB_BAR_COUNT, 5);
  for (const width of [320, 360, 411, 480]) {
    const slot = tabBarSlotWidth(width);
    // The widest label is "Profile" at fontSize 10, roughly 38dp.
    assert.ok(slot >= 56, `slot ${slot}dp is too narrow at ${width}dp`);
    // Equal distribution: five slots plus the symmetric edge padding must
    // consume the full screen width exactly.
    assert.equal(slot * TAB_BAR_COUNT + TAB_BAR_HORIZONTAL_PADDING * 2, width);
  }
});

test('tab bar is laid out in flow and stretches to the full screen width', () => {
  const container = source.slice(source.indexOf('container: {'), source.indexOf('item: {'));
  assert.match(container, /flexDirection:\s*'row'/);
  assert.match(container, /width:\s*'100%'/);
  assert.match(container, /alignSelf:\s*'stretch'/);
  assert.match(container, /justifyContent:\s*'space-between'/);
  assert.match(container, /paddingHorizontal:\s*TAB_BAR_HORIZONTAL_PADDING/);
  // An overlay bar is what caused the congestion and covered screen content.
  assert.doesNotMatch(container, /position:\s*'absolute'/);
  assert.doesNotMatch(container, /\bleft:\s*0/);
  assert.doesNotMatch(container, /\bright:\s*0/);
});

test('each tab is an equal flex slot that a long label cannot widen', () => {
  const item = source.slice(source.indexOf('item: {'), source.indexOf('indicator: {'));
  assert.match(item, /flex:\s*1/);
  // flexBasis 0 stops Android deriving a base width from the label text.
  assert.match(item, /flexBasis:\s*0/);
  assert.match(item, /minWidth:\s*0/);
  assert.match(item, /alignItems:\s*'center'/);
  assert.match(item, /paddingHorizontal:\s*4/);
});

test('tab labels stay short single words and icons stay at 22px', () => {
  for (const title of ['Home', 'Tasks', 'Focus', 'Stats', 'Profile']) {
    assert.match(source, new RegExp(`title: '${title}'`));
    assert.ok(!title.includes(' '), `${title} must be a single word`);
  }
  assert.match(source, /size=\{22\} strokeWidth=\{1\.5\}/);
  assert.ok(TAB_BAR_CONTENT_GAP > 0);
});
