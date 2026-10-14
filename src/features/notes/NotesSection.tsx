import { useState } from 'react';
import { Button, Chip, EmptyState, Field } from '../../design';
import type { Note } from '../../db/types';
import { filterNotes, noteTags } from '../../lib/notes';
import { useSubjects } from '../schedule/data';
import type { SectionProps } from '../types';
import { createNote, useNotes } from './data';
import { NoteEditor } from './NoteEditor';
import styles from './Notes.module.css';

const formatStamp = (ms: number) => {
  const d = new Date(ms);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export function NotesSection({ wide }: SectionProps) {
  const notes = useNotes();
  const subjects = useSubjects();
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [fresh, setFresh] = useState<Note | null>(null);

  const all = notes ?? [];
  const tags = noteTags(all);
  const activeTag = tag !== null && tags.includes(tag) ? tag : null;
  const visible = filterNotes(all, query, activeTag);
  // A just-created note may not have arrived through the live query yet.
  const open = all.find((n) => n.id === openId) ?? (fresh?.id === openId ? fresh : null);
  const subjectName = (id: string | undefined) => subjects.find((s) => s.id === id)?.name;

  const startNew = async () => {
    const note = await createNote();
    setFresh(note);
    setOpenId(note.id);
  };

  return (
    <div className={styles.section}>
      <div className={wide ? styles.topWide : styles.top}>
        <Button variant="primary" size="lg" block onClick={startNew}>
          Новая заметка +
        </Button>

        {all.length > 0 && (
          <div className={styles.tools}>
            <Field label="Поиск" type="search" placeholder="Заголовок или текст" value={query} onChange={(e) => setQuery(e.target.value)} />
            {tags.length > 0 && (
              <div className={styles.filters} role="group" aria-label="Фильтр по тегу">
                <Chip pressed={activeTag === null} onClick={() => setTag(null)}>
                  Все
                </Chip>
                {tags.map((t) => (
                  <Chip key={t} pressed={activeTag === t} onClick={() => setTag(activeTag === t ? null : t)}>
                    {t}
                  </Chip>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {notes !== undefined && all.length === 0 && (
        <EmptyState title="Заметок пока нет">
          Конспекты, идеи и списки: заметка сохраняется сама, пока вы печатаете.
        </EmptyState>
      )}

      {all.length > 0 && visible.length === 0 && <p className={styles.muted}>Ничего не найдено.</p>}

      {visible.length > 0 && (
        <ul className={`${wide ? styles.cardsGrid : styles.cards} appear`} aria-label="Заметки">
          {visible.map((n) => (
            <li key={n.id}>
              <button type="button" className={styles.card} onClick={() => setOpenId(n.id)}>
                <span className={styles.cardTop}>
                  {(n.tag || n.pinned) && <Chip filled={n.pinned}>{n.tag || 'Закреплено'}</Chip>}
                  {subjectName(n.subjectId) && <span className="label">{subjectName(n.subjectId)}</span>}
                  <span className={styles.date}>{formatStamp(n.updatedAt)}</span>
                </span>
                <span className={styles.title}>{n.title || 'Без названия'}</span>
                {n.body && <span className={styles.body}>{n.body}</span>}
                {n.pinned && <span className="visually-hidden">Закреплена</span>}
              </button>
            </li>
          ))}
        </ul>
      )}

      <NoteEditor note={open} onClose={() => (setOpenId(null), setFresh(null))} tags={tags} subjects={subjects} />
    </div>
  );
}
