import { useId, type ReactNode } from 'react';
import styles from './Panel.module.css';

type PanelProps = {
  title?: string;
  /** Section index such as "01", shown as a mono label before the title. */
  index?: string;
  /** Content aligned to the right of the title row. */
  aside?: ReactNode;
  /** Draw the 1px frame; frames of neighbouring panels overlap like table cells. */
  framed?: boolean;
  className?: string | undefined;
  id?: string;
  /** Allow programmatic focus, e.g. after jumping to the panel from navigation. */
  focusable?: boolean;
  children?: ReactNode;
};

export function Panel({ title, index, aside, framed = true, className, id, focusable = false, children }: PanelProps) {
  const headingId = useId();
  const classes = [styles.panel, framed && styles.framed, className].filter(Boolean).join(' ');

  return (
    <section
      className={classes}
      id={id}
      tabIndex={focusable ? -1 : undefined}
      aria-labelledby={title ? headingId : undefined}
    >
      {(title || aside) && (
        <header className={styles.head}>
          {title && (
            <h2 className={styles.title} id={headingId}>
              {index && <span className={styles.index}>{index}</span>}
              {title}
            </h2>
          )}
          {aside && <div className={styles.aside}>{aside}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
