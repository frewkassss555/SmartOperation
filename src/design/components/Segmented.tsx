import styles from './Segmented.module.css';

type Option<T extends string> = { value: T; label: string };

type SegmentedProps<T extends string> = {
  /** Accessible name of the group, e.g. "Период". */
  label: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  block?: boolean;
};

export function Segmented<T extends string>({ label, options, value, onChange, block = false }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className={[styles.group, block && styles.block].filter(Boolean).join(' ')}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            className={[styles.item, selected && styles.selected].filter(Boolean).join(' ')}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
