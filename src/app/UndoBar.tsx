import { usePwa } from '../pwa/pwa';
import { useUndo } from './undo';
import styles from './UndoBar.module.css';

/**
 * Square bars at the bottom: "update available" (until applied) and the last action
 * with an undo button (for 5 seconds).
 */
export function UndoBar() {
  const notice = useUndo((s) => s.notice);
  const dismiss = useUndo((s) => s.dismiss);
  const needRefresh = usePwa((s) => s.needRefresh);
  const update = usePwa((s) => s.update);

  return (
    <div className={styles.region} role="status" aria-live="polite">
      {needRefresh && (
        <div className={`${styles.bar} appear`}>
          <span className={styles.message}>Доступно обновление</span>
          <button type="button" className={styles.undo} onClick={update}>
            Обновить
          </button>
        </div>
      )}
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
