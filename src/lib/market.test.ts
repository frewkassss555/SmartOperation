import { describe, expect, it } from 'vitest';
import { downsample, formatPercent, formatUsd, nextBackoff, periodChange, priceRange, trendOf, type Point } from './market';

const series = (n: number): Point[] => Array.from({ length: n }, (_, i) => [i * 1000, 100 + i]);

describe('downsample', () => {
  it('keeps short series intact', () => {
    expect(downsample(series(50))).toHaveLength(50);
  });

  it('reduces long series and keeps the end points', () => {
    const input = series(720);
    const out = downsample(input, 120);
    expect(out.length).toBeLessThanOrEqual(120);
    expect(out.length).toBeGreaterThanOrEqual(60);
    expect(out[0]).toEqual(input[0]);
    expect(out.at(-1)).toEqual(input.at(-1));
    for (let i = 1; i < out.length; i++) expect(out[i]![0]).toBeGreaterThan(out[i - 1]![0]);
  });
});

describe('period stats', () => {
  it('computes change and range', () => {
    const pts: Point[] = [
      [0, 100],
      [1, 90],
      [2, 120],
      [3, 110],
    ];
    expect(periodChange(pts)).toBeCloseTo(10);
    expect(priceRange(pts)).toEqual({ min: 90, max: 120 });
    expect(periodChange([[0, 1]])).toBeNull();
    expect(priceRange([])).toBeNull();
  });

  it('classifies trends', () => {
    expect(trendOf(2.4)).toBe('up');
    expect(trendOf(-0.5)).toBe('down');
    expect(trendOf(0.001)).toBe('flat');
    expect(trendOf(null)).toBe('flat');
  });
});

describe('formatting', () => {
  it('formats USD by magnitude', () => {
    expect(formatUsd(81837.4)).toBe('$81 837');
    expect(formatUsd(3412.5)).toBe('$3 413');
    expect(formatUsd(142.456)).toBe('$142,46');
    expect(formatUsd(0.12345)).toBe('$0,1235');
    expect(formatUsd(null)).toBe('—');
  });

  it('formats signed percent', () => {
    expect(formatPercent(2.413)).toBe('+2,41 %');
    expect(formatPercent(-0.87)).toBe('−0,87 %');
    expect(formatPercent(0.001)).toBe('0,00 %');
    expect(formatPercent(undefined)).toBe('—');
  });

  it('backs off exponentially with a cap', () => {
    expect(nextBackoff(0)).toBe(120_000);
    expect(nextBackoff(120_000)).toBe(240_000);
    expect(nextBackoff(10 * 60_000)).toBe(15 * 60_000);
  });
});
