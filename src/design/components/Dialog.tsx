import { useEffect, useId, useRef, type FormEvent, type ReactNode } from 'react';
import styles from './Dialog.module.css';

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Mono label above the title, e.g. "ОЦЕНКА". */
  kicker?: string | undefined;
  children: ReactNode;
  /** Buttons row at the bottom. */
  actions?: ReactNode;
  /** When set, the body is a form and Enter submits it. */
  onSubmit?: (() => void) | undefined;
};

/**
 * Native <dialog>: focus trap, Esc to close and inert background come from the browser.
 * Bottom sheet on the phone, centered box on the desktop.
 */
export function Dialog({ open, onClose, title, kicker, children, actions, onSubmit }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit?.();
  };

  const body = (
    <>
      <header className={styles.head}>
        <div>
          {kicker && <span className="label">{kicker}</span>}
          <h2 className={styles.title} id={titleId}>
            {title}
          </h2>
        </div>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Закрыть">
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <path d="M2 2 L14 14 M14 2 L2 14" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        </button>
      </header>
      <div className={styles.body}>{children}</div>
      {actions && <footer className={styles.actions}>{actions}</footer>}
    </>
  );

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // A click on the backdrop lands on the <dialog> element itself.
        if (e.target === ref.current) onClose();
      }}
    >
      {open &&
        (onSubmit ? (
          <form className={styles.frame} onSubmit={submit} noValidate>
            {body}
          </form>
        ) : (
          <div className={styles.frame}>{body}</div>
        ))}
    </dialog>
  );
}
