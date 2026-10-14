import { useEffect, useState } from 'react';
import { Button, Dialog, Field, SelectField } from '../../design';
import type { Lesson, Subject } from '../../db/types';
import { isValidTime, toMinutes, type Parity } from '../../lib/schedule';
import { addSubject } from '../grades/data';
import { deleteLesson, saveLesson } from './data';
import styles from './Schedule.module.css';

const NEW_SUBJECT = '__new__';

const WEEKS = [
  { value: '', label: 'Каждую неделю' },
  { value: 'even', label: 'Только чётные' },
  { value: 'odd', label: 'Только нечётные' },
];

type Props = {
  open: boolean;
  onClose: () => void;
  day: number;
  dayLabel: string;
  lesson?: Lesson | undefined;
  subjects: readonly Subject[];
  parityOn: boolean;
  /** End of the day's last lesson: a new lesson starts 10 minutes later. */
  previousEnd?: string | undefined;
};

const addMinutes = (time: string, minutes: number) => {
  const total = Math.min(toMinutes(time) + minutes, 23 * 60 + 59);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

export function LessonDialog({ open, onClose, day, dayLabel, lesson, subjects, parityOn, previousEnd }: Props) {
  const active = subjects.filter((s) => !s.archived || s.id === lesson?.subjectId);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [newName, setNewName] = useState('');
  const [room, setRoom] = useState('');
  const [note, setNote] = useState('');
  const [week, setWeek] = useState<Parity | ''>('');
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!open) return;
    const s = lesson?.start ?? (previousEnd && isValidTime(previousEnd) ? addMinutes(previousEnd, 10) : '08:30');
    setStart(s);
    setEnd(lesson?.end ?? addMinutes(s, 45));
    setSubjectId(lesson?.subjectId ?? active[0]?.id ?? NEW_SUBJECT);
    setNewName('');
    setRoom(lesson?.room ?? '');
    setNote(lesson?.note ?? '');
    setWeek(lesson?.week ?? '');
    setError(undefined);
    // Reset only when the dialog opens, not when the subject list changes underneath.
  }, [open, lesson]);

  const options = [
    ...active.map((s) => ({ value: s.id, label: s.name })),
    { value: NEW_SUBJECT, label: '+ Новый предмет' },
  ];

  const submit = async () => {
    if (!isValidTime(start) || !isValidTime(end)) return setError('Время в формате ЧЧ:ММ');
    if (toMinutes(end) <= toMinutes(start)) return setError('Конец урока позже начала');
    let id = subjectId;
    if (id === NEW_SUBJECT) {
      if (!newName.trim()) return setError('Введите название предмета');
      id = await addSubject(newName);
    }
    await saveLesson(
      { day, start, end, subjectId: id, room: room.trim() || undefined, note: note.trim() || undefined, week: week || undefined },
      lesson?.id,
    );
    onClose();
  };

  const subjectName = subjects.find((s) => s.id === lesson?.subjectId)?.name ?? '';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      kicker={dayLabel}
      title={lesson ? 'Изменить урок' : 'Новый урок'}
      onSubmit={submit}
      actions={
        <>
          {lesson && (
            <Button
              variant="ghost"
              onClick={async () => {
                onClose();
                await deleteLesson(lesson, subjectName);
              }}
            >
              Удалить
            </Button>
          )}
          <Button variant="primary" type="submit">
            Сохранить
          </Button>
        </>
      }
    >
      <div className={styles.times}>
        <Field
          label="Начало"
          type="time"
          value={start}
          onChange={(e) => {
            const next = e.target.value;
            // Keep the lesson length when the start moves.
            if (isValidTime(start) && isValidTime(end) && isValidTime(next)) setEnd(addMinutes(next, toMinutes(end) - toMinutes(start)));
            setStart(next);
            setError(undefined);
          }}
        />
        <Field label="Конец" type="time" value={end} onChange={(e) => (setEnd(e.target.value), setError(undefined))} />
      </div>
      <SelectField label="Предмет" options={options} value={subjectId} onChange={(e) => setSubjectId(e.target.value)} />
      {subjectId === NEW_SUBJECT && (
        <Field label="Название предмета" value={newName} onChange={(e) => (setNewName(e.target.value), setError(undefined))} maxLength={40} />
      )}
      <Field label="Кабинет" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Например, 214" maxLength={12} />
      <Field label="Заметка" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Необязательно" maxLength={80} />
      {parityOn && <SelectField label="Неделя" options={WEEKS} value={week} onChange={(e) => setWeek(e.target.value as Parity | '')} />}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </Dialog>
  );
}
