// Date helpers. Calendar dates are stored as 'YYYY-MM-DD' strings in local time.

const WEEKDAY_SHORT = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'] as const;
const WEEKDAY_FULL = ['ВОСКРЕСЕНЬЕ', 'ПОНЕДЕЛЬНИК', 'ВТОРНИК', 'СРЕДА', 'ЧЕТВЕРГ', 'ПЯТНИЦА', 'СУББОТА'] as const;

/** Short labels for the six school days, Monday first. */
export const SCHOOL_DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'] as const;
/** Short labels for a full week, Monday first. */
export const WEEK_DAYS = [...SCHOOL_DAYS, 'ВС'] as const;

const pad = (n: number) => String(n).padStart(2, '0');

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 'YYYY-MM-DD' → local Date at midnight. */
export function parseIsoDate(iso: string): Date {
  const [y = 1970, m = 1, d = 1] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** "14.10" from an ISO date. */
export function formatDayMonth(iso: string): string {
  const [, m = '', d = ''] = iso.split('-');
  return `${d}.${m}`;
}

/** Adds months keeping the anchor day, clamped to the month length (31 Jan + 1 → 28/29 Feb). */
export function addMonthsClamped(date: Date, months: number, anchorDay = date.getDate()): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(anchorDay, last));
  return target;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Monday-based weekday index: 0 = Monday … 6 = Sunday. */
export function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/** "СР / 14.10" for the phone header. */
export function formatHeaderDate(date: Date): string {
  return `${WEEKDAY_SHORT[date.getDay()]} / ${pad(date.getDate())}.${pad(date.getMonth() + 1)}`;
}

/** "14.10.2026" */
export function formatFullDate(date: Date): string {
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

/** Parts of the desktop overview title "СРЕДА.14". */
export function overviewTitle(date: Date): { weekday: string; day: string } {
  return { weekday: WEEKDAY_FULL[date.getDay()]!, day: pad(date.getDate()) };
}

/** ISO-8601 week number (weeks start on Monday, week 1 contains the first Thursday). */
export function isoWeek(date: Date): number {
  // The week belongs to the year of its Thursday.
  const thursday = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 3 - mondayIndex(date));
  const jan1 = new Date(thursday.getFullYear(), 0, 1);
  const dayOfYear = Math.round((thursday.getTime() - jan1.getTime()) / 86_400_000);
  return 1 + Math.floor(dayOfYear / 7);
}

/** Number of days in the month of the given date. */
export function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * The six school days (Mon–Sat) shown in the schedule strip.
 * On Sunday the strip shows the coming week, so its Monday is the default selection.
 */
export function schoolWeek(today: Date): Date[] {
  const offset = today.getDay() === 0 ? 1 : -mondayIndex(today);
  const monday = addDays(today, offset);
  return SCHOOL_DAYS.map((_, i) => addDays(monday, i));
}

/** Default selected school day (0 = Monday … 5 = Saturday); Sunday falls back to Monday. */
export function defaultSchoolDay(today: Date): number {
  const index = mondayIndex(today);
  return index === 6 ? 0 : index;
}
