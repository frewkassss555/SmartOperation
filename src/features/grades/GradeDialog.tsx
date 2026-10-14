import { useEffect, useState } from 'react';
import { Button, Dialog, Field, Segmented } from '../../design';
import type { Grade } from '../../db/types';
import { toIsoDate } from '../../lib/date';
import type { GradeScale } from '../../lib/grades';
import { deleteGrade, saveGrade } from './data';
import styles from './Grades.module.css';
import { ValuePicker } from './ValuePicker';

const WEIGHTS = [
  { value: '1', label: '×1' },
  { value: '2', label: '×2' },
  { value: '3', label: '×3' },
] as const;

type GradeDialogProps = {
  open: boolean;
  onClose: () => void;
  subjectId: string;
  subjectName: string;
  scale: GradeScale;
  /** Edit this grade; create a new one when absent. */
  grade?: Grade | undefined;
};

export function GradeDialog({ open, onClose, subjectId, subjectName, scale, grade }: GradeDialogProps) {
  const [value, setValue] = useState<number | null>(null);
  const [weight, setWeight] = useState<'1' | '2' | '3'>('1');
  const [date, setDate] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!open) return;
    setValue(grade?.value ?? null);
    setWeight(String(grade?.weight ?? 1) as '1' | '2' | '3');
    setDate(grade?.date ?? toIsoDate(new Date()));
    setComment(grade?.comment ?? '');
    setError(undefined);
  }, [open, grade]);

  const submit = async () => {
    if (value === null) return setError('Выберите оценку');
    if (!date) return setError('Укажите дату');
    await saveGrade(
      { subjectId, value, weight: Number(weight), date, comment: comment.trim() || undefined },
      grade?.id,
    );
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      kicker={subjectName}
      title={grade ? 'Изменить оценку' : 'Новая оценка'}
      onSubmit={submit}
      actions={
        <>
          {grade && (
            <Button
              variant="ghost"
              onClick={async () => {
                onClose();
                await deleteGrade(grade);
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
      <div className={styles.group}>
        <span className="label">Оценка</span>
        <ValuePicker scale={scale} value={value} onPick={(v) => (setValue(v), setError(undefined))} label="Оценка" />
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>
      <div className={styles.group}>
        <span className="label">Вес</span>
        <Segmented label="Вес оценки" options={WEIGHTS} value={weight} onChange={setWeight} />
      </div>
      <Field label="Дата" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      <Field label="Комментарий" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Необязательно" maxLength={120} />
    </Dialog>
  );
}
