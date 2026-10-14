import { useToday } from '../../app/hooks';
import { useUi } from '../../app/uiStore';
import { Button, EmptyState } from '../../design';
import { defaultSchoolDay, schoolWeek, SCHOOL_DAYS, toIsoDate } from '../../lib/date';
import { NOT_READY, type SectionProps } from '../types';
import styles from './ScheduleSection.module.css';

const DAY_NAMES = ['понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу'] as const;

export function ScheduleSection(_: SectionProps) {
  const today = useToday();
  const storedDay = useUi((s) => s.scheduleDay);
  const setDay = useUi((s) => s.setScheduleDay);
  const selected = storedDay ?? defaultSchoolDay(today);
  const week = schoolWeek(today);
  const todayIso = toIsoDate(today);

  return (
    <div className={styles.section}>
      <div className={styles.strip} role="group" aria-label="День недели">
        {week.map((date, i) => {
          const isSelected = i === selected;
          return (
            <button
              key={toIsoDate(date)}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${SCHOOL_DAYS[i]} ${date.getDate()}`}
              className={isSelected ? `${styles.day} ${styles.selected}` : styles.day}
              onClick={() => setDay(i)}
            >
              <span className={styles.dayName}>{SCHOOL_DAYS[i]}</span>
              <span className={styles.dayNum}>{date.getDate()}</span>
              {toIsoDate(date) === todayIso && <span className={styles.todayMark} aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      <EmptyState
        title={`На ${DAY_NAMES[selected]} уроков нет`}
        action={
          <Button variant="secondary" disabled title={NOT_READY}>
            Добавить урок +
          </Button>
        }
      >
        Заполните неделю один раз: текущий урок и время до перемены будут видны здесь.
      </EmptyState>
    </div>
  );
}
