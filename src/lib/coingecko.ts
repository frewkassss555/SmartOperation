// CoinGecko public API client (no key: keys must not ship in client code).
// Docs: https://docs.coingecko.com — /coins/markets, /coins/{id}/market_chart, /search.
// The keyless API is rate limited per IP and answers 429 when the limit is hit.

import { demoChart, demoMarkets, demoSearch } from './demoMarket';
import type { Point } from './market';

const BASE = 'https://api.coingecko.com/api/v3';
const TIMEOUT_MS = 10_000;
const DEMO = import.meta.env.VITE_DEMO_MARKET === '1';

export type MarketQuote = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number | null;
  /** Epoch ms when CoinGecko last updated the price. */
  updatedAt: number;
};

export type SearchHit = { id: string; symbol: string; name: string; rank: number | null };

export class RateLimitError extends Error {
  constructor() {
    super('Rate limited');
    this.name = 'RateLimitError';
  }
}

async function get(path: string): Promise<unknown> {
  const response = await fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (response.status === 429) throw new RateLimitError();
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export function parseMarkets(json: unknown, now = Date.now()): MarketQuote[] {
  if (!Array.isArray(json)) throw new Error('Unexpected markets response');
  return json.flatMap((row): MarketQuote[] => {
    if (!isRecord(row) || typeof row.id !== 'string') return [];
    const price = num(row.current_price);
    if (price === null) return [];
    const updated = typeof row.last_updated === 'string' ? Date.parse(row.last_updated) : NaN;
    return [
      {
        id: row.id,
        symbol: String(row.symbol ?? row.id).toUpperCase(),
        name: String(row.name ?? row.id),
        price,
        change24h: num(row.price_change_percentage_24h),
        updatedAt: Number.isFinite(updated) ? Math.min(updated, now) : now,
      },
    ];
  });
}

export function parseChart(json: unknown): Point[] {
  if (!isRecord(json) || !Array.isArray(json.prices)) throw new Error('Unexpected chart response');
  return json.prices.flatMap((p): Point[] => {
    if (!Array.isArray(p)) return [];
    const t = num(p[0]);
    const v = num(p[1]);
    return t === null || v === null ? [] : [[t, v]];
  });
}

export function parseSearch(json: unknown): SearchHit[] {
  if (!isRecord(json) || !Array.isArray(json.coins)) throw new Error('Unexpected search response');
  return json.coins.flatMap((c): SearchHit[] =>
    isRecord(c) && typeof c.id === 'string'
      ? [{ id: c.id, symbol: String(c.symbol ?? '').toUpperCase(), name: String(c.name ?? c.id), rank: num(c.market_cap_rank) }]
      : [],
  );
}

export async function fetchMarkets(ids: readonly string[]): Promise<MarketQuote[]> {
  if (ids.length === 0) return [];
  if (DEMO) return demoMarkets(ids);
  const query = new URLSearchParams({ vs_currency: 'usd', ids: ids.join(','), price_change_percentage: '24h' });
  return parseMarkets(await get(`/coins/markets?${query}`));
}

export async function fetchChart(id: string, days: number): Promise<Point[]> {
  if (DEMO) return demoChart(id, days);
  return parseChart(await get(`/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=${days}`));
}

export async function searchCoins(query: string): Promise<SearchHit[]> {
  if (DEMO) return demoSearch(query);
  return parseSearch(await get(`/search?query=${encodeURIComponent(query)}`)).slice(0, 12);
}
