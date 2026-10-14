import { describe, expect, it } from 'vitest';
import { activityGrid, formatTimer, heatLevel, weekBySubject, weekMinutes } from './focus';

const today = new Date(2026, 9, 14); // Wednesday
const sessions = [
  { date: '2026-10-12', minutes: 25, subjectId: 'math' },
  { date: '2026-10-14', minutes: 25, subjectId: 'math' },
  { date: '2026-10-14', minutes: 50, subjectId: 'phys' },
  { date: '2026-10-11', minutes: 25 }, // previous Sunday
  { date: '2026-07-01', minutes: 25 }, // older than 12 weeks
];

describe('focus stats', () => {
  it('sums the current week', () => {
    expect(weekMinutes(sessions, today)).toBe(100);
  });

  it('groups the week by subject', () => {
    // Equal totals keep their first-seen order (stable sort).
    expect(weekBySubject(sessions, today)).toEqual([
      { subjectId: 'math', minutes: 50 },
      { subjectId: 'phys', minutes: 50 },
    ]);
    expect(weekBySubject([...sessions, { date: '2026-10-13', minutes: 5, subjectId: 'phys' }], today)[0]).toEqual({
      subjectId: 'phys',
      minutes: 55,
    });
  });

  it('maps minutes to brightness levels', () => {
    expect([0, 25, 50, 100, 150, 400].map(heatLevel)).toEqual([0, 1, 2, 3, 4, 4]);
  });

  it('builds a 12×7 grid ending this week', () => {
    const grid = activityGrid(sessions, today);
    expect(grid).toHaveLength(12);
    expect(grid.every((week) => week.length === 7)).toBe(true);
    expect(grid[0]![0]!.date).toBe('2026-07-27');
    const last = grid[11]!;
    expect(last[0]).toMatchObject({ date: '2026-10-12', minutes: 25, level: 1, future: false });
    expect(last[2]).toMatchObject({ date: '2026-10-14', minutes: 75, level: 2 });
    expect(last[3]!.future).toBe(true);
    expect(grid[10]![6]).toMatchObject({ date: '2026-10-11', minutes: 25 });
  });

  it('formats the countdown', () => {
    expect(formatTimer(25 * 60_000)).toBe('25:00');
    expect(formatTimer(754_000)).toBe('12:34');
    expect(formatTimer(-5)).toBe('00:00');
    expect(formatTimer(1)).toBe('00:01');
  });
});
