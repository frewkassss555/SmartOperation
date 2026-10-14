import { Button, EmptyState, Stat } from '../../design';
import { NOT_READY, type SectionProps } from '../types';
import styles from './GradesSection.module.css';

export function GradesSection(_: SectionProps) {
  return (
    <div className={styles.section}>
      <div className={styles.summary}>
        <Stat className={styles.average} label="Средний балл" value="—" size="average" tone="accent" />
        <div className={styles.cells}>
          <Stat className={styles.cell} label="Оценок" value="0" />
          <Stat className={styles.cell} label="Лучший предмет" value="—" />
        </div>
      </div>

      <EmptyState
        title="Предметов пока нет"
        action={
          <Button variant="primary" disabled title={NOT_READY}>
            Добавить предмет +
          </Button>
        }
      >
        Добавьте предмет, и здесь появятся оценки, средний балл и шкала прогресса.
      </EmptyState>
    </div>
  );
}
