import { toIsoDate } from '../lib/date';
import { dueOccurrences } from '../lib/recurring';
import { db, newId } from './db';
import type { Txn } from './types';

/** Creates due occurrences of repeating transactions. Runs when the app opens. */
export async function applyRecurring(today = new Date()): Promise<number> {
  const todayIso = toIsoDate(today);
  return db.transaction('rw', db.txns, async () => {
    const templates = (await db.txns.toArray()).filter((t) => t.repeat);
    let created = 0;
    for (const template of templates) {
      const dates = dueOccurrences({ date: template.date, repeat: template.repeat!, lastRun: template.lastRun }, todayIso);
      if (dates.length === 0) continue;
      const copies: Txn[] = dates.map((date) => ({
        id: newId(),
        kind: template.kind,
        amount: template.amount,
        category: template.category,
        date,
        note: template.note,
        seriesId: template.id,
      }));
      await db.txns.bulkAdd(copies);
      await db.txns.update(template.id, { lastRun: dates.at(-1) });
      created += copies.length;
    }
    return created;
  });
}
