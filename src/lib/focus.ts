import { addDays, mondayIndex, toIsoDate } from './date';

export const FOCUS_MIN = 25;
export const BREAK_MIN = 5;

type SessionLike = { date: string; minutes: number; subjectId?: string | undefined };

/** Minutes of focus in the Monday-based week that contains `today`. */
export function weekMinutes(sessions: readonly SessionLike[], today: Date): number {
  const monday = toIsoDate(addDays(today, -mondayIndex(today)));
  const sunday = toIsoDate(addDays(today, 6 - mondayIndex(today)));
  return sessions.reduce((sum, s) => (s.date >= monday && s.date <= sunday ? sum + s.minutes : sum), 0);
}

/** Minutes per subject this week, largest first. Sessions without a subject are grouped under ''. */
export function weekBySubject(sessions: readonly SessionLike[], today: Date): { subjectId: string; minutes: number }[] {
  const monday = toIsoDate(addDays(today, -mondayIndex(today)));
  const sunday = toIsoDate(addDays(today, 6 - mondayIndex(today)));
  const totals = new Map<string, number>();
  for (const s of sessions) {
    if (s.date < monday || s.date > sunday) continue;
    const key = s.subjectId ?? '';
    totals.set(key, (totals.get(key) ?? 0) + s.minutes);
  }
  return [...totals].map(([subjectId, minutes]) => ({ subjectId, minutes })).sort((a, b) => b.minutes - a.minutes);
}

/** 0 for no focus, then 1..4 as minutes grow: one session, two, four, six and more. */
export function heatLevel(minutes: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes <= 0) return 0;
  if (minutes < 50) return 1;
  if (minutes < 100) return 2;
  if (minutes < 150) return 3;
  return 4;
}

export type HeatCell = { date: string; minutes: number; level: 0 | 1 | 2 | 3 | 4; future: boolean };

/**
 * The activity grid: `weeks` columns (oldest first) of 7 days (Monday first), ending with
 * the current week. Days after today are marked `future`.
 */
export function activityGrid(sessions: readonly SessionLike[], today: Date, weeks = 12): HeatCell[][] {
  const perDay = new Map<string, number>();
  for (const s of sessions) perDay.set(s.date, (perDay.get(s.date) ?? 0) + s.minutes);
  const todayIso = toIsoDate(today);
  const firstMonday = addDays(today, -mondayIndex(today) - 7 * (weeks - 1));
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = toIsoDate(addDays(firstMonday, w * 7 + d));
      const minutes = perDay.get(date) ?? 0;
      return { date, minutes, level: heatLevel(minutes), future: date > todayIso };
    }),
  );
}

/** 754 000 ms → "12:34" */
export function formatTimer(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
