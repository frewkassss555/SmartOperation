import { useEffect, useState } from 'react';
import { Button, Dialog, Field } from '../../design';
import type { Subject } from '../../db/types';
import { addSubject, renameSubject } from './data';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Rename this subject; create a new one when absent. */
  subject?: Subject | undefined;
  existing: readonly Subject[];
  onCreated?: (id: string) => void;
};

export function SubjectNameDialog({ open, onClose, subject, existing, onCreated }: Props) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (open) {
      setName(subject?.name ?? '');
      setError(undefined);
    }
  }, [open, subject]);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return setError('Введите название');
    const clash = existing.some((s) => s.id !== subject?.id && s.name.toLocaleLowerCase('ru') === trimmed.toLocaleLowerCase('ru'));
    if (clash) return setError('Такой предмет уже есть');
    if (subject) await renameSubject(subject.id, trimmed);
    else onCreated?.(await addSubject(trimmed));
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      kicker="Предмет"
      title={subject ? 'Переименовать' : 'Новый предмет'}
      onSubmit={submit}
      actions={
        <Button variant="primary" type="submit">
          {subject ? 'Сохранить' : 'Добавить'}
        </Button>
      }
    >
      <Field
        label="Название"
        value={name}
        onChange={(e) => (setName(e.target.value), setError(undefined))}
        placeholder="Например, Математика"
        maxLength={40}
        autoFocus
        error={error}
      />
    </Dialog>
  );
}
