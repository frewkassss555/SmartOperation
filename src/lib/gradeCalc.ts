// "Which grades do I need for an average of X?"

type Weighted = { value: number; weight: number };

/**
 * Smallest number of grades `value` (each with `weight`) that lifts the weighted average
 * to at least `target`. 0 when the target is already reached; null when `value` cannot
 * get there (a grade not above the target never lifts the average to it).
 */
export function gradesNeeded(grades: readonly Weighted[], target: number, value: number, weight = 1): number | null {
  let sum = 0;
  let weights = 0;
  for (const g of grades) {
    sum += g.value * g.weight;
    weights += g.weight;
  }
  const eps = 1e-9;
  if (weights > 0 && sum / weights >= target - eps) return 0;
  if (value <= target + eps) return weights === 0 && value >= target - eps ? 1 : null;
  return Math.max(1, Math.ceil((target * weights - sum) / (weight * (value - target)) - eps));
}

/** Options from the best grade down: up to `limit` grade values that can reach the target. */
export function targetPlan(
  grades: readonly Weighted[],
  target: number,
  scale: number,
  weight = 1,
  limit = 3,
): { value: number; count: number }[] {
  const plan: { value: number; count: number }[] = [];
  for (let value = scale; value >= 1 && plan.length < limit; value--) {
    const count = gradesNeeded(grades, target, value, weight);
    if (count === null) break;
    if (count === 0) return [];
    plan.push({ value, count });
  }
  return plan;
}

const NOUNS: Record<number, [string, string, string]> = {
  1: ['единица', 'единицы', 'единиц'],
  2: ['двойка', 'двойки', 'двоек'],
  3: ['тройка', 'тройки', 'троек'],
  4: ['четвёрка', 'четвёрки', 'четвёрок'],
  5: ['пятёрка', 'пятёрки', 'пятёрок'],
  6: ['шестёрка', 'шестёрки', 'шестёрок'],
  7: ['семёрка', 'семёрки', 'семёрок'],
  8: ['восьмёрка', 'восьмёрки', 'восьмёрок'],
  9: ['девятка', 'девятки', 'девяток'],
  10: ['десятка', 'десятки', 'десяток'],
};

const COUNTS = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять', 'десять'];

/** Russian plural form index: 0 for 1, 1 for 2–4, 2 for 5–20 and the rest. */
export function pluralIndex(n: number): 0 | 1 | 2 {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 0;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 1;
  return 2;
}

/** 2, 10 → "две десятки"; 5, 9 → "пять девяток"; 3, 12 → "три оценки 12". */
export function gradeCountWords(count: number, value: number): string {
  const amount = COUNTS[count] ?? String(count);
  const form = pluralIndex(count);
  const noun = NOUNS[value]?.[form] ?? `${['оценка', 'оценки', 'оценок'][form]} ${value}`;
  return `${amount} ${noun}`;
}
