import styles from './LineChart.module.css';

type LineChartProps = {
  values: readonly number[];
  width: number;
  height: number;
  /** Fixed value range; defaults to min/max of the data with padding. */
  domain?: readonly [number, number] | undefined;
  gridLines?: number;
  tone?: 'text' | 'accent' | 'negative';
  label: string;
};

/** Polyline without smoothing, 2px stroke, square marker on the last point. */
export function LineChart({ values, width, height, domain, gridLines = 4, tone = 'accent', label }: LineChartProps) {
  const pad = 8;
  const min = domain ? domain[0] : Math.min(...values);
  const max = domain ? domain[1] : Math.max(...values);
  const span = max - min || 1;
  const lo = domain ? min : min - span * 0.1;
  const hi = domain ? max : max + span * 0.1;

  const x = (i: number) => (values.length < 2 ? width / 2 : pad + (i * (width - 2 * pad)) / (values.length - 1));
  const y = (v: number) => pad + (1 - (v - lo) / (hi - lo)) * (height - 2 * pad);
  const points = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const last = values.length - 1;

  return (
    <svg
      className={`${styles.chart} ${styles[tone]}`}
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      preserveAspectRatio="none"
      style={{ aspectRatio: `${width} / ${height}` }}
      role="img"
      aria-label={label}
    >
      {Array.from({ length: gridLines }, (_, i) => {
        const gy = Math.round(((i + 0.5) * height) / gridLines) + 0.5;
        return <line key={i} x1={0} x2={width} y1={gy} y2={gy} className={styles.grid} />;
      })}
      {values.length > 1 && <polyline points={points} className={styles.line} />}
      {last >= 0 && <rect x={x(last) - 4} y={y(values[last]!) - 4} width={8} height={8} className={styles.marker} />}
    </svg>
  );
}
