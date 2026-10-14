import { useUi, type MarketPeriod } from '../../app/uiStore';
import { Segmented, Stat } from '../../design';
import type { SectionProps } from '../types';
import { coinById, DEFAULT_COINS } from './coins';
import styles from './MarketSection.module.css';

const PERIODS = [
  { value: '1', label: '1Д' },
  { value: '7', label: '7Д' },
  { value: '30', label: '30Д' },
] as const satisfies readonly { value: MarketPeriod; label: string }[];

const GRID_LINES = 4;

export function MarketSection({ compact }: SectionProps) {
  const period = useUi((s) => s.marketPeriod);
  const setPeriod = useUi((s) => s.setMarketPeriod);
  const coinId = useUi((s) => s.coin);
  const setCoin = useUi((s) => s.setCoin);
  const coin = coinById(coinId);

  const width = compact ? 350 : 760;
  const height = compact ? 180 : 280;

  return (
    <div className={styles.section}>
      <div className={styles.head}>
        <div className={styles.quote}>
          <span className="label">
            {coin.name} · {coin.symbol} / USD
          </span>
          <span className={styles.price}>—</span>
          <span className={styles.change}>Изменение: нет данных</span>
        </div>
        <Segmented label="Период графика" options={PERIODS} value={period} onChange={setPeriod} />
      </div>

      <figure className={styles.chart}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          role="img"
          aria-label={`График ${coin.symbol}: нет данных`}
          preserveAspectRatio="none"
          style={{ aspectRatio: `${width} / ${height}` }}
        >
          {Array.from({ length: GRID_LINES }, (_, i) => {
            const y = Math.round(((i + 0.5) * height) / GRID_LINES) + 0.5;
            return <line key={i} x1={0} x2={width} y1={y} y2={y} className={styles.grid} />;
          })}
        </svg>
        <figcaption className={styles.noData}>Нет данных</figcaption>
      </figure>

      <div className={styles.range}>
        <Stat className={styles.rangeCell} label="Макс. за период" value="—" />
        <Stat className={styles.rangeCell} label="Мин. за период" value="—" />
      </div>

      <ul className={styles.coins} aria-label="Наблюдаемые монеты">
        {DEFAULT_COINS.map((c) => {
          const selected = c.id === coin.id;
          return (
            <li key={c.id}>
              <button
                type="button"
                aria-pressed={selected}
                className={selected ? `${styles.coin} ${styles.selected}` : styles.coin}
                onClick={() => setCoin(c.id)}
              >
                <span className={styles.symbol}>{c.symbol}</span>
                <span className={styles.coinName}>{c.name}</span>
                <span className={styles.coinPrice}>—</span>
                <span className={styles.coinChange}>— 24Ч</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
