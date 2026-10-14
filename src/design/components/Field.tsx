import { useId, type InputHTMLAttributes } from 'react';
import styles from './Field.module.css';

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  /** Hide the visible label but keep it for screen readers (e.g. a search box). */
  hideLabel?: boolean;
};

export function Field({ label, hint, hideLabel = false, className, id, ...rest }: FieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label htmlFor={inputId} className={hideLabel ? 'visually-hidden' : 'label'}>
        {label}
      </label>
      <input id={inputId} className={styles.input} aria-describedby={hint ? hintId : undefined} {...rest} />
      {hint && (
        <span id={hintId} className={styles.hint}>
          {hint}
        </span>
      )}
    </div>
  );
}
