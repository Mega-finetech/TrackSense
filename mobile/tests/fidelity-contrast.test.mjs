import test from 'node:test';
import assert from 'node:assert/strict';
import { fidelityPalettes, fidelitySurfaces } from '../src/theme/tokens.ts';

function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function contrast(a, b) { const values = [luminance(a), luminance(b)].sort((x, y) => y - x); return (values[0] + 0.05) / (values[1] + 0.05); }
for (const theme of ['light', 'dark']) test(`${theme}: goal actions and supporting text have readable contrast`, () => {
  const c = fidelityPalettes[theme]; const s = fidelitySurfaces[theme];
  for (const [foreground, background] of [[c.onPrimary, c.primary], [c.primary, c.soft], [c.muted, c.background], [c.secondary, c.surface], [c.muted, s.elevated], [s.heroText, s.hero], [s.heroMuted, s.hero]]) {
    assert.ok(contrast(foreground, background) >= 4.5, `${foreground} on ${background} must meet 4.5:1`);
  }
});
