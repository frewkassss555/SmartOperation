import type { GradeScale } from '../lib/grades';
import type { TxnKind } from '../lib/money';
import type { Repeat } from '../lib/recurring';
import type { Parity } from '../lib/schedule';

// Calendar dates are 'YYYY-MM-DD' strings; money is integer minor units (kopecks).

export type Subject = { id: string; name: string; archived: boolean };

export type Grade = {
  id: string;
  subjectId: string;
  value: number;
  /** 1..3 */
  weight: number;
  date: string;
  comment?: string | undefined;
};

export type Txn = {
  id: string;
  kind: TxnKind;
  amount: number;
  category: string;
  date: string;
  note?: string | undefined;
  /** Set on a repeating template; the template is the first occurrence. */
  repeat?: Repeat | undefined;
  /** On a template: the last generated occurrence date. */
  lastRun?: string | undefined;
  /** On a generated occurrence: id of its template. */
  seriesId?: string | undefined;
};

export type Lesson = {
  id: string;
  /** 0 = Monday … 5 = Saturday */
  day: number;
  start: string;
  end: string;
  subjectId: string;
  room?: string | undefined;
  note?: string | undefined;
  week?: Parity | undefined;
};

export type Note = {
  id: string;
  title: string;
  body: string;
  tag?: string | undefined;
  pinned: boolean;
  subjectId?: string | undefined;
  /** Epoch milliseconds: notes are sorted by exact edit time. */
  updatedAt: number;
};

export type Watch = { coinId: string; order: number };

export type Task = { id: string; title: string; due: string; subjectId?: string; done: boolean };

export type Settings = {
  id: 'app';
  gradeScale: GradeScale;
  currency: string;
  startBalance: number;
  weekParity: boolean;
  categories: string[];
  /** Demo data has been added. */
  demo: boolean;
  /** navigator.storage.persist() was already requested. */
  persistAsked: boolean;
};

export const DEFAULT_CATEGORIES = ['Еда', 'Транспорт', 'Учёба', 'Досуг', 'Подписки', 'Другое'];

export const DEFAULT_SETTINGS: Settings = {
  id: 'app',
  gradeScale: 10,
  currency: 'Br',
  startBalance: 0,
  weekParity: false,
  categories: DEFAULT_CATEGORIES,
  demo: false,
  persistAsked: false,
};

export const DEFAULT_WATCH: Watch[] = [
  { coinId: 'bitcoin', order: 0 },
  { coinId: 'ethereum', order: 1 },
  { coinId: 'solana', order: 2 },
];
