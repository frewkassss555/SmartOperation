import { describe, expect, it } from 'vitest';
import { checkAlerts, parseUsd } from './alerts';

describe('price alerts', () => {
  it('fires once when the price crosses a threshold', () => {
    const config = { alertAbove: 90000 };
    expect(checkAlerts(89000, config)).toEqual({ firedAbove: false, firedBelow: false, newly: [] });
    const hit = checkAlerts(90500, config);
    expect(hit.newly).toEqual(['above']);
    expect(checkAlerts(91000, { ...config, firedAbove: hit.firedAbove }).newly).toEqual([]);
  });

  it('re-arms after the price goes back', () => {
    const back = checkAlerts(88000, { alertAbove: 90000, firedAbove: true });
    expect(back.firedAbove).toBe(false);
    expect(checkAlerts(90001, { alertAbove: 90000, firedAbove: back.firedAbove }).newly).toEqual(['above']);
  });

  it('handles the lower threshold', () => {
    expect(checkAlerts(75000, { alertBelow: 76000 }).newly).toEqual(['below']);
    expect(checkAlerts(77000, { alertBelow: 76000, alertAbove: 80000 }).newly).toEqual([]);
  });

  it('parses thresholds', () => {
    expect(parseUsd('90 000')).toBe(90000);
    expect(parseUsd('$0,12')).toBe(0.12);
    expect(parseUsd('')).toBeNull();
    expect(parseUsd('-5')).toBeNull();
    expect(parseUsd('0')).toBeNull();
  });
});
