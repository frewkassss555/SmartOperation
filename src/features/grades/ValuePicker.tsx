import type { GradeScale } from '../../lib/grades';
import styles from './Grades.module.css';

type ValuePickerProps = {
  scale: GradeScale;
  value?: number | null;
  onPick: (value: number) => void;
  label: string;
};

/** A row of square buttons 1..scale. */
export function ValuePicker({ scale, value = null, onPick, label }: ValuePickerProps) {
  return (
    <div className={styles.picker} role="group" aria-label={label}>
      {Array.from({ length: scale }, (_, i) => i + 1).map((v) => (
        <button
          key={v}
          type="button"
          className={v === value ? `${styles.pick} ${styles.pickOn}` : styles.pick}
          aria-pressed={value === null ? undefined : v === value}
          onClick={() => onPick(v)}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
