import type { ReactNode } from 'react';
import styles from './Chip.module.css';

type ChipProps = {
  children: ReactNode;
  /** Filled with the accent, e.g. a pinned note's tag. */
  filled?: boolean;
  /** When given, the chip is a toggle button (filters). */
  onClick?: () => void;
  pressed?: boolean;
};

export function Chip({ children, filled = false, onClick, pressed }: ChipProps) {
  const classes = [styles.chip, filled && styles.filled, pressed && styles.pressed]
    .filter(Boolean)
    .join(' ');

  if (onClick) {
    return (
      <button type="button" className={`${classes} ${styles.toggle}`} aria-pressed={pressed ?? false} onClick={onClick}>
        {children}
      </button>
    );
  }
  return <span className={classes}>{children}</span>;
}
