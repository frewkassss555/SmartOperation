import { useEffect, useState } from 'react';
import { Button, Dialog, Field } from '../../design';
import { db } from '../../db/db';
import type { Quote, Watch } from '../../db/types';
import { parseUsd } from '../../lib/alerts';
import { formatUsd } from '../../lib/market';
import { notificationPermission, PUSH_NOTE, requestNotifications } from '../../pwa/notifications';
import { evaluateAlerts } from './alerts';
import { coinLabel } from './coins';
import styles from './MarketSection.module.css';

type Props = { watch: Watch | null; quote: Quote | undefined; onClose: () => void };

const usdInput = (v: number | undefined) => (v === undefined ? '' : String(v).replace('.', ','));

/** Per-coin settings: price alerts. */
export function CoinDialog({ watch, quote, onClose }: Props) {
  const [above, setAbove] = useState('');
  const [below, setBelow] = useState('');
  const [errors, setErrors] = useState<{ above?: string; below?: string }>({});
  const [permission, setPermission] = useState(notificationPermission());

  useEffect(() => {
    if (!watch) return;
    setAbove(usdInput(watch.alertAbove));
    setBelow(usdInput(watch.alertBelow));
    setErrors({});
    setPermission(notificationPermission());
    // Reset when a coin opens.
  }, [watch?.coinId]);

  const submit = async () => {
    if (!watch) return;
    const a = above.trim() ? parseUsd(above) : undefined;
    const b = below.trim() ? parseUsd(below) : undefined;
    const next = {
      ...(a === null ? { above: 'Например, 90 000' } : {}),
      ...(b === null ? { below: 'Например, 75 000' } : {}),
    };
    if (a !== null && b !== null && a !== undefined && b !== undefined && b >= a) next.below = 'Нижний порог должен быть меньше верхнего';
    setErrors(next);
    if (Object.keys(next).length > 0 || a === null || b === null) return;
    // A changed threshold re-arms its alert.
    await db.watch.update(watch.coinId, {
      alertAbove: a,
      alertBelow: b,
      firedAbove: a === watch.alertAbove ? watch.firedAbove : false,
      firedBelow: b === watch.alertBelow ? watch.firedBelow : false,
    });
    onClose();
    await evaluateAlerts();
  };

  return (
    <Dialog
      open={watch !== null}
      onClose={onClose}
      kicker={watch ? `${coinLabel(watch)} · сейчас ${formatUsd(quote?.price)}` : ''}
      title="Алерты по цене"
      onSubmit={submit}
      actions={
        <Button variant="primary" type="submit">
          Сохранить
        </Button>
      }
    >
      <div className={styles.alertFields}>
        <Field
          label="Цена выше, $"
          inputMode="decimal"
          placeholder="Не следить"
          value={above}
          onChange={(e) => setAbove(e.target.value)}
          error={errors.above}
        />
        <Field
          label="Цена ниже, $"
          inputMode="decimal"
          placeholder="Не следить"
          value={below}
          onChange={(e) => setBelow(e.target.value)}
          error={errors.below}
        />
      </div>
      <p className={styles.note}>Пустое поле — без алерта. Алерт срабатывает один раз и снова включается, когда цена вернётся.</p>

      <div className={styles.permission}>
        {permission === 'granted' ? (
          <span className="label">Системные уведомления включены</span>
        ) : permission === 'denied' ? (
          <span className="label">Уведомления запрещены в настройках браузера — алерт будет только в приложении</span>
        ) : permission === 'unsupported' ? (
          <span className="label">Браузер не поддерживает уведомления — алерт будет только в приложении</span>
        ) : (
          <Button variant="secondary" onClick={async () => setPermission(await requestNotifications())}>
            Разрешить уведомления
          </Button>
        )}
      </div>
      <p className={styles.note}>{PUSH_NOTE}</p>
    </Dialog>
  );
}
