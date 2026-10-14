import styles from './Credits.module.css';

/** Small author line at the bottom of every screen. */
export function Credits({ className }: { className?: string | undefined }) {
  return (
    <p className={[styles.credits, className].filter(Boolean).join(' ')}>
      <span>Создатель: Феликс Боярский</span>
      <span>
        GitHub:{' '}
        <a href="https://github.com/frewkassss555" target="_blank" rel="noopener noreferrer">
          frewkassss555
        </a>
      </span>
      <span>
        TikTok:{' '}
        <a href="https://www.tiktok.com/@frewkassss.dev" target="_blank" rel="noopener noreferrer">
          frewkassss.dev
        </a>
      </span>
    </p>
  );
}
