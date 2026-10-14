// Monthly category limits and a savings goal. Amounts are minor units.

/** Share of the limit at which the block turns red. */
export const LIMIT_WARN = 0.8;

export type LimitStatus = {
  spent: number;
  limit: number;
  ratio: number;
  /** Filled blocks of a 10-block scale, capped at 10. */
  blocks: number;
  /** At or above 80% of the limit. */
  warn: boolean;
  over: boolean;
};

export function limitStatus(spent: number, limit: number): LimitStatus {
  const ratio = limit > 0 ? spent / limit : 0;
  return {
    spent,
    limit,
    ratio,
    blocks: Math.min(10, Math.max(spent > 0 ? 1 : 0, Math.round(ratio * 10))),
    warn: ratio >= LIMIT_WARN,
    over: ratio > 1,
  };
}

type Flow = { kind: 'in' | 'out'; amount: number; category: string; date: string };

/** Expenses per category in the calendar month of `today`. */
export function monthSpentByCategory(txns: readonly Flow[], today: Date): Map<string, number> {
  const prefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-`;
  const spent = new Map<string, number>();
  for (const t of txns) {
    if (t.kind === 'out' && t.date.startsWith(prefix)) spent.set(t.category, (spent.get(t.category) ?? 0) + t.amount);
  }
  return spent;
}

/** Progress to a savings goal measured by the current balance. */
export function goalProgress(balance: number, target: number): { saved: number; left: number; ratio: number; blocks: number } {
  const saved = Math.max(0, Math.min(balance, target));
  const ratio = target > 0 ? saved / target : 0;
  return { saved, left: Math.max(0, target - balance), ratio, blocks: Math.min(10, Math.floor(ratio * 10)) };
}
