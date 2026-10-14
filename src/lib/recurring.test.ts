import { describe, expect, it } from 'vitest';
import { dueOccurrences } from './recurring';

describe('dueOccurrences', () => {
  it('creates weekly occurrences up to today', () => {
    expect(dueOccurrences({ date: '2026-09-30', repeat: 'week' }, '2026-10-14')).toEqual([
      '2026-10-07',
      '2026-10-14',
    ]);
  });

  it('skips already generated dates', () => {
    expect(dueOccurrences({ date: '2026-09-30', repeat: 'week', lastRun: '2026-10-07' }, '2026-10-14')).toEqual([
      '2026-10-14',
    ]);
    expect(dueOccurrences({ date: '2026-09-30', repeat: 'week', lastRun: '2026-10-14' }, '2026-10-14')).toEqual([]);
  });

  it('keeps the anchor day for monthly repeats', () => {
    expect(dueOccurrences({ date: '2026-01-31', repeat: 'month' }, '2026-04-30')).toEqual([
      '2026-02-28',
      '2026-03-31',
      '2026-04-30',
    ]);
  });

  it('returns nothing for a future template', () => {
    expect(dueOccurrences({ date: '2026-11-01', repeat: 'month' }, '2026-10-14')).toEqual([]);
  });

  it('caps very old templates', () => {
    expect(dueOccurrences({ date: '2000-01-01', repeat: 'week' }, '2026-10-14')).toHaveLength(120);
  });
});
