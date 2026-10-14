import { describe, expect, it } from 'vitest';
import { bestSubject, formatAverage, overallAverage, scaleBlocks, weeklyAverages, weightedAverage } from './grades';

const g = (value: number, weight = 1, date = '2026-10-14') => ({ value, weight, date });

describe('weightedAverage', () => {
  it('returns null without grades', () => {
    expect(weightedAverage([])).toBeNull();
  });

  it('weights grades', () => {
    expect(weightedAverage([g(10), g(7)])).toBe(8.5);
    expect(weightedAverage([g(10, 3), g(6, 1)])).toBe(9);
  });
});

describe('overallAverage', () => {
  it('averages subject averages and skips empty subjects', () => {
    expect(overallAverage([[g(10), g(8)], [g(6)], []])).toBe(7.5);
    expect(overallAverage([[], []])).toBeNull();
  });
});

describe('bestSubject', () => {
  it('picks the highest average', () => {
    const subjects = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const grades: Record<string, ReturnType<typeof g>[]> = { a: [g(7)], b: [g(9), g(8)], c: [] };
    expect(bestSubject(subjects, (id) => grades[id] ?? [])).toEqual({ subject: { id: 'b' }, average: 8.5 });
    expect(bestSubject([], () => [])).toBeNull();
  });
});

describe('formatting and scale', () => {
  it('formats averages', () => {
    expect(formatAverage(8.25)).toBe('8,3');
    expect(formatAverage(9)).toBe('9,0');
    expect(formatAverage(null)).toBe('—');
  });

  it('maps averages to 10 blocks on any scale', () => {
    expect(scaleBlocks(8.4, 10)).toBe(8);
    expect(scaleBlocks(4, 5)).toBe(8);
    expect(scaleBlocks(12, 12)).toBe(10);
    expect(scaleBlocks(null, 10)).toBe(0);
  });
});

describe('weeklyAverages', () => {
  it('returns cumulative averages per week', () => {
    const points = weeklyAverages([
      g(6, 1, '2026-10-05'),
      g(10, 1, '2026-10-07'),
      g(5, 1, '2026-10-14'),
      g(9, 1, '2026-10-12'),
    ]);
    expect(points).toEqual([
      { week: '2026-10-05', average: 8 },
      { week: '2026-10-12', average: 7.5 },
    ]);
  });
});
