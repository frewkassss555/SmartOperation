import { parseIsoDate } from './date';
import { pluralIndex } from './gradeCalc';

type TaskLike = { due: string; done: boolean; doneAt?: number | undefined };

/** Whole days from today to the due date: 0 today, negative when overdue. */
export function daysUntil(due: string, today: Date): number {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((parseIsoDate(due).getTime() - start.getTime()) / 86_400_000);
}

const dayWord = (n: number) => ['день', 'дня', 'дней'][pluralIndex(n)];

/** "Сегодня", "Завтра", "Через 3 дня", "Просрочено на 2 дня". */
export function deadlineLabel(days: number): string {
  if (days === 0) return 'Сегодня';
  if (days === 1) return 'Завтра';
  if (days > 1) return `Через ${days} ${dayWord(days)}`;
  return `Просрочено на ${-days} ${dayWord(-days)}`;
}

/** Open tasks by due date (overdue first), then done tasks, most recently done first. */
export function sortTasks<T extends TaskLike>(tasks: readonly T[]): T[] {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (!a.done) return a.due.localeCompare(b.due);
    return (b.doneAt ?? 0) - (a.doneAt ?? 0);
  });
}

/** The nearest open deadlines, overdue ones included. */
export function upcoming<T extends TaskLike>(tasks: readonly T[], count = 3): T[] {
  return sortTasks(tasks.filter((t) => !t.done)).slice(0, count);
}
