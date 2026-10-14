import { describe, expect, it } from 'vitest';
import {
  balance,
  expensesByDay,
  formatMinor,
  formatMoney,
  formatMoneyShort,
  minorToInput,
  parseMoney,
  parseSignedMoney,
  totals,
} from './money';

describe('parseMoney', () => {
  it('accepts dots, commas and spaces', () => {
    expect(parseMoney('6.4')).toBe(640);
    expect(parseMoney('6,40')).toBe(640);
    expect(parseMoney('1 200')).toBe(120000);
    expect(parseMoney('0.05')).toBe(5);
    expect(parseMoney('12.')).toBe(1200);
  });

  it('rejects garbage and more than two decimals', () => {
    expect(parseMoney('')).toBeNull();
    expect(parseMoney('abc')).toBeNull();
    expect(parseMoney('1.234')).toBeNull();
    expect(parseMoney('-5')).toBeNull();
  });

  it('avoids float drift', () => {
    expect(parseMoney('0.1')! + parseMoney('0.2')!).toBe(30);
  });

  it('parses a signed start balance', () => {
    expect(parseSignedMoney('-12,5')).toBe(-1250);
    expect(parseSignedMoney('−3')).toBe(-300);
    expect(parseSignedMoney('0')).toBe(0);
    expect(parseSignedMoney('x')).toBeNull();
  });
});

describe('formatting', () => {
  it('formats minor units', () => {
    expect(formatMinor(123456)).toBe('1 234,56');
    expect(formatMinor(5)).toBe('0,05');
    expect(formatMinor(-640)).toBe('−6,40');
    expect(formatMoney(640, 'Br')).toBe('6,40 Br');
    expect(formatMoneyShort(123456)).toBe('1 235');
    expect(minorToInput(640)).toBe('6,40');
    expect(minorToInput(-1250)).toBe('-12,50');
  });
});

describe('balance', () => {
  const txns = [
    { kind: 'in' as const, amount: 10000, date: '2026-10-12' },
    { kind: 'out' as const, amount: 640, date: '2026-10-12' },
    { kind: 'out' as const, amount: 1500, date: '2026-10-14' },
  ];

  it('sums income and expenses', () => {
    expect(totals(txns)).toEqual({ income: 10000, expense: 2140 });
  });

  it('adds the start balance', () => {
    expect(balance(5000, txns)).toBe(12860);
    expect(balance(0, [])).toBe(0);
  });

  it('groups expenses by day', () => {
    expect(expensesByDay(txns, ['2026-10-12', '2026-10-13', '2026-10-14'])).toEqual([640, 0, 1500]);
  });
});
