import { describe, expect, it } from 'vitest';
import {
  daysInMonth,
  defaultSchoolDay,
  isoWeek,
  formatFullDate,
  formatHeaderDate,
  mondayIndex,
  overviewTitle,
  schoolWeek,
  toIsoDate,
} from './date';

const wednesday = new Date(2026, 9, 14);
const sunday = new Date(2026, 9, 18);

describe('date helpers', () => {
  it('formats the header date', () => {
    expect(formatHeaderDate(wednesday)).toBe('СР / 14.10');
    expect(formatHeaderDate(new Date(2026, 0, 4))).toBe('ВС / 04.01');
  });

  it('formats full and ISO dates', () => {
    expect(formatFullDate(wednesday)).toBe('14.10.2026');
    expect(toIsoDate(wednesday)).toBe('2026-10-14');
  });

  it('builds the overview title', () => {
    expect(overviewTitle(wednesday)).toEqual({ weekday: 'СРЕДА', day: '14' });
  });

  it('indexes weekdays from Monday', () => {
    expect(mondayIndex(new Date(2026, 9, 12))).toBe(0);
    expect(mondayIndex(sunday)).toBe(6);
  });

  it('returns Mon–Sat of the current week', () => {
    expect(schoolWeek(wednesday).map(toIsoDate)).toEqual([
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
      '2026-10-16',
      '2026-10-17',
    ]);
  });

  it('shows the coming week on Sunday and selects Monday', () => {
    expect(toIsoDate(schoolWeek(sunday)[0]!)).toBe('2026-10-19');
    expect(defaultSchoolDay(sunday)).toBe(0);
    expect(defaultSchoolDay(wednesday)).toBe(2);
  });

  it('computes ISO week numbers', () => {
    expect(isoWeek(wednesday)).toBe(42);
    expect(isoWeek(sunday)).toBe(42);
    expect(isoWeek(new Date(2026, 0, 1))).toBe(1);
    expect(isoWeek(new Date(2027, 0, 1))).toBe(53);
    expect(isoWeek(new Date(2024, 11, 30))).toBe(1);
  });

  it('counts days in a month', () => {
    expect(daysInMonth(wednesday)).toBe(31);
    expect(daysInMonth(new Date(2028, 1, 10))).toBe(29);
  });

  it('crosses month boundaries', () => {
    expect(schoolWeek(new Date(2026, 10, 1)).map(toIsoDate)[0]).toBe('2026-11-02');
    expect(schoolWeek(new Date(2026, 9, 31)).map(toIsoDate)[0]).toBe('2026-10-26');
  });
});
