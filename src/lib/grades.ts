// Grade calculations. All averages are weighted by grade weight (1..3).

export type GradeScale = 5 | 10 | 12;
export const GRADE_SCALES: readonly GradeScale[] = [5, 10, 12];

type Weighted = { value: number; weight: number };
type Dated = Weighted & { date: string };

/** Weighted mean of grades, or null when there are none. */
export function weightedAverage(grades: readonly Weighted[]): number | null {
  let sum = 0;
  let weights = 0;
  for (const g of grades) {
    sum += g.value * g.weight;
    weights += g.weight;
  }
  return weights === 0 ? null : sum / weights;
}

/**
 * Overall average: the mean of subject averages, so a subject with many grades
 * does not outweigh the others. Subjects without grades are skipped.
 */
export function overallAverage(bySubject: readonly (readonly Weighted[])[]): number | null {
  const averages = bySubject.map(weightedAverage).filter((a): a is number => a !== null);
  if (averages.length === 0) return null;
  return averages.reduce((a, b) => a + b, 0) / averages.length;
}

/** The subject with the highest average; ties go to the one listed first. */
export function bestSubject<T extends { id: string }>(
  subjects: readonly T[],
  gradesOf: (id: string) => readonly Weighted[],
): { subject: T; average: number } | null {
  let best: { subject: T; average: number } | null = null;
  for (const subject of subjects) {
    const average = weightedAverage(gradesOf(subject.id));
    if (average !== null && (best === null || average > best.average)) best = { subject, average };
  }
  return best;
}

/** One decimal, comma separator: 8.25 → "8,3"; null → "—". */
export function formatAverage(average: number | null): string {
  if (average === null) return '—';
  return (Math.round(average * 10) / 10).toFixed(1).replace('.', ',');
}

/** Filled blocks of a 10-block scale for an average on any grade scale. */
export function scaleBlocks(average: number | null, scale: GradeScale, blocks = 10): number {
  if (average === null) return 0;
  return Math.min(blocks, Math.max(0, Math.round((average / scale) * blocks)));
}

/** Monday of the week containing an ISO date, as an ISO date. */
function weekStart(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Cumulative weighted average at the end of each week that has grades, oldest first.
 * Cumulative rather than per-week so the line shows the trend of the real average.
 */
export function weeklyAverages(grades: readonly Dated[]): { week: string; average: number }[] {
  const sorted = [...grades].sort((a, b) => a.date.localeCompare(b.date));
  const points: { week: string; average: number }[] = [];
  let sum = 0;
  let weights = 0;
  for (const g of sorted) {
    sum += g.value * g.weight;
    weights += g.weight;
    const week = weekStart(g.date);
    const point = { week, average: sum / weights };
    if (points.at(-1)?.week === week) points[points.length - 1] = point;
    else points.push(point);
  }
  return points;
}
