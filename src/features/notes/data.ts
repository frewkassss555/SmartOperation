import { useLiveQuery } from 'dexie-react-hooks';
import { removeWithUndo } from '../../app/undo';
import { db, newId } from '../../db/db';
import { requestPersistenceOnce } from '../../db/settings';
import type { Note } from '../../db/types';
import { isBlankNote } from '../../lib/notes';

export function useNotes(): Note[] | undefined {
  return useLiveQuery(() => db.notes.toArray(), []);
}

export async function createNote(): Promise<Note> {
  const note: Note = { id: newId(), title: '', body: '', pinned: false, updatedAt: Date.now() };
  await db.notes.add(note);
  return note;
}

export type NoteDraft = Pick<Note, 'title' | 'body' | 'tag' | 'pinned' | 'subjectId'>;

export async function saveNote(id: string, draft: NoteDraft) {
  await db.notes.update(id, { ...draft, tag: draft.tag?.trim() || undefined, updatedAt: Date.now() });
  if (!isBlankNote(draft)) void requestPersistenceOnce();
}

/** Drops a note that was opened and left empty; no undo needed for nothing. */
export async function discardIfBlank(id: string) {
  const note = await db.notes.get(id);
  if (note && isBlankNote(note)) await db.notes.delete(id);
}

export async function deleteNote(note: Note) {
  await removeWithUndo(`Удалена заметка «${note.title || 'без названия'}»`, [{ table: 'notes', ids: [note.id] }]);
}
