import { describe, expect, it } from 'vitest';
import { formatTzs } from './components/MoneyDisplay.js';
import { arrearsStyle, color, unitStatusStyle } from './tokens.js';
import { t } from './i18n.js';

describe('tokens & formatting', () => {
  it('formats integer TZS with grouping and no decimals', () => {
    expect(formatTzs(1_250_000)).toBe('TZS 1,250,000');
    expect(formatTzs(0)).toBe('TZS 0');
    expect(() => formatTzs(10.5)).toThrow('integer');
  });

  it('covers every unit status with a style and bilingual label', () => {
    for (const key of ['IN_STOCK', 'RESERVED', 'SOLD', 'DELIVERED', 'RETURNED', 'FAILED'] as const) {
      expect(unitStatusStyle[key].bg).toMatch(/^#/);
      expect(t(key, 'sw')).toBeTruthy();
      expect(t(key, 'en')).toBeTruthy();
      expect(t(key, 'sw')).not.toBe(t(key, 'en'));
    }
  });

  it('escalates the arrears ramp', () => {
    expect(arrearsStyle(3)).toEqual({ bg: color.gold50, fg: color.amber });
    expect(arrearsStyle(15)).toEqual({ bg: color.red50, fg: color.red });
    expect(arrearsStyle(45)).toEqual({ bg: color.red, fg: color.white });
  });

  it('canonical brand values match the design handoff', () => {
    expect(color.blue).toBe('#0F5DA4');
    expect(color.green).toBe('#239B46');
    expect(color.gold).toBe('#E7A52C');
    expect(color.steel).toBe('#1D6A96');
  });
});
