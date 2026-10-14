// A notional portfolio: amounts and buy prices typed by the user, valued at the last price.

export type Position = {
  coinId: string;
  amount: number;
  /** USD per coin at purchase. */
  buyPrice: number;
  /** Last known USD price, or null when there is no quote yet. */
  price: number | null;
};

export type Valued = Position & { value: number | null; cost: number; pnl: number | null; pnlPct: number | null };

export function valuePosition(p: Position): Valued {
  const cost = p.amount * p.buyPrice;
  const value = p.price === null ? null : p.amount * p.price;
  const pnl = value === null ? null : value - cost;
  return { ...p, cost, value, pnl, pnlPct: pnl === null || cost === 0 ? null : (pnl / cost) * 100 };
}

/** Totals over positions that have a price; positions without a quote are left out of value and P/L. */
export function portfolioTotals(positions: readonly Valued[]): { value: number; cost: number; pnl: number; pnlPct: number | null } {
  let value = 0;
  let cost = 0;
  for (const p of positions) {
    if (p.value === null) continue;
    value += p.value;
    cost += p.cost;
  }
  const pnl = value - cost;
  return { value, cost, pnl, pnlPct: cost === 0 ? null : (pnl / cost) * 100 };
}

/** Coin amount without trailing zeros: 0.5 → "0,5", 1.23456789 → "1,23456789". */
export function formatAmount(amount: number): string {
  return amount.toLocaleString('ru-RU', { maximumFractionDigits: 8 }).replace(/ /g, ' ');
}

/** "+$1 234" / "−$56,10" */
export function formatSignedUsd(value: number): string {
  const abs = Math.abs(value);
  const digits = abs >= 1000 ? 0 : 2;
  const text = abs.toLocaleString('ru-RU', { minimumFractionDigits: digits, maximumFractionDigits: digits }).replace(/ /g, ' ');
  if (Number(abs.toFixed(digits)) === 0) return `$${text}`;
  return `${value > 0 ? '+' : '−'}$${text}`;
}
