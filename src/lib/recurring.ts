import { addDays, addMonthsClamped, parseIsoDate, toIsoDate } from './date';

export type Repeat = 'week' | 'month';

/** Safety cap so a template dated years ago cannot create thousands of rows at once. */
const MAX_OCCURRENCES = 120;

/**
 * Dates of a repeating transaction that are due by `today` and not generated yet.
 * The template itself is the first occurrence; `lastRun` is the last generated date.
 */
export function dueOccurrences(
  template: { date: string; repeat: Repeat; lastRun?: string | undefined },
  today: string,
): string[] {
  const start = parseIsoDate(template.date);
  const anchorDay = start.getDate();
  const after = template.lastRun ?? template.date;
  const dates: string[] = [];

  for (let k = 1; dates.length < MAX_OCCURRENCES; k++) {
    const next = template.repeat === 'week' ? addDays(start, 7 * k) : addMonthsClamped(start, k, anchorDay);
    const iso = toIsoDate(next);
    if (iso > today) break;
    if (iso > after) dates.push(iso);
  }
  return dates;
}
