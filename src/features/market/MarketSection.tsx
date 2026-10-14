import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { useUi, type MarketPeriod } from '../../app/uiStore';
import { Button, Chip, Columns, Delta, LineChart, Segmented, Stat } from '../../design';
import type { Watch } from '../../db/types';
import { db } from '../../db/db';
import { formatClock, formatUsd, periodChange, priceRange, trendOf } from '../../lib/market';
import type { SectionProps } from '../types';
import { coinLabel, useSelectedCoin } from './coins';
import styles from './MarketSection.module.css';
import { useMarketStatus, useWatchList } from './sync';
import { CoinDialog } from './CoinDialog';
import { WatchDialog } from './WatchDialog';

const PERIODS = [
  { value: '1', label: '1Д' },
  { value: '7', label: '7Д' },
  { value: '30', label: '30Д' },
] as const satisfies readonly { value: MarketPeriod; label: string }[];

const GRID_LINES = 4;

export function MarketSection({ compact, wide }: SectionProps) {
  const period = useUi((s) => s.marketPeriod);
  const setPeriod = useUi((s) => s.setMarketPeriod);
  const setCoin = useUi((s) => s.setCoin);
  const status = useMarketStatus();
  const { watch, quote } = useSelectedCoin();
  const list = useWatchList() ?? [];
  const quotes = useLiveQuery(() => db.quotes.toArray(), []) ?? [];
  const chart = useLiveQuery(() => db.charts.get(`${watch.coinId}:${period}`), [watch.coinId, period]);
  const [editing, setEditing] = useState(false);
  const [alertsFor, setAlertsFor] = useState<Watch | null>(null);

  const points = chart?.points ?? [];
  const change = periodChange(points);
  const range = priceRange(points);
  const trend = trendOf(change);
  const width = compact ? 350 : 760;
  const height = compact ? 180 : wide ? 340 : 280;
  const periodLabel = PERIODS.find((p) => p.value === period)!.label;
  const quoteOf = (id: string) => quotes.find((q) => q.coinId === id);
  const updatedAt = Math.max(0, ...quotes.map((q) => q.updatedAt));

  const statusText =
    status.state === 'offline'
      ? 'Нет сети · сохранённые цены'
      : status.state === 'limited'
        ? `Лимит запросов · пауза до ${formatClock(status.pausedUntil)}`
        : status.state === 'error'
          ? 'Ошибка обновления · сохранённые цены'
          : status.state === 'loading' && !updatedAt
            ? 'Загрузка…'
            : null;

  const main = (
    <>
      <div className={styles.head}>
        <div className={styles.quote}>
          <span className="label">
            {watch.name ?? watch.coinId} · {coinLabel(watch)} / USD
          </span>
          <span className={styles.price}>{formatUsd(quote?.price)}</span>
          <Delta value={change} suffix={`за ${periodLabel}`} size="md" />
        </div>
        <Segmented label="Период графика" options={PERIODS} value={period} onChange={setPeriod} />
      </div>

      <figure className={styles.chart}>
        {points.length > 1 ? (
          <LineChart
            values={points.map((p) => p[1])}
            width={width}
            height={height}
            gridLines={GRID_LINES}
            tone={trend === 'up' ? 'accent' : trend === 'down' ? 'negative' : 'text'}
            label={`${coinLabel(watch)} за ${periodLabel}: от ${formatUsd(points[0]![1])} до ${formatUsd(points.at(-1)![1])}`}
          />
        ) : (
          <>
            <svg viewBox={`0 0 ${width} ${height}`} width="100%" preserveAspectRatio="none" style={{ aspectRatio: `${width} / ${height}` }} aria-hidden="true">
              {Array.from({ length: GRID_LINES }, (_, i) => {
                const y = Math.round(((i + 0.5) * height) / GRID_LINES) + 0.5;
                return <line key={i} x1={0} x2={width} y1={y} y2={y} className={styles.grid} />;
              })}
            </svg>
            <figcaption className={styles.noData}>{status.state === 'loading' || status.state === 'idle' ? 'Загрузка…' : 'Нет данных'}</figcaption>
          </>
        )}
      </figure>

      <div className={styles.range}>
        <Stat className={styles.rangeCell} label={`Макс. за ${periodLabel}`} value={formatUsd(range?.max)} />
        <Stat className={styles.rangeCell} label={`Мин. за ${periodLabel}`} value={formatUsd(range?.min)} />
      </div>

      <div className={styles.status} role="status">
        <span className="label">{updatedAt ? `Обновлено ${formatClock(updatedAt)}` : 'Ещё не обновлялось'}</span>
        {statusText && <span className={`label ${styles.warn}`}>{statusText}</span>}
      </div>

      <div className={styles.alertRow}>
        <span className={styles.alertSummary}>
          <span className="label">Алерты {coinLabel(watch)}</span>
          <span className={styles.mono}>
            {watch.alertAbove === undefined && watch.alertBelow === undefined
              ? 'не заданы'
              : [watch.alertAbove !== undefined && `выше ${formatUsd(watch.alertAbove)}`, watch.alertBelow !== undefined && `ниже ${formatUsd(watch.alertBelow)}`]
                  .filter(Boolean)
                  .join(' · ')}
          </span>
        </span>
        <Button variant="secondary" onClick={() => setAlertsFor(watch)}>
          Настроить алерты
        </Button>
      </div>
    </>
  );

  const side = (
    <>
      <ul className={styles.coins} aria-label="Наблюдаемые монеты">
        {list.map((w) => {
          const q = quoteOf(w.coinId);
          const selected = w.coinId === watch.coinId;
          return (
            <li key={w.coinId}>
              <button
                type="button"
                aria-pressed={selected}
                className={selected ? `${styles.coin} ${styles.selected}` : styles.coin}
                onClick={() => setCoin(w.coinId)}
              >
                <span className={styles.symbol}>{coinLabel(w)}</span>
                <span className={styles.coinName}>
                  <span className={styles.coinNameText}>{w.name ?? w.coinId}</span>
                  {w.firedAbove && <Chip filled>Выше {formatUsd(w.alertAbove)}</Chip>}
                  {w.firedBelow && <Chip filled>Ниже {formatUsd(w.alertBelow)}</Chip>}
                </span>
                <span className={styles.coinPrice}>{formatUsd(q?.price)}</span>
                <span className={styles.coinChange}>
                  <Delta value={q?.change24h} suffix="24Ч" />
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <Button variant="secondary" onClick={() => setEditing(true)}>
        Изменить список
      </Button>
    </>
  );

  return (
    <div className={styles.section}>
      <Columns wide={wide} balance="main" main={main} side={side} />

      <WatchDialog open={editing} onClose={() => setEditing(false)} list={list} />
      <CoinDialog watch={alertsFor} quote={quoteOf(alertsFor?.coinId ?? '')} onClose={() => setAlertsFor(null)} />
    </div>
  );
}
