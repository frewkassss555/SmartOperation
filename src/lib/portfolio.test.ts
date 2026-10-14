import { describe, expect, it } from 'vitest';
import { formatAmount, formatSignedUsd, portfolioTotals, valuePosition } from './portfolio';

describe('portfolio', () => {
  it('values a position against the buy price', () => {
    const p = valuePosition({ coinId: 'bitcoin', amount: 0.5, buyPrice: 60000, price: 81800 });
    expect(p).toMatchObject({ cost: 30000, value: 40900, pnl: 10900 });
    expect(p.pnlPct).toBeCloseTo(36.333, 2);
  });

  it('handles a missing quote', () => {
    expect(valuePosition({ coinId: 'x', amount: 2, buyPrice: 10, price: null })).toMatchObject({ value: null, pnl: null, pnlPct: null });
  });

  it('sums positions with prices only', () => {
    const totals = portfolioTotals([
      valuePosition({ coinId: 'a', amount: 1, buyPrice: 100, price: 150 }),
      valuePosition({ coinId: 'b', amount: 10, buyPrice: 10, price: 5 }),
      valuePosition({ coinId: 'c', amount: 1, buyPrice: 999, price: null }),
    ]);
    expect(totals).toEqual({ value: 200, cost: 200, pnl: 0, pnlPct: 0 });
  });

  it('formats amounts and signed dollars', () => {
    expect(formatAmount(0.5)).toBe('0,5');
    expect(formatAmount(1.23456789)).toBe('1,23456789');
    expect(formatAmount(1500)).toBe('1 500');
    expect(formatSignedUsd(10900)).toBe('+$10 900');
    expect(formatSignedUsd(-56.1)).toBe('−$56,10');
    expect(formatSignedUsd(0)).toBe('$0,00');
  });
});
