// Deterministic fake quotes for development and tests: enabled with VITE_DEMO_MARKET=1.
// Same seed, same series: screenshots and tests are reproducible.

import type { MarketQuote, SearchHit } from './coingecko';
import type { Point } from './market';

const COINS: Record<string, { symbol: string; name: string; base: number }> = {
  bitcoin: { symbol: 'BTC', name: 'Bitcoin', base: 81_800 },
  ethereum: { symbol: 'ETH', name: 'Ethereum', base: 3_410 },
  solana: { symbol: 'SOL', name: 'Solana', base: 142 },
  dogecoin: { symbol: 'DOGE', name: 'Dogecoin', base: 0.123 },
  cardano: { symbol: 'ADA', name: 'Cardano', base: 0.48 },
  ripple: { symbol: 'XRP', name: 'XRP', base: 0.61 },
  toncoin: { symbol: 'TON', name: 'Toncoin', base: 5.2 },
  litecoin: { symbol: 'LTC', name: 'Litecoin', base: 71 },
};

const STEP_MS: Record<number, number> = { 1: 5 * 60_000, 7: 3_600_000, 30: 3_600_000 };

/** Small seeded PRNG (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const seedOf = (text: string) => [...text].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261);

/** A random walk ending at the coin's base price, one point per CoinGecko interval. */
export function demoChart(id: string, days: number, now = Date.now()): Point[] {
  const coin = COINS[id] ?? { base: 10 };
  const step = STEP_MS[days] ?? 3_600_000;
  const count = Math.round((days * 86_400_000) / step);
  const random = rng(seedOf(`${id}:${days}`));
  const walk: number[] = [1];
  for (let i = 1; i < count; i++) walk.push(walk[i - 1]! * (1 + (random() - 0.5) * 0.012 * Math.sqrt(days)));
  const scale = coin.base / walk.at(-1)!;
  const end = Math.floor(now / step) * step;
  return walk.map((w, i) => [end - (count - 1 - i) * step, w * scale]);
}

export function demoMarkets(ids: readonly string[], now = Date.now()): MarketQuote[] {
  return ids.map((id) => {
    const day = demoChart(id, 1, now);
    const first = day[0]![1];
    const last = day.at(-1)![1];
    const coin = COINS[id];
    return {
      id,
      symbol: coin?.symbol ?? id.slice(0, 4).toUpperCase(),
      name: coin?.name ?? id,
      price: last,
      change24h: ((last - first) / first) * 100,
      updatedAt: now,
    };
  });
}

export function demoSearch(query: string): SearchHit[] {
  const q = query.trim().toLowerCase();
  return Object.entries(COINS)
    .filter(([id, c]) => id.includes(q) || c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q))
    .map(([id, c], i) => ({ id, symbol: c.symbol, name: c.name, rank: i + 1 }));
}
