import { useEffect, useState } from 'react';
import { Button, Delta, Dialog, Field } from '../../design';
import { db } from '../../db/db';
import type { Quote, Watch } from '../../db/types';
import { parseUsd } from '../../lib/alerts';
import { formatUsd } from '../../lib/market';
import { formatAmount, formatSignedUsd, portfolioTotals, valuePosition } from '../../lib/portfolio';
import { coinLabel } from './coins';
import styles from './MarketSection.module.css';

type Props = { list: readonly Watch[]; quotes: readonly Quote[] };

/** Notional portfolio: amounts typed by hand, valued at the last saved price. */
export function PortfolioBlock({ list, quotes }: Props) {
  const [editing, setEditing] = useState(false);
  const held = list.filter((w) => (w.holding ?? 0) > 0);
  const positions = held.map((w) =>
    valuePosition({ coinId: w.coinId, amount: w.holding!, buyPrice: w.buyPrice ?? 0, price: quotes.find((q) => q.coinId === w.coinId)?.price ?? null }),
  );
  const totals = portfolioTotals(positions);

  return (
    <section className={styles.portfolio} aria-labelledby="portfolio-title">
      <div className={styles.portfolioHead}>
        <h2 className={styles.portfolioTitle} id="portfolio-title">
          Портфель
        </h2>
        <Button variant="ghost" onClick={() => setEditing(true)}>
          {held.length ? 'Изменить' : 'Заполнить'}
        </Button>
      </div>

      {held.length === 0 ? (
        <p className={styles.note}>Укажите, сколько монет у вас есть и почём куплены, — SmartOperation посчитает стоимость и результат.</p>
      ) : (
        <>
          <div className={styles.portfolioTotal}>
            <span className="label">Стоимость</span>
            <span className={styles.portfolioValue}>{formatUsd(totals.value)}</span>
            <span className={styles.portfolioPnl}>
              <Delta value={totals.pnlPct} suffix="к покупке" />
              <span className={totals.pnl > 0 ? styles.up : totals.pnl < 0 ? styles.down : styles.mono}>{formatSignedUsd(totals.pnl)}</span>
            </span>
          </div>
          <ul className={styles.positions}>
            {positions.map((p) => {
              const w = held.find((x) => x.coinId === p.coinId)!;
              return (
                <li key={p.coinId} className={styles.position}>
                  <span className={styles.symbol}>{coinLabel(w)}</span>
                  <span className={styles.positionAmount}>{formatAmount(p.amount)}</span>
                  <span className={styles.coinPrice}>{formatUsd(p.value)}</span>
                  <Delta value={p.pnlPct} />
                </li>
              );
            })}
          </ul>
        </>
      )}
      <p className={styles.footnote}>Условный: без сделок, кошельков и ключей бирж.</p>

      <PortfolioDialog open={editing} onClose={() => setEditing(false)} list={list} />
    </section>
  );
}

const toInput = (v: number | undefined) => (v === undefined ? '' : String(v).replace('.', ','));

function PortfolioDialog({ open, onClose, list }: { open: boolean; onClose: () => void; list: readonly Watch[] }) {
  const [rows, setRows] = useState<Record<string, { amount: string; buy: string }>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setRows(Object.fromEntries(list.map((w) => [w.coinId, { amount: toInput(w.holding), buy: toInput(w.buyPrice) }])));
    setErrors({});
    // Reset only on open.
  }, [open]);

  const submit = async () => {
    const updates: { coinId: string; holding: number | undefined; buyPrice: number | undefined }[] = [];
    const next: Record<string, string> = {};
    for (const w of list) {
      const row = rows[w.coinId] ?? { amount: '', buy: '' };
      if (!row.amount.trim()) {
        updates.push({ coinId: w.coinId, holding: undefined, buyPrice: undefined });
        continue;
      }
      const amount = parseUsd(row.amount);
      const buy = parseUsd(row.buy);
      if (amount === null) next[w.coinId] = 'Количество, например 0,25';
      else if (buy === null) next[w.coinId] = 'Цена покупки за 1 монету, $';
      else updates.push({ coinId: w.coinId, holding: amount, buyPrice: buy });
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    await db.transaction('rw', db.watch, async () => {
      for (const u of updates) await db.watch.update(u.coinId, { holding: u.holding, buyPrice: u.buyPrice });
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      kicker="Рынок"
      title="Портфель"
      onSubmit={submit}
      actions={
        <Button variant="primary" type="submit">
          Сохранить
        </Button>
      }
    >
      <p className={styles.note}>Пустое количество — монеты нет в портфеле. Цена покупки — за одну монету в долларах.</p>
      {list.map((w) => (
        <div key={w.coinId} className={styles.portfolioRow}>
          <span className={styles.symbol}>{coinLabel(w)}</span>
          <Field
            label="Количество"
            inputMode="decimal"
            value={rows[w.coinId]?.amount ?? ''}
            onChange={(e) => setRows({ ...rows, [w.coinId]: { amount: e.target.value, buy: rows[w.coinId]?.buy ?? '' } })}
            error={errors[w.coinId]}
          />
          <Field
            label="Цена покупки, $"
            inputMode="decimal"
            value={rows[w.coinId]?.buy ?? ''}
            onChange={(e) => setRows({ ...rows, [w.coinId]: { amount: rows[w.coinId]?.amount ?? '', buy: e.target.value } })}
          />
        </div>
      ))}
    </Dialog>
  );
}
