import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { describe, expect, it } from 'vitest';
import { TrackerDb } from './db';

describe('schema migrations', () => {
  it('upgrades a v1 database to the current version without losing data', async () => {
    const legacy = new Dexie('migration-v1');
    legacy.version(1).stores({
      subjects: 'id',
      grades: 'id, subjectId, date',
      txns: 'id, date, category, seriesId',
      lessons: 'id, day, subjectId',
      notes: 'id, updatedAt, tag, subjectId',
      watch: 'coinId, order',
      tasks: 'id, due, subjectId',
      settings: 'id',
    });
    await legacy.table('watch').bulkAdd([
      { coinId: 'bitcoin', order: 0 },
      { coinId: 'dogecoin', order: 1 },
    ]);
    await legacy.table('subjects').add({ id: 's1', name: 'Физика', archived: false });
    legacy.close();

    const db = new TrackerDb('migration-v1');
    await db.open();
    expect(db.verno).toBe(3);
    expect(await db.subjects.get('s1')).toEqual({ id: 's1', name: 'Физика', archived: false });
    expect(await db.watch.get('bitcoin')).toMatchObject({ symbol: 'BTC', name: 'Bitcoin' });
    expect(await db.watch.get('dogecoin')).toEqual({ coinId: 'dogecoin', order: 1 });
    expect(await db.quotes.count()).toBe(0);
    expect(await db.focus.count()).toBe(0);
    db.close();
  });
});
