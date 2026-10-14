import { describe, expect, it } from 'vitest';
import { daysUntil, deadlineLabel, sortTasks, upcoming } from './tasks';

const today = new Date(2026, 9, 14, 18, 30);

describe('deadlines', () => {
  it('counts whole days regardless of the time of day', () => {
    expect(daysUntil('2026-10-14', today)).toBe(0);
    expect(daysUntil('2026-10-15', today)).toBe(1);
    expect(daysUntil('2026-10-12', today)).toBe(-2);
    expect(daysUntil('2026-11-14', today)).toBe(31);
  });

  it('labels the countdown in Russian', () => {
    expect(deadlineLabel(0)).toBe('Сегодня');
    expect(deadlineLabel(1)).toBe('Завтра');
    expect(deadlineLabel(3)).toBe('Через 3 дня');
    expect(deadlineLabel(5)).toBe('Через 5 дней');
    expect(deadlineLabel(21)).toBe('Через 21 день');
    expect(deadlineLabel(-1)).toBe('Просрочено на 1 день');
    expect(deadlineLabel(-12)).toBe('Просрочено на 12 дней');
  });

  it('sorts open tasks by due date and done ones last', () => {
    const tasks = [
      { id: 'a', due: '2026-10-20', done: false },
      { id: 'b', due: '2026-10-10', done: true, doneAt: 1 },
      { id: 'c', due: '2026-10-12', done: false },
      { id: 'd', due: '2026-10-11', done: true, doneAt: 5 },
    ];
    expect(sortTasks(tasks).map((t) => t.id)).toEqual(['c', 'a', 'd', 'b']);
    expect(upcoming(tasks, 1).map((t) => t.id)).toEqual(['c']);
  });
});
