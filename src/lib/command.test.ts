import { describe, expect, it } from 'vitest';
import { parseCommand } from './command';

const ctx = {
  subjects: [
    { id: 'inf', name: 'Информатика' },
    { id: 'phys', name: 'Физика' },
    { id: 'rus', name: 'Русский язык' },
    { id: 'lit', name: 'Литература' },
    { id: 'lin', name: 'Линейная алгебра' },
  ],
  categories: ['Еда', 'Транспорт', 'Учёба', 'Досуг', 'Подписки', 'Другое'],
  scale: 10,
};

describe('quick entry', () => {
  it('adds a grade by subject prefix', () => {
    expect(parseCommand('оценка информатика 9', ctx)).toEqual({ kind: 'grade', subject: ctx.subjects[0], value: 9 });
    expect(parseCommand('Оценка физ 7', ctx)).toMatchObject({ subject: { id: 'phys' }, value: 7 });
    expect(parseCommand('оц русский язык 8', ctx)).toMatchObject({ subject: { id: 'rus' } });
    expect(parseCommand('оценка язык 8', ctx)).toMatchObject({ subject: { id: 'rus' } });
  });

  it('asks to clarify ambiguous or unknown subjects and bad values', () => {
    expect(parseCommand('оценка ли 8', ctx)).toMatchObject({ kind: 'error', message: expect.stringContaining('Уточните') });
    expect(parseCommand('оценка химия 8', ctx)).toMatchObject({ kind: 'error', message: 'Нет предмета «химия»' });
    expect(parseCommand('оценка физика 11', ctx)).toMatchObject({ kind: 'error', message: 'Оценка от 1 до 10' });
    expect(parseCommand('оценка физика', ctx)).toMatchObject({ kind: 'error' });
  });

  it('records expenses with category and note', () => {
    expect(parseCommand('расход 6.4 транспорт', ctx)).toEqual({ kind: 'txn', txnKind: 'out', amount: 640, category: 'Транспорт', note: undefined });
    expect(parseCommand('расход 12,5 еда обед в столовой', ctx)).toMatchObject({ amount: 1250, category: 'Еда', note: 'обед в столовой' });
    expect(parseCommand('расход 3 учеба', ctx)).toMatchObject({ category: 'Учёба' });
  });

  it('falls back to "Другое" when no category matches', () => {
    expect(parseCommand('доход 50 стипендия', ctx)).toEqual({ kind: 'txn', txnKind: 'in', amount: 5000, category: 'Другое', note: 'стипендия' });
    expect(parseCommand('расход сто', ctx)).toMatchObject({ kind: 'error' });
  });

  it('creates notes', () => {
    expect(parseCommand('заметка идея для проекта', ctx)).toEqual({ kind: 'note', title: 'идея для проекта' });
    expect(parseCommand('заметка', ctx)).toMatchObject({ kind: 'error' });
  });

  it('rejects unknown commands and handles empty input', () => {
    expect(parseCommand('', ctx)).toEqual({ kind: 'empty' });
    expect(parseCommand('купить хлеб', ctx)).toMatchObject({ kind: 'error' });
  });
});
