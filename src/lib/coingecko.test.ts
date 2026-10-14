import { describe, expect, it } from 'vitest';
import { parseChart, parseMarkets, parseSearch } from './coingecko';
import { demoChart, demoMarkets } from './demoMarket';

describe('CoinGecko parsing', () => {
  it('parses markets and skips broken rows', () => {
    const quotes = parseMarkets(
      [
        { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 81837, price_change_percentage_24h: -1.5, last_updated: '2026-10-14T10:00:00.000Z' },
        { id: 'broken', current_price: null },
        'junk',
      ],
      Date.parse('2026-10-14T12:00:00.000Z'),
    );
    expect(quotes).toEqual([
      { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 81837, change24h: -1.5, updatedAt: Date.parse('2026-10-14T10:00:00.000Z') },
    ]);
  });

  it('never dates a quote in the future', () => {
    const now = Date.parse('2026-10-14T12:00:00.000Z');
    const [q] = parseMarkets([{ id: 'x', current_price: 1, last_updated: '2030-01-01T00:00:00Z' }], now);
    expect(q!.updatedAt).toBe(now);
  });

  it('parses chart prices', () => {
    expect(parseChart({ prices: [[1, 2], [3, 'x'], [5, 6]] })).toEqual([
      [1, 2],
      [5, 6],
    ]);
    expect(() => parseChart({})).toThrow();
  });

  it('parses search hits', () => {
    expect(parseSearch({ coins: [{ id: 'dogecoin', symbol: 'doge', name: 'Dogecoin', market_cap_rank: 12 }] })).toEqual([
      { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', rank: 12 },
    ]);
  });
});

describe('demo market', () => {
  it('is deterministic and shaped like the API', () => {
    const now = Date.parse('2026-10-14T12:00:00.000Z');
    expect(demoChart('bitcoin', 7, now)).toEqual(demoChart('bitcoin', 7, now));
    expect(demoChart('bitcoin', 1, now)).toHaveLength(288);
    expect(demoChart('bitcoin', 30, now)).toHaveLength(720);
    expect(demoChart('bitcoin', 7, now).at(-1)![1]).toBeCloseTo(81_800);
    expect(demoMarkets(['ethereum'], now)[0]).toMatchObject({ symbol: 'ETH', price: expect.closeTo(3410, 5) });
  });
});
