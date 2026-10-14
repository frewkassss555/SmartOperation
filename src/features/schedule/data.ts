import { useLiveQuery } from 'dexie-react-hooks';
import { notify, removeWithUndo } from '../../app/undo';
import { db, newId } from '../../db/db';
import { requestPersistenceOnce } from '../../db/settings';
import type { Lesson } from '../../db/types';
import { lessonsForDay, type Parity } from '../../lib/schedule';

export function useLessons(): Lesson[] | undefined {
  return useLiveQuery(() => db.lessons.toArray(), []);
}

export function useSubjects() {
  return useLiveQuery(() => db.subjects.toArray(), []) ?? [];
}

export type LessonInput = Omit<Lesson, 'id'>;

export async function saveLesson(input: LessonInput, id?: string) {
  if (id) await db.lessons.put({ ...input, id });
  else await db.lessons.add({ ...input, id: newId() });
  void requestPersistenceOnce();
}

export async function deleteLesson(lesson: Lesson, subjectName: string) {
  await removeWithUndo(`Удалён урок ${lesson.start} · ${subjectName}`, [{ table: 'lessons', ids: [lesson.id] }]);
}

/**
 * Copies the visible lessons of one day to another day, replacing what the target shows.
 * With parity on, only lessons of the shown week (and every-week lessons) are involved.
 */
export async function copyDay(from: number, to: number, parity: Parity | null, dayName: string) {
  const all = await db.lessons.toArray();
  const source = lessonsForDay(all, from, parity);
  const replaced = lessonsForDay(all, to, parity);
  const copies: Lesson[] = source.map((l) => ({ ...l, id: newId(), day: to }));

  await db.transaction('rw', db.lessons, async () => {
    await db.lessons.bulkDelete(replaced.map((l) => l.id));
    await db.lessons.bulkAdd(copies);
  });
  notify(`Скопировано в ${dayName}: ${copies.length}`, async () => {
    await db.transaction('rw', db.lessons, async () => {
      await db.lessons.bulkDelete(copies.map((l) => l.id));
      await db.lessons.bulkPut(replaced);
    });
  });
}
