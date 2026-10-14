import { routeHref } from '../../app/routes';
import { useNow } from '../../app/hooks';
import { formatTimer } from '../../lib/focus';
import styles from './Focus.module.css';
import { timeLeft, useTimer } from './timer';

/** Small "ФОКУС 12:34" link in the header while the timer runs. */
export function FocusIndicator() {
  const timer = useTimer();
  if (timer.phase === 'idle') return null;
  return <Running />;
}

function Running() {
  useNow(1000);
  const timer = useTimer();
  const paused = timer.endsAt === null;
  return (
    <a href={routeHref('schedule')} className={styles.indicator} data-phase={timer.phase} aria-label="Открыть фокус-таймер">
      {timer.phase === 'focus' ? 'Фокус' : 'Перерыв'} {paused ? 'II' : formatTimer(timeLeft(timer))}
    </a>
  );
}
