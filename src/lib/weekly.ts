import { addDays, mondayIndex, toIsoDate } from './date';
import { weightedAverage } from './grades';

type Input = {
  grades: readonly { value: number; weight: number; date: string }[];
  txns: readonly { kind: 'in' | 'out'; amount: number; date: string }[];
  tasks: readonly { done: boolean; doneAt?: number | undefined }[];
  focus: readonly { date: string; minutes: number }[];
};

export type WeeklySummary = {
  /** Weighted average of grades received this week, or null without grades. */
  average: number | null;
  /** Change against last week's average, or null if either week has no grades. */
  averageDiff: number | null;
  expenses: number;
  tasksDone: number;
  focusMinutes: number;
};

/** Monday-to-Sunday summary of the week that contains `today`. */
export function weeklySummary(data: Input, today: Date): WeeklySummary {
  const monday = addDays(new Date(today.getFullYear(), today.getMonth(), today.getDate()), -mondayIndex(today));
  const from = toIsoDate(monday);
  const to = toIsoDate(addDays(monday, 6));
  const prevFrom = toIsoDate(addDays(monday, -7));
  const prevTo = toIsoDate(addDays(monday, -1));
  const startMs = monday.getTime();
  const endMs = addDays(monday, 7).getTime();
  const inWeek = (d: string) => d >= from && d <= to;

  const average = weightedAverage(data.grades.filter((g) => inWeek(g.date)));
  const previous = weightedAverage(data.grades.filter((g) => g.date >= prevFrom && g.date <= prevTo));

  return {
    average,
    averageDiff: average === null || previous === null ? null : average - previous,
    expenses: data.txns.reduce((sum, t) => (t.kind === 'out' && inWeek(t.date) ? sum + t.amount : sum), 0),
    tasksDone: data.tasks.filter((t) => t.done && t.doneAt !== undefined && t.doneAt >= startMs && t.doneAt < endMs).length,
    focusMinutes: data.focus.reduce((sum, f) => (inWeek(f.date) ? sum + f.minutes : sum), 0),
  };
}

/** The summary is shown on Sundays. */
export const isSummaryDay = (date: Date) => date.getDay() === 0;

/** "+0,4" / "−1,2" / "0,0" */
export function formatDiff(diff: number): string {
  // Round halves away from zero for both signs (Math.round sends −1,25 to −1,2).
  const rounded = (Math.sign(diff) * Math.round(Math.abs(diff) * 10)) / 10;
  const text = Math.abs(rounded).toFixed(1).replace('.', ',');
  return rounded > 0 ? `+${text}` : rounded < 0 ? `−${text}` : text;
}
