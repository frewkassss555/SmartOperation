import { routeHref } from '../../app/routes';
import { useUi } from '../../app/uiStore';
import { Stat } from '../../design';
import { formatDuration } from '../../lib/schedule';
import { coinById } from '../market/coins';
import type { SectionProps } from '../types';
import styles from './Overview.module.css';
import { useOverview } from './useOverview';

/** Phone overview: the four key numbers and today's lessons. */
export function OverviewSection(_: SectionProps) {
  const o = useOverview();
  const coin = coinById(useUi((s) => s.coin));

  return (
    <div className={styles.section}>
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
          <Stat label={`${coin.symbol} / USD`} value="—" />
        </a>
      </div>

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
