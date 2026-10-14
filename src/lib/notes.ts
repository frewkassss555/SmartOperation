type NoteLike = { title: string; body: string; tag?: string | undefined; pinned: boolean; updatedAt: number };

/** Search by title and body, filter by tag; pinned notes first, then newest first. */
export function filterNotes<T extends NoteLike>(notes: readonly T[], query: string, tag: string | null): T[] {
  const q = query.trim().toLocaleLowerCase('ru');
  return notes
    .filter((n) => tag === null || n.tag === tag)
    .filter((n) => !q || n.title.toLocaleLowerCase('ru').includes(q) || n.body.toLocaleLowerCase('ru').includes(q))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
}

/** Distinct tags in alphabetical order. */
export function noteTags(notes: readonly NoteLike[]): string[] {
  const tags = new Set<string>();
  for (const n of notes) if (n.tag) tags.add(n.tag);
  return [...tags].sort((a, b) => a.localeCompare(b, 'ru'));
}

/** A note with no title and no text is not worth keeping. */
export function isBlankNote(note: Pick<NoteLike, 'title' | 'body'>): boolean {
  return note.title.trim() === '' && note.body.trim() === '';
}
