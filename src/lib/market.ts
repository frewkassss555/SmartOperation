// Pure helpers for quotes and price charts.

export type Point = [time: number, price: number];

/** Target size of a chart series: enough detail for 760px, cheap to draw. */
export const MAX_POINTS = 120;

/**
 * Reduces a series to at most `max` points by bucket averaging of time and price,
 * always keeping the first and last real points so the period change stays exact.
 */
export function downsample(points: readonly Point[], max = MAX_POINTS): Point[] {
  if (points.length <= max) return [...points];
  const first = points[0]!;
  const last = points.at(-1)!;
  const inner = points.slice(1, -1);
  const buckets = max - 2;
  const out: Point[] = [first];
  for (let b = 0; b < buckets; b++) {
    const from = Math.floor((b * inner.length) / buckets);
    const to = Math.floor(((b + 1) * inner.length) / buckets);
    let t = 0;
    let p = 0;
    for (let i = from; i < to; i++) {
      t += inner[i]![0];
      p += inner[i]![1];
    }
    const n = to - from;
    if (n > 0) out.push([t / n, p / n]);
  }
  out.push(last);
  return out;
}

/** Change from the first to the last point, in percent; null for fewer than two points. */
export function periodChange(points: readonly Point[]): number | null {
  if (points.length < 2) return null;
  const first = points[0]![1];
  const last = points.at(-1)![1];
  return first === 0 ? null : ((last - first) / first) * 100;
}

export function priceRange(points: readonly Point[]): { min: number; max: number } | null {
  if (points.length === 0) return null;
  let min = Infinity;
  let max = -Infinity;
  for (const [, p] of points) {
    if (p < min) min = p;
    if (p > max) max = p;
  }
  return { min, max };
}

/** USD with precision that suits the magnitude: 81 837 · 3 412,50 · 0,1234. */
export function formatUsd(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const digits = value >= 1000 ? 0 : value >= 1 ? 2 : value >= 0.01 ? 4 : 6;
  const text = value.toLocaleString('ru-RU', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return `$${text.replace(/ /g, ' ')}`;
}

/** "+2,41 %" / "−0,87 %" with a true minus sign. */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const abs = Math.abs(value).toFixed(2).replace('.', ',');
  if (Number(abs.replace(',', '.')) === 0) return '0,00 %';
  return `${value > 0 ? '+' : '−'}${abs} %`;
}

export type Trend = 'up' | 'down' | 'flat';

export function trendOf(change: number | null | undefined): Trend {
  if (change === null || change === undefined || Math.abs(change) < 0.005) return 'flat';
  return change > 0 ? 'up' : 'down';
}

/** Next pause after a 429: doubles from 2 to at most 15 minutes. */
export function nextBackoff(currentMs: number): number {
  return Math.min(15 * 60_000, Math.max(120_000, currentMs * 2));
}

/** "14:20" */
export function formatClock(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
