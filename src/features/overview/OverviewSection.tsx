import { routeHref } from '../../app/routes';
import { Delta, Stat } from '../../design';
import { formatUsd } from '../../lib/market';
import { formatDayMonth } from '../../lib/date';
import { formatDuration } from '../../lib/schedule';
import { deadlineLabel } from '../../lib/tasks';
import { coinLabel, useSelectedCoin } from '../market/coins';
import type { SectionProps } from '../types';
import styles from './Overview.module.css';
import { useOverview } from './useOverview';
import { WeeklySummaryBlock } from './WeeklySummaryBlock';

/** Phone overview: the four key numbers and today's lessons. */
export function OverviewSection(_: SectionProps) {
  const o = useOverview();
  const coin = useSelectedCoin();

  return (
    <div className={styles.section}>
      <WeeklySummaryBlock />

      <div className={styles.stats}>
        <a href={routeHref('grades')} className={styles.cell}>
          <Stat label="Средний балл" value={o.average} tone="accent" />
        </a>
        <a href={routeHref('finance')} className={styles.cell}>
          <Stat label="Баланс" value={o.balance} size="sm" />
        </a>
        <a href={routeHref('schedule')} className={styles.cell}>
          <Stat label="Уроков сегодня" value={o.lessonsToday} />
        </a>
        <a href={routeHref('market')} className={styles.cell}>
          <Stat label={`${coinLabel(coin.watch)} / USD`} value={formatUsd(coin.quote?.price)} size="sm" hint={<Delta value={coin.quote?.change24h} suffix="24Ч" />} />
        </a>
      </div>

      <section aria-labelledby="overview-deadlines">
        <h2 className={styles.heading} id="overview-deadlines">
          Дедлайны
        </h2>
        {o.deadlines.length === 0 ? (
          <p className={styles.muted}>Ближайших дедлайнов нет.</p>
        ) : (
          <ul className={styles.lessons}>
            {o.deadlines.map((t) => (
              <li key={t.id} className={t.days < 0 ? `${styles.lesson} ${styles.overdue}` : styles.lesson}>
                <span className={styles.time}>{formatDayMonth(t.due)}</span>
                <a href={routeHref('schedule')} className={styles.taskTitle}>
                  {t.title}
                </a>
                <span className={styles.countdown}>{deadlineLabel(t.days)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="overview-today">
        <h2 className={styles.heading} id="overview-today">
          Сегодня
        </h2>
        {o.today.length === 0 ? (
          <p className={styles.muted}>Уроков нет.</p>
        ) : (
          <ol className={styles.lessons}>
            {o.today.map((l, i) => {
              const current = o.status?.index === i;
              return (
                <li key={l.id} className={current ? `${styles.lesson} ${styles.current}` : styles.lesson}>
                  <span className={styles.time}>{l.start}</span>
                  <span className={styles.subject}>{o.subjectName(l.subjectId)}</span>
                  {current && o.status && (
                    <span className={styles.countdown}>
                      {o.status.kind === 'lesson' ? 'идёт' : 'через'} · {formatDuration(o.status.minutesLeft)}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
