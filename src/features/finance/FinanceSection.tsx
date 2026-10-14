import { useUi, type FinanceRange } from '../../app/uiStore';
import { useToday } from '../../app/hooks';
import { Button, EmptyState, Segmented, Stat } from '../../design';
import { daysInMonth, mondayIndex, WEEK_DAYS } from '../../lib/date';
import { NOT_READY, type SectionProps } from '../types';
import styles from './FinanceSection.module.css';

const RANGES = [
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
] as const satisfies readonly { value: FinanceRange; label: string }[];

/** Max bar height in px; real values scale into it once transactions exist. */
const BAR_MAX = 80;

type Column = { key: string; label: string; value: number; today: boolean; showLabel: boolean };

function columns(range: FinanceRange, today: Date): Column[] {
  if (range === 'week') {
    const todayIndex = mondayIndex(today);
    return WEEK_DAYS.map((label, i) => ({ key: label, label, value: 0, today: i === todayIndex, showLabel: true }));
  }
  return Array.from({ length: daysInMonth(today) }, (_, i) => {
    const day = i + 1;
    return {
      key: String(day),
      label: String(day),
      value: 0,
      today: day === today.getDate(),
      showLabel: day === 1 || day % 5 === 0,
    };
  });
}

export function FinanceSection(_: SectionProps) {
  const range = useUi((s) => s.financeRange);
  const setRange = useUi((s) => s.setFinanceRange);
  const today = useToday();
  const cols = columns(range, today);
  const max = Math.max(1, ...cols.map((c) => c.value));

  return (
    <div className={styles.section}>
      <div className={styles.summary}>
        <Stat className={styles.balance} label="Баланс" value="0,00" size="lg" tone="accent" />
        <div className={styles.flows}>
          <Stat className={styles.flow} label="Доход" value="+0,00" tone="accent" />
          <Stat className={styles.flow} label="Расход" value="−0,00" />
        </div>
      </div>

      <div className={styles.chartHead}>
        <span className="label">Расходы по дням</span>
        <Segmented label="Период расходов" options={RANGES} value={range} onChange={setRange} />
      </div>

      <div
        className={styles.chart}
        data-range={range}
        role="img"
        aria-label={range === 'week' ? 'Расходы за неделю: нет данных' : 'Расходы за месяц: нет данных'}
      >
        <div className={styles.bars}>
          {cols.map((col) => (
            <div key={col.key} className={styles.col}>
              {range === 'week' && <span className={styles.amount}>{col.value}</span>}
              <span
                className={col.today ? `${styles.bar} ${styles.today}` : styles.bar}
                style={{ height: `${Math.round((col.value / max) * BAR_MAX)}px` }}
              />
            </div>
          ))}
        </div>
        <div className={styles.axis}>
          {cols.map((col) => (
            <span key={col.key} className={col.today ? `${styles.day} ${styles.dayToday}` : styles.day}>
              {col.showLabel ? col.label : ''}
            </span>
          ))}
        </div>
      </div>

      <EmptyState
        title="Операций пока нет"
        action={
          <Button variant="primary" disabled title={NOT_READY}>
            Добавить операцию +
          </Button>
        }
      >
        Запишите доход или расход, и баланс со столбиками пересчитаются сами.
      </EmptyState>
    </div>
  );
}
