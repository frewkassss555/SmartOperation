import { describe, expect, it } from 'vitest';
import { filterNotes, isBlankNote, noteTags } from './notes';

const note = (title: string, body: string, updatedAt: number, pinned = false, tag?: string) => ({
  title,
  body,
  updatedAt,
  pinned,
  tag,
});

const notes = [
  note('Физика', 'Формулы движения', 1),
  note('Идея', 'Проект по информатике', 3, false, 'идеи'),
  note('Список', 'Купить тетради', 2, true, 'дела'),
];

describe('filterNotes', () => {
  it('puts pinned first, then newest', () => {
    expect(filterNotes(notes, '', null).map((n) => n.title)).toEqual(['Список', 'Идея', 'Физика']);
  });

  it('searches title and body case-insensitively', () => {
    expect(filterNotes(notes, 'ИНФОРМ', null).map((n) => n.title)).toEqual(['Идея']);
    expect(filterNotes(notes, 'физ', null).map((n) => n.title)).toEqual(['Физика']);
  });

  it('filters by tag', () => {
    expect(filterNotes(notes, '', 'дела').map((n) => n.title)).toEqual(['Список']);
  });

  it('lists tags and detects blank notes', () => {
    expect(noteTags(notes)).toEqual(['дела', 'идеи']);
    expect(isBlankNote({ title: ' ', body: '\n' })).toBe(true);
    expect(isBlankNote({ title: '', body: 'x' })).toBe(false);
  });
});
