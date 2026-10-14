import { describe, expect, it } from 'vitest';
import { goalProgress, limitStatus, monthSpentByCategory } from './budget';

describe('limits', () => {
  it('turns red at 80% and reports overspending', () => {
    expect(limitStatus(7900, 10000)).toMatchObject({ blocks: 8, warn: false, over: false });
    expect(limitStatus(8000, 10000)).toMatchObject({ blocks: 8, warn: true, over: false });
    expect(limitStatus(12000, 10000)).toMatchObject({ blocks: 10, warn: true, over: true });
  });

  it('shows at least one block once something is spent', () => {
    expect(limitStatus(100, 100000).blocks).toBe(1);
    expect(limitStatus(0, 100000).blocks).toBe(0);
  });

  it('sums expenses per category for the current month only', () => {
    const txns = [
      { kind: 'out' as const, amount: 500, category: 'Еда', date: '2026-10-01' },
      { kind: 'out' as const, amount: 700, category: 'Еда', date: '2026-10-14' },
      { kind: 'out' as const, amount: 900, category: 'Еда', date: '2026-09-30' },
      { kind: 'in' as const, amount: 5000, category: 'Еда', date: '2026-10-02' },
      { kind: 'out' as const, amount: 300, category: 'Транспорт', date: '2026-10-03' },
    ];
    const spent = monthSpentByCategory(txns, new Date(2026, 9, 14));
    expect(spent.get('Еда')).toBe(1200);
    expect(spent.get('Транспорт')).toBe(300);
  });
});

describe('goal', () => {
  it('measures progress by the balance', () => {
    expect(goalProgress(15000, 60000)).toEqual({ saved: 15000, left: 45000, ratio: 0.25, blocks: 2 });
    expect(goalProgress(-500, 60000)).toMatchObject({ saved: 0, left: 60500, blocks: 0 });
    expect(goalProgress(70000, 60000)).toMatchObject({ saved: 60000, left: 0, blocks: 10 });
  });
});
