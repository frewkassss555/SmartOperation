import { db, SCHEMA_VERSION, TABLES, type TableName } from './db';
import { DEFAULT_SETTINGS, DEFAULT_WATCH, type Settings } from './types';

export type Backup = {
  app: 'tracker';
  version: number;
  exportedAt: string;
  tables: Record<TableName, unknown[]>;
};

export type ImportMode = 'replace' | 'merge';

export async function exportBackup(): Promise<Backup> {
  const entries = await Promise.all(TABLES.map(async (name) => [name, await db.table(name).toArray()] as const));
  return {
    app: 'tracker',
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    tables: Object.fromEntries(entries) as Record<TableName, unknown[]>,
  };
}

export function backupFileName(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `tracker-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`;
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Validates a parsed export. Returns a readable Russian error for the UI. */
export function parseBackup(text: string): { ok: true; backup: Backup } | { ok: false; error: string } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Файл не похож на JSON.' };
  }
  if (!isObject(data) || data.app !== 'tracker' || !isObject(data.tables)) {
    return { ok: false, error: 'Это не экспорт Трекера.' };
  }
  if (typeof data.version !== 'number' || !Number.isInteger(data.version) || data.version < 1) {
    return { ok: false, error: 'В файле нет номера версии.' };
  }
  if (data.version > SCHEMA_VERSION) {
    return { ok: false, error: `Файл из более новой версии приложения (${data.version}). Обновите приложение.` };
  }

  const tables = {} as Record<TableName, unknown[]>;
  for (const name of TABLES) {
    const rows = data.tables[name] ?? [];
    if (!Array.isArray(rows)) return { ok: false, error: `Таблица «${name}» повреждена.` };
    const key = name === 'watch' ? 'coinId' : 'id';
    if (!rows.every((row) => isObject(row) && typeof row[key] === 'string')) {
      return { ok: false, error: `В таблице «${name}» есть записи без ключа.` };
    }
    tables[name] = rows;
  }

  // v1 → v2 only added cache tables (not exported); v3 added the focus table, which older
  // files simply lack (read as empty). So v1 and v2 files load as they are.
  // Later migrations of exported tables go here, step by step.
  return { ok: true, backup: { app: 'tracker', version: SCHEMA_VERSION, exportedAt: String(data.exportedAt ?? ''), tables } };
}

/**
 * Replace: wipe everything and load the file. Merge: upsert records by id (the file wins on
 * conflicts) and keep current settings, adding categories that only the file has.
 */
export async function importBackup(backup: Backup, mode: ImportMode): Promise<void> {
  await db.transaction('rw', TABLES.map((name) => db.table(name)), async () => {
    const current = (await db.settings.get('app')) ?? DEFAULT_SETTINGS;
    const incoming = backup.tables.settings.find((s) => isObject(s) && s.id === 'app') as Partial<Settings> | undefined;

    if (mode === 'replace') {
      for (const name of TABLES) await db.table(name).clear();
    }
    for (const name of TABLES) {
      if (name === 'settings') continue;
      await db.table(name).bulkPut(backup.tables[name]);
    }

    const settings: Settings =
      mode === 'replace'
        ? { ...DEFAULT_SETTINGS, ...incoming, id: 'app', persistAsked: current.persistAsked }
        : {
            ...current,
            categories: [...new Set([...current.categories, ...(incoming?.categories ?? [])])],
          };
    await db.settings.put(settings);
    if (mode === 'replace' && backup.tables.watch.length === 0) await db.watch.bulkPut(DEFAULT_WATCH);
  });
}

/**
 * Deletes all user data and restores defaults. Quote caches stay: they are public market
 * data, and keeping them means prices show at once instead of after the next refresh.
 */
export async function deleteAllData(): Promise<void> {
  await db.transaction('rw', TABLES.map((name) => db.table(name)), async () => {
    const current = await db.settings.get('app');
    for (const name of TABLES) await db.table(name).clear();
    await db.settings.put({ ...DEFAULT_SETTINGS, persistAsked: current?.persistAsked ?? false });
    await db.watch.bulkPut(DEFAULT_WATCH);
  });
}
