// Parser for the quick-entry line (Ctrl+K):
//   оценка информатика 9      → grade 9 for the subject that matches "информатика"
//   расход 6.4 транспорт обед → expense 6,40 in "Транспорт" with the note "обед"
//   доход 50 стипендия        → income 50,00, category "Другое", note "стипендия"
//   заметка идея для проекта  → a note titled "идея для проекта"

import { parseMoney } from './money';

type Named = { id: string; name: string };

export type Command =
  | { kind: 'empty' }
  | { kind: 'error'; message: string }
  | { kind: 'grade'; subject: Named; value: number }
  | { kind: 'txn'; txnKind: 'in' | 'out'; amount: number; category: string; note: string | undefined }
  | { kind: 'note'; title: string };

type Context = { subjects: readonly Named[]; categories: readonly string[]; scale: number };

const KEYWORDS: Record<string, 'grade' | 'out' | 'in' | 'note'> = {
  оценка: 'grade',
  оц: 'grade',
  расход: 'out',
  трата: 'out',
  доход: 'in',
  заметка: 'note',
  зам: 'note',
};

export const COMMAND_EXAMPLES = ['оценка информатика 9', 'расход 6.4 транспорт', 'доход 50 стипендия', 'заметка идея для проекта'];

const lower = (s: string) => s.toLocaleLowerCase('ru').replace(/ё/g, 'е');

/** Subjects whose name starts with the query, or failing that contains it. */
function matchSubjects(query: string, subjects: readonly Named[]): Named[] {
  const q = lower(query);
  const exact = subjects.filter((s) => lower(s.name) === q);
  if (exact.length) return exact;
  const prefix = subjects.filter((s) => lower(s.name).startsWith(q) || lower(s.name).split(/\s+/).some((w) => w.startsWith(q)));
  return prefix.length ? prefix : subjects.filter((s) => lower(s.name).includes(q));
}

export function parseCommand(input: string, ctx: Context): Command {
  const words = input.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return { kind: 'empty' };
  const action = KEYWORDS[lower(words[0]!)];
  const rest = words.slice(1);
  if (!action) return { kind: 'error', message: `Начните с команды: ${COMMAND_EXAMPLES.join(' · ')}` };

  if (action === 'note') {
    const title = rest.join(' ');
    return title ? { kind: 'note', title } : { kind: 'error', message: 'Напишите текст заметки' };
  }

  if (action === 'grade') {
    const last = rest.at(-1);
    const value = last !== undefined && /^\d{1,2}$/.test(last) ? Number(last) : NaN;
    if (!Number.isInteger(value)) return { kind: 'error', message: 'В конце нужна оценка: «оценка физика 8»' };
    if (value < 1 || value > ctx.scale) return { kind: 'error', message: `Оценка от 1 до ${ctx.scale}` };
    const query = rest.slice(0, -1).join(' ');
    if (!query) return { kind: 'error', message: 'Укажите предмет: «оценка физика 8»' };
    const found = matchSubjects(query, ctx.subjects);
    if (found.length === 0) return { kind: 'error', message: `Нет предмета «${query}»` };
    if (found.length > 1) return { kind: 'error', message: `Уточните: ${found.map((s) => s.name).join(', ')}` };
    return { kind: 'grade', subject: found[0]!, value };
  }

  // Expense or income: amount, then an optional category, then an optional note.
  const amount = rest[0] === undefined ? null : parseMoney(rest[0]);
  if (amount === null || amount === 0) return { kind: 'error', message: 'После команды нужна сумма: «расход 6.4 транспорт»' };
  const tail = rest.slice(1);
  const first = tail[0];
  const category = first === undefined ? undefined : ctx.categories.find((c) => lower(c).startsWith(lower(first)));
  const noteWords = category ? tail.slice(1) : tail;
  const fallback = ctx.categories.includes('Другое') ? 'Другое' : (ctx.categories.at(-1) ?? 'Другое');
  return {
    kind: 'txn',
    txnKind: action,
    amount,
    category: category ?? fallback,
    note: noteWords.length ? noteWords.join(' ') : undefined,
  };
}
