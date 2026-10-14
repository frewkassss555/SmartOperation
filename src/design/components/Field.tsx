import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import styles from './Field.module.css';

type FrameProps = {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  /** Hide the visible label but keep it for screen readers (e.g. a search box). */
  hideLabel?: boolean | undefined;
  className?: string | undefined;
};

function useFieldIds(id: string | undefined) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return { inputId, noteId: `${inputId}-note` };
}

function Frame({
  label,
  hint,
  error,
  hideLabel = false,
  className,
  inputId,
  noteId,
  children,
}: FrameProps & { inputId: string; noteId: string; children: ReactNode }) {
  const note = error ?? hint;
  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label htmlFor={inputId} className={hideLabel ? 'visually-hidden' : 'label'}>
        {label}
      </label>
      {children}
      {note && (
        <span id={noteId} className={error ? styles.error : styles.hint}>
          {note}
        </span>
      )}
    </div>
  );
}

type FieldProps = FrameProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'className'>;

export function Field({ label, hint, error, hideLabel, className, id, ...rest }: FieldProps) {
  const { inputId, noteId } = useFieldIds(id);
  return (
    <Frame {...{ label, hint, error, hideLabel, className, inputId, noteId }}>
      <input
        id={inputId}
        className={styles.input}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? noteId : undefined}
        {...rest}
      />
    </Frame>
  );
}

type SelectFieldProps = FrameProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> & {
    options: readonly { value: string; label: string }[];
  };

export function SelectField({ label, hint, error, hideLabel, className, id, options, ...rest }: SelectFieldProps) {
  const { inputId, noteId } = useFieldIds(id);
  return (
    <Frame {...{ label, hint, error, hideLabel, className, inputId, noteId }}>
      <span className={styles.selectWrap}>
        <select
          id={inputId}
          className={`${styles.input} ${styles.select}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={hint || error ? noteId : undefined}
          {...rest}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg className={styles.chevron} viewBox="0 0 12 8" width="12" height="8" aria-hidden="true">
          <path d="M1 1 L6 6 L11 1" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      </span>
    </Frame>
  );
}

type TextAreaFieldProps = FrameProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>;

export function TextAreaField({ label, hint, error, hideLabel, className, id, ...rest }: TextAreaFieldProps) {
  const { inputId, noteId } = useFieldIds(id);
  return (
    <Frame {...{ label, hint, error, hideLabel, className, inputId, noteId }}>
      <textarea
        id={inputId}
        className={`${styles.input} ${styles.textarea}`}
        aria-describedby={hint || error ? noteId : undefined}
        {...rest}
      />
    </Frame>
  );
}
