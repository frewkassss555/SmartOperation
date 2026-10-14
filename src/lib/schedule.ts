import { isoWeek } from './date';

export type Parity = 'even' | 'odd';

type LessonLike = { day: number; start: string; end: string; week?: Parity | undefined };

export function parityOf(date: Date): Parity {
  return isoWeek(date) % 2 === 0 ? 'even' : 'odd';
}

/** '08:30' → 510 */
export function toMinutes(time: string): number {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return h * 60 + m;
}

export function isValidTime(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

/**
 * Lessons of one day sorted by start time. With parity on, lessons tied to the other
 * week are hidden; lessons without a week tag show every week.
 */
export function lessonsForDay<T extends LessonLike>(lessons: readonly T[], day: number, parity: Parity | null): T[] {
  return lessons
    .filter((l) => l.day === day && (parity === null || l.week === undefined || l.week === parity))
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
}

export type LessonStatus<T> =
  | { kind: 'lesson'; index: number; lesson: T; minutesLeft: number }
  | { kind: 'break'; index: number; lesson: T; minutesLeft: number };

/**
 * What is happening now in a day's sorted lessons: a lesson in progress (minutes to its end)
 * or a break between lessons (minutes to the next one). Null before the first and after the last.
 */
export function lessonStatus<T extends LessonLike>(dayLessons: readonly T[], nowMinutes: number): LessonStatus<T> | null {
  for (let i = 0; i < dayLessons.length; i++) {
    const lesson = dayLessons[i]!;
    const start = toMinutes(lesson.start);
    const end = toMinutes(lesson.end);
    if (nowMinutes >= start && nowMinutes < end) {
      return { kind: 'lesson', index: i, lesson, minutesLeft: end - nowMinutes };
    }
    const next = dayLessons[i + 1];
    if (next && nowMinutes >= end && nowMinutes < toMinutes(next.start)) {
      return { kind: 'break', index: i + 1, lesson: next, minutesLeft: toMinutes(next.start) - nowMinutes };
    }
  }
  return null;
}

/** 7 → "7 мин", 65 → "1 ч 05 мин" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  return `${Math.floor(minutes / 60)} ч ${String(minutes % 60).padStart(2, '0')} мин`;
}
