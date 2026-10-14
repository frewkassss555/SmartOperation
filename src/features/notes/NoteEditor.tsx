import { useEffect, useId, useRef, useState } from 'react';
import { Button, Dialog, Field, SelectField, TextAreaField } from '../../design';
import type { Note, Subject } from '../../db/types';
import { deleteNote, discardIfBlank, saveNote, type NoteDraft } from './data';
import styles from './Notes.module.css';

/** Autosave delay after the last keystroke. */
const SAVE_DELAY_MS = 400;

type Props = {
  note: Note | null;
  onClose: () => void;
  tags: readonly string[];
  subjects: readonly Subject[];
};

const toDraft = (n: Note): NoteDraft => ({ title: n.title, body: n.body, tag: n.tag, pinned: n.pinned, subjectId: n.subjectId });

export function NoteEditor({ note, onClose, tags, subjects }: Props) {
  const [draft, setDraft] = useState<NoteDraft | null>(null);
  const [saved, setSaved] = useState(true);
  const timer = useRef<number | undefined>(undefined);
  const pending = useRef<{ id: string; draft: NoteDraft } | null>(null);
  const tagListId = useId();

  useEffect(() => {
    setDraft(note ? toDraft(note) : null);
    setSaved(true);
    // Only when a different note opens; live updates of the same note must not reset typing.
  }, [note?.id]);

  const flush = async () => {
    window.clearTimeout(timer.current);
    const job = pending.current;
    pending.current = null;
    if (job) await saveNote(job.id, job.draft);
    setSaved(true);
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const change = (patch: Partial<NoteDraft>) => {
    if (!note || !draft) return;
    const next = { ...draft, ...patch };
    setDraft(next);
    setSaved(false);
    pending.current = { id: note.id, draft: next };
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, SAVE_DELAY_MS);
  };

  const close = async () => {
    const id = note?.id;
    await flush();
    onClose();
    if (id) await discardIfBlank(id);
  };

  const subjectOptions = [
    { value: '', label: 'Без предмета' },
    ...subjects.filter((s) => !s.archived || s.id === draft?.subjectId).map((s) => ({ value: s.id, label: s.name })),
  ];

  return (
    <Dialog
      open={note !== null}
      onClose={close}
      kicker={saved ? 'Заметка · сохранено' : 'Заметка · сохраняю…'}
      title={draft?.title.trim() || 'Новая заметка'}
      actions={
        note && (
          <>
            <Button
              variant="ghost"
              onClick={async () => {
                window.clearTimeout(timer.current);
                pending.current = null;
                onClose();
                await deleteNote({ ...note, ...draft });
              }}
            >
              Удалить
            </Button>
            <Button variant="primary" onClick={close}>
              Готово
            </Button>
          </>
        )
      }
    >
      {draft && (
        <>
          <Field label="Заголовок" value={draft.title} onChange={(e) => change({ title: e.target.value })} maxLength={80} autoFocus={!draft.title} />
          <TextAreaField label="Текст" value={draft.body} onChange={(e) => change({ body: e.target.value })} rows={8} />
          <div className={styles.meta}>
            <Field
              label="Тег"
              value={draft.tag ?? ''}
              onChange={(e) => change({ tag: e.target.value.toLocaleLowerCase('ru') || undefined })}
              list={tagListId}
              placeholder="учёба, идеи…"
              maxLength={24}
            />
            <datalist id={tagListId}>
              {tags.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
            <SelectField
              label="Предмет"
              options={subjectOptions}
              value={draft.subjectId ?? ''}
              onChange={(e) => change({ subjectId: e.target.value || undefined })}
            />
          </div>
          <Button variant={draft.pinned ? 'primary' : 'secondary'} aria-pressed={draft.pinned} onClick={() => change({ pinned: !draft.pinned })}>
            {draft.pinned ? 'Закреплено' : 'Закрепить'}
          </Button>
        </>
      )}
    </Dialog>
  );
}
