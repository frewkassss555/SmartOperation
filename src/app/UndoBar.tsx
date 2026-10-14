import { useUndo } from './undo';
import styles from './UndoBar.module.css';

/** Square bar at the bottom: last action and an undo button for 5 seconds. */
export function UndoBar() {
  const notice = useUndo((s) => s.notice);
  const dismiss = useUndo((s) => s.dismiss);

  return (
    <div className={styles.region} role="status" aria-live="polite">
      {notice && (
        <div key={notice.id} className={`${styles.bar} appear`}>
          <span className={styles.message}>{notice.message}</span>
          {notice.undo && (
            <button
              type="button"
              className={styles.undo}
              onClick={async () => {
                const undo = notice.undo;
                dismiss();
                await undo?.();
              }}
            >
              Отменить
            </button>
          )}
        </div>
      )}
    </div>
  );
}
