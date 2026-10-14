import type { ReactNode } from 'react';
import styles from './Columns.module.css';

type ColumnsProps = {
  /** Two columns when there is room (full-screen section on the desktop); otherwise one stack. */
  wide?: boolean | undefined;
  main: ReactNode;
  side: ReactNode;
  /** Relative width of the main column. */
  balance?: 'even' | 'main';
};

export function Columns({ wide = false, main, side, balance = 'even' }: ColumnsProps) {
  if (!wide) {
    return (
      <div className={styles.stack}>
        {main}
        {side}
      </div>
    );
  }
  return (
    <div className={styles.container}>
      <div className={`${styles.grid} ${balance === 'main' ? styles.mainHeavy : ''}`}>
        <div className={styles.stack}>{main}</div>
        <div className={styles.stack}>{side}</div>
      </div>
    </div>
  );
}
