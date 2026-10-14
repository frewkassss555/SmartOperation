import { useState } from 'react';
import { useToday } from '../../app/hooks';
import { useUi, type FinanceRange, type ListPeriod } from '../../app/uiStore';
import { Button, Chip, Columns, EmptyState, Segmented, Stat } from '../../design';
import { useSettings } from '../../db/settings';
import type { Txn } from '../../db/types';
import { formatDayMonth, toIsoDate, WEEK_DAYS } from '../../lib/date';
import { balance, expensesByDay, formatMoney, formatMoneyShort, totals } from '../../lib/money';
import type { SectionProps } from '../types';
import { rangeDates, useTxns } from './data';
import styles from './Finance.module.css';
import { BudgetBlock } from './BudgetBlock';
import { TxnDialog } from './TxnDialog';

const RANGES = [
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
] as const satisfies readonly { value: FinanceRange; label: string }[];

const LIST_PERIODS = [
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'all', label: 'Всё' },
] as const satisfies readonly { value: ListPeriod; label: string }[];

/** Max bar height in px. */
const BAR_MAX = 80;

/** Rows shown in the desktop panel before "show all", so the panel row stays compact. */
const PANEL_ROWS = 8;

export function FinanceSection({ compact, wide }: SectionProps) {
  const today = useToday();
  const todayIso = toIsoDate(today);
  const txns = useTxns();
  const settings = useSettings();
  const range = useUi((s) => s.financeRange);
  const setRange = useUi((s) => s.setFinanceRange);
  const listPeriod = useUi((s) => s.financeListPeriod);
  const setListPeriod = useUi((s) => s.setFinanceListPeriod);
  const [category, setCategory] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ txn?: Txn | undefined } | null>(null);
  const [showAll, setShowAll] = useState(false);

  const all = txns ?? [];
  const dates = rangeDates(range, today);
  const inRange = all.filter((t) => t.date >= dates[0]! && t.date <= dates.at(-1)!);
  const { income, expense } = totals(inRange);
  const bars = expensesByDay(all, dates);
  const max = Math.max(1, ...bars);

  const listDates = listPeriod === 'all' ? null : rangeDates(listPeriod, today);
  const list = all.filter(
    (t) =>
      (category === null || t.category === category) &&
      (listDates === null || (t.date >= listDates[0]! && t.date <= listDates.at(-1)!)),
  );
  // The overview panel shows a short list; the phone and the full-screen section show all.
  const capped = !compact && !wide;
  const limited = capped && !showAll && list.length > PANEL_ROWS;
  const shown = limited ? list.slice(0, PANEL_ROWS) : list;
  const usedCategories = settings.categories.filter((c) => all.some((t) => t.category === c));
  const money = (minor: number) => formatMoney(minor, settings.currency);
  const rangeWord = range === 'week' ? 'за неделю' : 'за месяц';

  const head = (
    <>
      <div className={styles.summary}>
        <Stat className={styles.balance} label="Баланс" value={money(balance(settings.startBalance, all))} size="lg" tone="accent" />
        <div className={styles.flows}>
          <Stat className={styles.flow} label={`Доход ${rangeWord}`} value={`+${money(income)}`} tone="accent" />
          <Stat className={styles.flow} label={`Расход ${rangeWord}`} value={`−${money(expense)}`} />
        </div>
      </div>

      <div className={styles.chartHead}>
        <span className="label">Расходы по дням</span>
        <Segmented label="Период графика расходов" options={RANGES} value={range} onChange={setRange} />
      </div>

      <div
        className={styles.chart}
        data-range={range}
        role="img"
        aria-label={`Расходы ${rangeWord}: ${bars.map((v, i) => `${range === 'week' ? WEEK_DAYS[i] : i + 1} ${formatMoneyShort(v)}`).join(', ')}`}
      >
        <div className={styles.bars}>
          {dates.map((d, i) => (
            <div key={d} className={styles.col}>
              {range === 'week' && <span className={styles.amount}>{bars[i] ? formatMoneyShort(bars[i]!) : ''}</span>}
              <span
                className={d === todayIso ? `${styles.bar} ${styles.today}` : styles.bar}
                style={{ height: `${Math.round(((bars[i] ?? 0) / max) * BAR_MAX)}px` }}
              />
            </div>
          ))}
        </div>
        <div className={styles.axis}>
          {dates.map((d, i) => {
            const day = i + 1;
            const label = range === 'week' ? WEEK_DAYS[i] : day === 1 || day % 5 === 0 ? String(day) : '';
            return (
              <span key={d} className={d === todayIso ? `${styles.day} ${styles.dayToday}` : styles.day}>
                {label}
              </span>
            );
          })}
        </div>
      </div>

      {/* The overview panel stays short; limits and the goal live in the full section. */}
      {(compact || wide) && <BudgetBlock txns={all} />}
    </>
  );

  const body =
    txns !== undefined && all.length === 0 ? (
        <EmptyState
          title="Операций пока нет"
          action={
            <Button variant="primary" onClick={() => setEditor({})}>
              Добавить операцию +
            </Button>
          }
        >
          Запишите доход или расход, и баланс со столбиками пересчитаются сами.
        </EmptyState>
      ) : (
        <>
          <Button variant="primary" block={compact} onClick={() => setEditor({})}>
            Добавить операцию +
          </Button>

          <div className={styles.filters}>
            <Segmented label="Период списка" options={LIST_PERIODS} value={listPeriod} onChange={setListPeriod} />
            {usedCategories.length > 0 && (
              <div className={styles.chips} role="group" aria-label="Категория">
                <Chip pressed={category === null} onClick={() => setCategory(null)}>
                  Все
                </Chip>
                {usedCategories.map((c) => (
                  <Chip key={c} pressed={category === c} onClick={() => setCategory(category === c ? null : c)}>
                    {c}
                  </Chip>
                ))}
              </div>
            )}
          </div>

          {list.length === 0 ? (
            <p className={styles.muted}>Нет операций для этого фильтра.</p>
          ) : (
            <ul className={`${styles.list} appear`} aria-label="Операции">
              {shown.map((t) => (
                <li key={t.id}>
                  <button type="button" className={styles.row} onClick={() => setEditor({ txn: t })}>
                    <span className={styles.rowDate}>{formatDayMonth(t.date)}</span>
                    <span className={styles.rowMain}>
                      <span className={styles.rowTitle}>{t.note || t.category}</span>
                      <span className={styles.rowMeta}>
                        <Chip>{t.category}</Chip>
                        {t.repeat && <Chip>{t.repeat === 'week' ? 'Каждую неделю' : 'Каждый месяц'}</Chip>}
                      </span>
                    </span>
                    <span className={t.kind === 'in' ? `${styles.rowAmount} ${styles.income}` : styles.rowAmount}>
                      {t.kind === 'in' ? '+' : '−'}
                      {money(t.amount)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {capped && list.length > PANEL_ROWS && (
            <Button variant="ghost" onClick={() => setShowAll(!showAll)}>
              {showAll ? 'Свернуть' : `Показать все · ${list.length}`}
            </Button>
          )}
        </>
      );

  return (
    <div className={styles.section}>
      <Columns wide={wide} main={head} side={body} />

      <TxnDialog
        open={editor !== null}
        onClose={() => setEditor(null)}
        txn={editor?.txn}
        categories={settings.categories}
        currency={settings.currency}
      />
    </div>
  );
}
