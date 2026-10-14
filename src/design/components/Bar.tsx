import styles from './Bar.module.css';

type BarProps = {
  /** Filled blocks; rounded and clamped to 0..blocks. */
  value: number;
  blocks?: number;
  tone?: 'text' | 'accent' | 'negative';
  /** Accessible description, e.g. "Средний балл 8 из 10". */
  label: string;
};

/** A row of square blocks: the block-scale used for averages and limits. */
export function Bar({ value, blocks = 10, tone = 'text', label }: BarProps) {
  const filled = Math.min(blocks, Math.max(0, Math.round(value)));
  return (
    <div className={styles.bar} role="img" aria-label={label}>
      {Array.from({ length: blocks }, (_, i) => (
        <span key={i} className={i < filled ? `${styles.block} ${styles[tone]}` : styles.block} />
      ))}
    </div>
  );
}
