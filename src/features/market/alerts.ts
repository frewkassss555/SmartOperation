import { notify } from '../../app/undo';
import { db } from '../../db/db';
import { checkAlerts } from '../../lib/alerts';
import { formatUsd } from '../../lib/market';
import { systemNotify } from '../../pwa/notifications';
import { coinLabel } from './coins';

/** Compares the last saved prices with the alerts; notifies once per crossing. */
export async function evaluateAlerts(): Promise<void> {
  const fired: string[] = [];
  await db.transaction('rw', db.watch, db.quotes, async () => {
    for (const w of await db.watch.toArray()) {
      if (w.alertAbove === undefined && w.alertBelow === undefined) continue;
      const quote = await db.quotes.get(w.coinId);
      if (!quote) continue;
      const result = checkAlerts(quote.price, w);
      if (result.firedAbove !== Boolean(w.firedAbove) || result.firedBelow !== Boolean(w.firedBelow)) {
        await db.watch.update(w.coinId, { firedAbove: result.firedAbove, firedBelow: result.firedBelow });
      }
      for (const side of result.newly) {
        const threshold = side === 'above' ? w.alertAbove : w.alertBelow;
        fired.push(`${coinLabel(w)} ${side === 'above' ? 'выше' : 'ниже'} ${formatUsd(threshold)}: сейчас ${formatUsd(quote.price)}`);
      }
    }
  });
  for (const text of fired) {
    notify(text);
    await systemNotify('Трекер · цена', text);
  }
}
