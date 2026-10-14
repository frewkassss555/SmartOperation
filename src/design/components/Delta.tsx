import { formatPercent, trendOf } from '../../lib/market';
import styles from './Delta.module.css';

type DeltaProps = {
  /** Change in percent. */
  value: number | null | undefined;
  /** Text after the number, e.g. "24Ч" or "за 7Д". */
  suffix?: string | undefined;
  size?: 'sm' | 'md';
};

/**
 * Rise and fall are told apart by sign, marker and colour together:
 * filled square for a rise, empty framed square for a fall, a dash when flat.
 */
export function Delta({ value, suffix, size = 'sm' }: DeltaProps) {
  const trend = trendOf(value);
  return (
    <span className={`${styles.delta} ${styles[trend]} ${styles[size]}`}>
      <span className={styles.marker} aria-hidden="true" />
      <span>{formatPercent(value)}</span>
      {suffix && <span className={styles.suffix}>{suffix}</span>}
      <span className="visually-hidden">{trend === 'up' ? 'рост' : trend === 'down' ? 'падение' : 'без изменений'}</span>
    </span>
  );
}
