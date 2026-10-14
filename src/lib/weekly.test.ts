import { describe, expect, it } from 'vitest';
import { formatDiff, isSummaryDay, weeklySummary } from './weekly';

const sunday = new Date(2026, 9, 18, 19, 0);
const ms = (y: number, m: number, d: number) => new Date(y, m, d, 12).getTime();

describe('weekly summary', () => {
  const data = {
    grades: [
      { value: 9, weight: 1, date: '2026-10-13' },
      { value: 7, weight: 1, date: '2026-10-16' },
      { value: 6, weight: 1, date: '2026-10-07' },
      { value: 8, weight: 1, date: '2026-10-09' },
    ],
    txns: [
      { kind: 'out' as const, amount: 640, date: '2026-10-12' },
      { kind: 'out' as const, amount: 1000, date: '2026-10-18' },
      { kind: 'in' as const, amount: 5000, date: '2026-10-14' },
      { kind: 'out' as const, amount: 999, date: '2026-10-11' },
    ],
    tasks: [
      { done: true, doneAt: ms(2026, 9, 15) },
      { done: true, doneAt: ms(2026, 9, 10) },
      { done: false },
    ],
    focus: [
      { date: '2026-10-12', minutes: 25 },
      { date: '2026-10-18', minutes: 50 },
      { date: '2026-10-05', minutes: 25 },
    ],
  };

  it('sums the Monday-to-Sunday week', () => {
    expect(weeklySummary(data, sunday)).toEqual({ average: 8, averageDiff: 1, expenses: 1640, tasksDone: 1, focusMinutes: 75 });
  });

  it('has no average change without grades in either week', () => {
    expect(weeklySummary({ ...data, grades: data.grades.slice(0, 2) }, sunday).averageDiff).toBeNull();
    expect(weeklySummary({ ...data, grades: [] }, sunday).average).toBeNull();
  });

  it('shows on Sundays and formats the difference', () => {
    expect(isSummaryDay(sunday)).toBe(true);
    expect(isSummaryDay(new Date(2026, 9, 17))).toBe(false);
    expect(formatDiff(0.44)).toBe('+0,4');
    expect(formatDiff(-1.25)).toBe('−1,3');
    expect(formatDiff(0.01)).toBe('0,0');
  });
});
