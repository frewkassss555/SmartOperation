// Money is stored as integer minor units (kopecks) to avoid floating-point drift.

export type TxnKind = 'in' | 'out';

/** Parses user input like "6.4", "6,40", "1 200" into minor units; null if invalid or not positive. */
export function parseMoney(input: string): number | null {
  const cleaned = input.replace(/[\s ]/g, '').replace(',', '.');
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const [whole = '0', frac = ''] = cleaned.split('.');
  const minor = Number(whole) * 100 + Number(frac.padEnd(2, '0'));
  return Number.isSafeInteger(minor) ? minor : null;
}

/** Same as parseMoney but allows zero and a leading minus (for the start balance). */
export function parseSignedMoney(input: string): number | null {
  const trimmed = input.trim().replace(/^[−-]/, '');
  const negative = trimmed.length !== input.trim().length;
  if (trimmed.replace(/[\s ]/g, '') === '0') return 0;
  const value = parseMoney(trimmed);
  return value === null ? null : negative ? -value : value;
}

const group = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** 123456 → "1 234,56". Uses a true minus sign for negatives. */
export function formatMinor(minor: number): string {
  const abs = Math.abs(Math.round(minor));
  const text = `${group(String(Math.floor(abs / 100)))},${String(abs % 100).padStart(2, '0')}`;
  return minor < 0 ? `−${text}` : text;
}

/** Amount with currency symbol: "1 234,56 Br". */
export function formatMoney(minor: number, currency: string): string {
  return currency ? `${formatMinor(minor)} ${currency}` : formatMinor(minor);
}

/** Whole units only, for compact chart labels: 123456 → "1 235". */
export function formatMoneyShort(minor: number): string {
  return group(String(Math.round(Math.abs(minor) / 100)));
}

/** Input value for an edit form: 640 → "6,40". */
export function minorToInput(minor: number): string {
  const abs = Math.abs(minor);
  const text = `${Math.floor(abs / 100)},${String(abs % 100).padStart(2, '0')}`;
  return minor < 0 ? `-${text}` : text;
}

type Flow = { kind: TxnKind; amount: number };

export function totals(txns: readonly Flow[]): { income: number; expense: number } {
  let income = 0;
  let expense = 0;
  for (const t of txns) {
    if (t.kind === 'in') income += t.amount;
    else expense += t.amount;
  }
  return { income, expense };
}

/** Balance = start balance + income − expenses. */
export function balance(startBalance: number, txns: readonly Flow[]): number {
  const { income, expense } = totals(txns);
  return startBalance + income - expense;
}

/** Sum of expenses per ISO date for the given list of dates. */
export function expensesByDay(txns: readonly (Flow & { date: string })[], dates: readonly string[]): number[] {
  const sums = new Map<string, number>(dates.map((d) => [d, 0]));
  for (const t of txns) {
    if (t.kind !== 'out') continue;
    const current = sums.get(t.date);
    if (current !== undefined) sums.set(t.date, current + t.amount);
  }
  return dates.map((d) => sums.get(d) ?? 0);
}
