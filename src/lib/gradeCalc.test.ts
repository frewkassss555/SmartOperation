import { describe, expect, it } from 'vitest';
import { gradeCountWords, gradesNeeded, pluralIndex, targetPlan } from './gradeCalc';

const g = (value: number, weight = 1) => ({ value, weight });

describe('gradesNeeded', () => {
  it('counts the grades needed to reach a target', () => {
    // 7 and 8 → 7.5; two tens give (7+8+20)/4 = 8.75 ≥ 8.5, one ten gives 8.33.
    expect(gradesNeeded([g(7), g(8)], 8.5, 10)).toBe(2);
    expect(gradesNeeded([g(6), g(6), g(6)], 8, 10)).toBe(3);
  });

  it('respects weights', () => {
    expect(gradesNeeded([g(6), g(6)], 8, 10, 2)).toBe(1);
    expect(gradesNeeded([g(6, 3)], 8, 10)).toBe(3);
  });

  it('returns 0 when the target is already reached', () => {
    expect(gradesNeeded([g(9), g(10)], 9, 10)).toBe(0);
  });

  it('returns null when the grade cannot lift the average enough', () => {
    expect(gradesNeeded([g(6)], 9, 9)).toBeNull();
    expect(gradesNeeded([g(6)], 9, 8)).toBeNull();
  });

  it('handles an empty subject', () => {
    expect(gradesNeeded([], 9, 10)).toBe(1);
    expect(gradesNeeded([], 9, 9)).toBe(1);
    expect(gradesNeeded([], 9, 8)).toBeNull();
  });
});

describe('targetPlan', () => {
  it('lists options from the best grade down', () => {
    expect(targetPlan([g(7), g(8)], 8.5, 10)).toEqual([
      { value: 10, count: 2 },
      { value: 9, count: 4 },
    ]);
  });

  it('is empty when nothing is needed or nothing can help', () => {
    expect(targetPlan([g(10)], 9, 10)).toEqual([]);
    expect(targetPlan([g(5)], 10, 10)).toEqual([]);
  });
});

describe('Russian wording', () => {
  it('picks plural forms', () => {
    expect([1, 2, 5, 11, 12, 21, 22, 25].map(pluralIndex)).toEqual([0, 1, 2, 2, 2, 0, 1, 2]);
  });

  it('names counts of grades', () => {
    expect(gradeCountWords(2, 10)).toBe('две десятки');
    expect(gradeCountWords(1, 9)).toBe('одна девятка');
    expect(gradeCountWords(5, 5)).toBe('пять пятёрок');
    expect(gradeCountWords(3, 12)).toBe('три оценки 12');
    expect(gradeCountWords(14, 10)).toBe('14 десяток');
  });
});
