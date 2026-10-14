import { create } from 'zustand';
import { db, type TableName } from '../db/db';

// The square bottom bar: "УДАЛЕНО … ОТМЕНИТЬ", visible for 5 seconds.

const VISIBLE_MS = 5000;

type Notice = { id: number; message: string; undo?: (() => Promise<void>) | undefined };

type UndoState = {
  notice: Notice | null;
  show: (message: string, undo?: () => Promise<void>) => void;
  dismiss: () => void;
};

let timer: number | undefined;
let counter = 0;

export const useUndo = create<UndoState>((set) => ({
  notice: null,
  show: (message, undo) => {
    window.clearTimeout(timer);
    const id = ++counter;
    set({ notice: { id, message, undo } });
    timer = window.setTimeout(() => set((s) => (s.notice?.id === id ? { notice: null } : s)), VISIBLE_MS);
  },
  dismiss: () => {
    window.clearTimeout(timer);
    set({ notice: null });
  },
}));

export const notify = (message: string, undo?: () => Promise<void>) => useUndo.getState().show(message, undo);

type Removal = { table: TableName; ids: string[] };

/**
 * Deletes records from one or more tables at once and offers to restore them.
 * No confirmation dialogs: the undo bar is the safety net.
 */
export async function removeWithUndo(message: string, removals: Removal[]): Promise<void> {
  const tables = removals.map((r) => db.table(r.table));
  const snapshot = await db.transaction('rw', tables, async () => {
    const saved: { table: TableName; rows: unknown[] }[] = [];
    for (const { table, ids } of removals) {
      const rows = (await db.table(table).bulkGet(ids)).filter(Boolean);
      saved.push({ table, rows });
      await db.table(table).bulkDelete(ids);
    }
    return saved;
  });

  notify(message, async () => {
    await db.transaction('rw', tables, async () => {
      for (const { table, rows } of snapshot) await db.table(table).bulkPut(rows);
    });
  });
}
