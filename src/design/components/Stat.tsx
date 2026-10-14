import type { ReactNode } from 'react';
import styles from './Stat.module.css';

type StatProps = {
  label: string;
  value: ReactNode;
  /** sm 20px, md 32px, lg 48px mono; average is the 96px Oswald figure used for grade averages. */
  size?: 'sm' | 'md' | 'lg' | 'average';
  tone?: 'text' | 'accent' | 'negative';
  hint?: ReactNode;
  className?: string | undefined;
};

export function Stat({ label, value, size = 'md', tone = 'text', hint, className }: StatProps) {
  return (
    <div className={[styles.stat, className].filter(Boolean).join(' ')}>
      <span className="label">{label}</span>
      <span className={[styles.value, styles[size], styles[tone]].join(' ')}>{value}</span>
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  );
}
