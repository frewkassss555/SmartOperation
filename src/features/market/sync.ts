import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect } from 'react';
import { create } from 'zustand';
import { useUi } from '../../app/uiStore';
import { db } from '../../db/db';
import type { Watch } from '../../db/types';
import { fetchChart, fetchMarkets, RateLimitError } from '../../lib/coingecko';
import { downsample, nextBackoff } from '../../lib/market';
import { evaluateAlerts } from './alerts';

/** Quotes refresh period while the tab is visible; also the per-request throttle. */
export const REFRESH_MS = 60_000;

export type SyncState = 'idle' | 'loading' | 'ok' | 'offline' | 'limited' | 'error';

type MarketStatus = {
  state: SyncState;
  /** While rate limited: no requests before this time (epoch ms). */
  pausedUntil: number;
  backoffMs: number;
};

export const useMarketStatus = create<MarketStatus>(() => ({ state: 'idle', pausedUntil: 0, backoffMs: 0 }));

/** Last request time per request key, in memory: at most one request per key per minute. */
const lastRequest = new Map<string, number>();

function throttled(key: string, now: number): boolean {
  const last = lastRequest.get(key);
  return last !== undefined && now - last < REFRESH_MS;
}

function fail(error: unknown) {
  if (error instanceof RateLimitError) {
    const backoffMs = nextBackoff(useMarketStatus.getState().backoffMs);
    useMarketStatus.setState({ state: 'limited', backoffMs, pausedUntil: Date.now() + backoffMs });
  } else {
    useMarketStatus.setState({ state: navigator.onLine ? 'error' : 'offline' });
  }
}

// Offline, the service worker may still answer from its cache: the data is the last saved one.
const succeed = () => useMarketStatus.setState({ state: navigator.onLine ? 'ok' : 'offline', backoffMs: 0, pausedUntil: 0 });
const paused = (now: number) => now < useMarketStatus.getState().pausedUntil;

/** One batched /coins/markets request for the whole watch list. */
export async function refreshQuotes(force = false): Promise<void> {
  const now = Date.now();
  const watch = await db.watch.orderBy('order').toArray();
  const ids = watch.map((w) => w.coinId);
  const key = `markets:${[...ids].sort().join(',')}`;
  if (ids.length === 0 || paused(now) || (!force && throttled(key, now))) return;
  lastRequest.set(key, now);
  if (useMarketStatus.getState().state === 'idle') useMarketStatus.setState({ state: 'loading' });
  try {
    const quotes = await fetchMarkets(ids);
    await db.transaction('rw', db.quotes, db.watch, async () => {
      await db.quotes.bulkPut(
        quotes.map((q) => ({ coinId: q.id, symbol: q.symbol, name: q.name, price: q.price, change24h: q.change24h, updatedAt: q.updatedAt })),
      );
      for (const q of quotes) await db.watch.update(q.id, { symbol: q.symbol, name: q.name });
    });
    succeed();
    await evaluateAlerts();
  } catch (error) {
    fail(error);
  }
}

/** Price series for one coin and period, downsampled to ≤120 points and cached. */
export async function refreshChart(coinId: string, days: number): Promise<void> {
  const now = Date.now();
  const key = `${coinId}:${days}`;
  if (paused(now) || throttled(key, now)) return;
  lastRequest.set(key, now);
  try {
    const points = downsample(await fetchChart(coinId, days));
    if (points.length > 0) await db.charts.put({ key, coinId, days, points, updatedAt: points.at(-1)![0] });
    succeed();
  } catch (error) {
    fail(error);
  }
}

/**
 * Keeps quotes fresh while the app is open and visible: refreshes every minute,
 * right after the tab becomes visible again or the network comes back.
 */
export function useMarketSync(): void {
  const coin = useUi((s) => s.coin);
  const period = useUi((s) => s.marketPeriod);
  const watchKey = useLiveQuery(async () => (await db.watch.toArray()).map((w) => w.coinId).sort().join(','), []);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== 'visible') return;
      void refreshQuotes();
      void refreshChart(useUi.getState().coin, Number(useUi.getState().marketPeriod));
    };
    tick();
    const timer = window.setInterval(tick, REFRESH_MS);
    const onOnline = () => {
      useMarketStatus.setState({ state: 'loading' });
      lastRequest.clear();
      tick();
    };
    const onOffline = () => useMarketStatus.setState({ state: 'offline' });
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // A new coin or period loads at once (still throttled per coin and period).
  useEffect(() => {
    void refreshChart(coin, Number(period));
  }, [coin, period]);

  // Watch list changed: fetch quotes for the new set.
  useEffect(() => {
    if (watchKey) void refreshQuotes();
  }, [watchKey]);
}

export function useWatchList(): Watch[] | undefined {
  return useLiveQuery(() => db.watch.orderBy('order').toArray(), []);
}
