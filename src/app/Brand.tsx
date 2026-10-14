import styles from './Brand.module.css';

export function Brand() {
  return (
    <span className={styles.brand}>
      <span className={styles.square} aria-hidden="true" />
      Трекер
    </span>
  );
}
