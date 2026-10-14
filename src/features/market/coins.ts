import { useLiveQuery } from 'dexie-react-hooks';
import { useUi } from '../../app/uiStore';
import { notify } from '../../app/undo';
import { db } from '../../db/db';
import { DEFAULT_WATCH, MAX_WATCH, type Quote, type Watch } from '../../db/types';
import type { SearchHit } from '../../lib/coingecko';

export const coinLabel = (w: Pick<Watch, 'coinId' | 'symbol'>) => w.symbol ?? w.coinId.slice(0, 4).toUpperCase();

/**
 * The selected coin with its last known quote. Falls back to the first watched coin
 * when the selected one was removed from the list.
 */
export function useSelectedCoin(): { watch: Watch; quote: Quote | undefined } {
  const selected = useUi((s) => s.coin);
  const data = useLiveQuery(async () => {
    const list = await db.watch.orderBy('order').toArray();
    const watch = list.find((w) => w.coinId === selected) ?? list[0];
    return watch ? { watch, quote: await db.quotes.get(watch.coinId) } : undefined;
  }, [selected]);
  return data ?? { watch: DEFAULT_WATCH[0]!, quote: undefined };
}

export async function addCoin(hit: SearchHit): Promise<boolean> {
  const list = await db.watch.orderBy('order').toArray();
  if (list.length >= MAX_WATCH || list.some((w) => w.coinId === hit.id)) return false;
  const order = (list.at(-1)?.order ?? -1) + 1;
  await db.watch.add({ coinId: hit.id, order, symbol: hit.symbol, name: hit.name });
  return true;
}

export async function removeCoin(watch: Watch): Promise<void> {
  if ((await db.watch.count()) <= 1) return;
  await db.watch.delete(watch.coinId);
  if (useUi.getState().coin === watch.coinId) {
    const first = await db.watch.orderBy('order').first();
    if (first) useUi.getState().setCoin(first.coinId);
  }
  notify(`Убрана монета ${coinLabel(watch)}`, () => db.watch.put(watch).then(() => undefined));
}

/** Moves a coin one place up or down in the list. */
export async function moveCoin(coinId: string, direction: -1 | 1): Promise<void> {
  await db.transaction('rw', db.watch, async () => {
    const list = await db.watch.orderBy('order').toArray();
    const i = list.findIndex((w) => w.coinId === coinId);
    const j = i + direction;
    if (i < 0 || j < 0 || j >= list.length) return;
    const a = list[i]!;
    const b = list[j]!;
    await db.watch.update(a.coinId, { order: b.order });
    await db.watch.update(b.coinId, { order: a.order });
  });
}
