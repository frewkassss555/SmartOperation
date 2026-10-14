import { useLiveQuery } from 'dexie-react-hooks';
import { useToday } from '../../app/hooks';
import { Delta, Stat } from '../../design';
import { db } from '../../db/db';
import { useSettings } from '../../db/settings';
import { addDays, formatDayMonth, mondayIndex, toIsoDate } from '../../lib/date';
import { formatAverage } from '../../lib/grades';
import { formatMoney } from '../../lib/money';
import { formatDiff, isSummaryDay, weeklySummary } from '../../lib/weekly';
import styles from './Overview.module.css';

/** Sunday block: the week's average and its change, expenses, closed deadlines, focus minutes. */
export function WeeklySummaryBlock() {
  const today = useToday();
  const { currency } = useSettings();
  const data = useLiveQuery(async () => {
    const [grades, txns, tasks, focus] = await Promise.all([db.grades.toArray(), db.txns.toArray(), db.tasks.toArray(), db.focus.toArray()]);
    return { grades, txns, tasks, focus };
  }, []);

  if (!isSummaryDay(today) || !data) return null;
  const s = weeklySummary(data, today);
  const monday = addDays(today, -mondayIndex(today));

  return (
    <section className={styles.summary} aria-labelledby="weekly-title">
      <div className={styles.summaryHead}>
        <h2 className={styles.heading} id="weekly-title">
          Итог недели
        </h2>
        <span className="label">
          {formatDayMonth(toIsoDate(monday))} — {formatDayMonth(toIsoDate(today))}
        </span>
      </div>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCell}>
          <Stat
            label="Средний за неделю"
            value={formatAverage(s.average)}
            tone="accent"
            hint={s.averageDiff === null ? 'нет сравнения с прошлой' : <Delta value={s.averageDiff} text={formatDiff(s.averageDiff)} suffix="к прошлой" />}
          />
        </div>
        <div className={styles.summaryCell}>
          <Stat label="Расходы" value={formatMoney(s.expenses, currency)} size="sm" />
        </div>
        <div className={styles.summaryCell}>
          <Stat label="Дедлайнов закрыто" value={s.tasksDone} />
        </div>
        <div className={styles.summaryCell}>
          <Stat label="Фокус" value={`${s.focusMinutes} мин`} />
        </div>
      </div>
    </section>
  );
}
