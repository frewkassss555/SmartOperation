import { useLiveQuery } from 'dexie-react-hooks';
import type { FinanceRange } from '../../app/uiStore';
import { removeWithUndo } from '../../app/undo';
import { db, newId } from '../../db/db';
import { applyRecurring } from '../../db/recurring';
import { requestPersistenceOnce } from '../../db/settings';
import type { Txn } from '../../db/types';
import { addDays, daysInMonth, mondayIndex, toIsoDate } from '../../lib/date';

export function useTxns(): Txn[] | undefined {
  return useLiveQuery(() => db.txns.orderBy('date').reverse().toArray(), []);
}

/** ISO dates of the current week (Mon–Sun) or month. */
export function rangeDates(range: FinanceRange, today: Date): string[] {
  if (range === 'week') {
    const monday = addDays(today, -mondayIndex(today));
    return Array.from({ length: 7 }, (_, i) => toIsoDate(addDays(monday, i)));
  }
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  return Array.from({ length: daysInMonth(today) }, (_, i) => toIsoDate(addDays(first, i)));
}

export type TxnInput = Omit<Txn, 'id' | 'lastRun' | 'seriesId'>;

export async function saveTxn(input: TxnInput, existing?: Txn) {
  if (existing) {
    // Changing the date or repeat of a template restarts its series from the new date.
    const restart = existing.date !== input.date || existing.repeat !== input.repeat;
    await db.txns.put({ ...existing, ...input, lastRun: restart ? undefined : existing.lastRun });
  } else {
    await db.txns.add({ ...input, id: newId() });
  }
  if (input.repeat) await applyRecurring();
  void requestPersistenceOnce();
}

export async function deleteTxn(txn: Txn) {
  await removeWithUndo(`Удалено: ${txn.note || txn.category}`, [{ table: 'txns', ids: [txn.id] }]);
}
