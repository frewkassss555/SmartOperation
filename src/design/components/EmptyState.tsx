import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

type EmptyStateProps = {
  title: string;
  children?: ReactNode;
  /** The clear next step, usually a Button. */
  action?: ReactNode;
};

export function EmptyState({ title, children, action }: EmptyStateProps) {
  return (
    <div className={`${styles.empty} appear`}>
      <p className={styles.title}>
        <span className={styles.marker} aria-hidden="true" />
        {title}
      </p>
      {children && <p className={styles.text}>{children}</p>}
      {action}
    </div>
  );
}
