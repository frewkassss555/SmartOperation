import { useEffect, useState } from 'react';
import { Button, Dialog, Field, SelectField } from '../../design';
import type { Subject, Task } from '../../db/types';
import { addDays, toIsoDate } from '../../lib/date';
import { deleteTask, saveTask } from './data';

type Props = { open: boolean; onClose: () => void; task?: Task | undefined; subjects: readonly Subject[] };

export function TaskDialog({ open, onClose, task, subjects }: Props) {
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? '');
    setDue(task?.due ?? toIsoDate(addDays(new Date(), 7)));
    setSubjectId(task?.subjectId ?? '');
    setError(undefined);
  }, [open, task]);

  const options = [
    { value: '', label: 'Без предмета' },
    ...subjects.filter((s) => !s.archived || s.id === task?.subjectId).map((s) => ({ value: s.id, label: s.name })),
  ];

  const submit = async () => {
    if (!title.trim()) return setError('Что нужно сделать?');
    await saveTask({ title: title.trim(), due: due || toIsoDate(new Date()), subjectId: subjectId || undefined }, task);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      kicker="Дедлайн"
      title={task ? 'Изменить' : 'Новый дедлайн'}
      onSubmit={submit}
      actions={
        <>
          {task && (
            <Button
              variant="ghost"
              onClick={async () => {
                onClose();
                await deleteTask(task);
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
      <Field
        label="Задача"
        value={title}
        onChange={(e) => (setTitle(e.target.value), setError(undefined))}
        placeholder="Например, реферат по истории"
        maxLength={80}
        autoFocus={!task}
        error={error}
      />
      <Field label="Срок" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
      <SelectField label="Предмет" options={options} value={subjectId} onChange={(e) => setSubjectId(e.target.value)} />
    </Dialog>
  );
}
