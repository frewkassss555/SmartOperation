import { describe, expect, it } from 'vitest';
import { formatDuration, isValidTime, lessonsForDay, lessonStatus, parityOf, toMinutes } from './schedule';

const lesson = (day: number, start: string, end: string, week?: 'even' | 'odd') => ({ day, start, end, week });

describe('schedule helpers', () => {
  it('parses times', () => {
    expect(toMinutes('08:30')).toBe(510);
    expect(isValidTime('8:30')).toBe(false);
    expect(isValidTime('23:59')).toBe(true);
    expect(isValidTime('24:00')).toBe(false);
  });

  it('computes week parity from the ISO week', () => {
    expect(parityOf(new Date(2026, 9, 14))).toBe('even');
    expect(parityOf(new Date(2026, 9, 21))).toBe('odd');
  });

  it('filters by day and parity, sorted by start', () => {
    const lessons = [lesson(0, '10:00', '10:45'), lesson(0, '08:30', '09:15', 'odd'), lesson(1, '08:30', '09:15'), lesson(0, '09:25', '10:10', 'even')];
    expect(lessonsForDay(lessons, 0, null).map((l) => l.start)).toEqual(['08:30', '09:25', '10:00']);
    expect(lessonsForDay(lessons, 0, 'even').map((l) => l.start)).toEqual(['09:25', '10:00']);
  });
});

describe('lessonStatus', () => {
  const day = [lesson(0, '08:30', '09:15'), lesson(0, '09:25', '10:10')];

  it('reports a lesson in progress', () => {
    expect(lessonStatus(day, toMinutes('09:00'))).toMatchObject({ kind: 'lesson', index: 0, minutesLeft: 15 });
  });

  it('reports a break before the next lesson', () => {
    expect(lessonStatus(day, toMinutes('09:20'))).toMatchObject({ kind: 'break', index: 1, minutesLeft: 5 });
  });

  it('is null outside school hours', () => {
    expect(lessonStatus(day, toMinutes('07:00'))).toBeNull();
    expect(lessonStatus(day, toMinutes('10:10'))).toBeNull();
    expect(lessonStatus([], 600)).toBeNull();
  });

  it('formats durations', () => {
    expect(formatDuration(7)).toBe('7 мин');
    expect(formatDuration(65)).toBe('1 ч 05 мин');
  });
});
