import { useState } from 'react';
import { Field, Segmented } from '../../design';
import type { Grade } from '../../db/types';
import { gradeCountWords, targetPlan } from '../../lib/gradeCalc';
import { formatAverage, weightedAverage, type GradeScale } from '../../lib/grades';
import styles from './Grades.module.css';

const WEIGHTS = [
  { value: '1', label: '×1' },
  { value: '2', label: '×2' },
  { value: '3', label: '×3' },
] as const;

/** "What do I need for an average of X?": the fewest grades, best value first. */
export function TargetCalc({ grades, scale }: { grades: readonly Grade[]; scale: GradeScale }) {
  const average = weightedAverage(grades);
  const [target, setTarget] = useState(() => String(Math.min(scale, average === null ? scale : Math.floor(average) + 1)));
  const [weight, setWeight] = useState<'1' | '2' | '3'>('1');

  const value = Number(target.replace(',', '.'));
  const valid = Number.isFinite(value) && value >= 1 && value <= scale;
  const plan = valid ? targetPlan(grades, value, scale, Number(weight)) : [];
  const reached = valid && average !== null && average >= value - 1e-9;

  let answer: string;
  if (!valid) answer = `Введите число от 1 до ${scale}`;
  else if (reached) answer = `Уже получилось: средний ${formatAverage(average)}`;
  else if (plan.length === 0) answer = 'Выше максимума шкалы: так не получится';
  else answer = plan.map((p) => gradeCountWords(p.count, p.value)).join(' или ');

  return (
    <div className={styles.calc}>
      <span className="label">Калькулятор: какие оценки нужны</span>
      <div className={styles.calcInputs}>
        <Field
          label="Хочу средний"
          inputMode="decimal"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className={styles.calcTarget}
        />
        <div className={styles.group}>
          <span className="label">Вес новых</span>
          <Segmented label="Вес новых оценок" options={WEIGHTS} value={weight} onChange={setWeight} />
        </div>
      </div>
      <p className={reached || plan.length > 0 ? styles.calcAnswer : styles.calcMuted} role="status">
        {!reached && plan.length > 0 && <span className={styles.calcLead}>Нужно: </span>}
        {answer}
      </p>
    </div>
  );
}
