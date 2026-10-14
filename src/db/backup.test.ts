import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { deleteAllData, exportBackup, importBackup, parseBackup } from './backup';
import { db } from './db';
import { addDemoData } from './demo';

const snapshot = async () => {
  const backup = await exportBackup();
  const sort = (rows: unknown[]) =>
    [...rows].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return Object.fromEntries(Object.entries(backup.tables).map(([k, v]) => [k, sort(v)]));
};

describe('export and import', () => {
  beforeEach(async () => {
    await deleteAllData();
  });

  it('round-trips all tables without loss', async () => {
    await addDemoData(new Date(2026, 9, 14));
    const before = await snapshot();
    const text = JSON.stringify(await exportBackup());

    await deleteAllData();
    expect(await db.grades.count()).toBe(0);

    const parsed = parseBackup(text);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    await importBackup(parsed.backup, 'replace');
    expect(await snapshot()).toEqual(before);
  });

  it('merges by id without duplicates', async () => {
    await addDemoData(new Date(2026, 9, 14));
    const text = JSON.stringify(await exportBackup());
    const count = await db.grades.count();
    const parsed = parseBackup(text);
    if (!parsed.ok) throw new Error(parsed.error);
    await importBackup(parsed.backup, 'merge');
    expect(await db.grades.count()).toBe(count);
  });

  it('rejects foreign and newer files', () => {
    expect(parseBackup('nope')).toMatchObject({ ok: false });
    expect(parseBackup('{"app":"other","tables":{}}')).toMatchObject({ ok: false });
    expect(parseBackup('{"app":"tracker","version":99,"tables":{}}')).toMatchObject({ ok: false });
    expect(parseBackup('{"app":"tracker","version":1,"tables":{"grades":[{"value":5}]}}')).toMatchObject({
      ok: false,
    });
    expect(parseBackup('{"app":"tracker","version":1,"tables":{}}')).toMatchObject({ ok: true });
  });

  it('creates recurring occurrences once', async () => {
    await addDemoData(new Date(2026, 9, 14));
    const series = await db.txns.where('seriesId').notEqual('').count();
    expect(series).toBeGreaterThan(0);
    const { applyRecurring } = await import('./recurring');
    expect(await applyRecurring(new Date(2026, 9, 14))).toBe(0);
  });
});
