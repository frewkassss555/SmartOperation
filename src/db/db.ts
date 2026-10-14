import Dexie, { type EntityTable } from 'dexie';
import {
  DEFAULT_SETTINGS,
  DEFAULT_WATCH,
  type ChartCache,
  type Grade,
  type Lesson,
  type Note,
  type Quote,
  type Settings,
  type Subject,
  type Task,
  type Txn,
  type Watch,
} from './types';

/** Bump together with a new `this.version(n)` block below; also written into exports. */
export const SCHEMA_VERSION = 2;

export class TrackerDb extends Dexie {
  subjects!: EntityTable<Subject, 'id'>;
  grades!: EntityTable<Grade, 'id'>;
  txns!: EntityTable<Txn, 'id'>;
  lessons!: EntityTable<Lesson, 'id'>;
  notes!: EntityTable<Note, 'id'>;
  watch!: EntityTable<Watch, 'coinId'>;
  tasks!: EntityTable<Task, 'id'>;
  settings!: EntityTable<Settings, 'id'>;
  quotes!: EntityTable<Quote, 'coinId'>;
  charts!: EntityTable<ChartCache, 'key'>;

  constructor(name = 'tracker') {
    super(name);
    // Only indexed fields are listed. Versions are kept so existing databases upgrade step by step.
    this.version(1).stores({
      subjects: 'id',
      grades: 'id, subjectId, date',
      txns: 'id, date, category, seriesId',
      lessons: 'id, day, subjectId',
      notes: 'id, updatedAt, tag, subjectId',
      watch: 'coinId, order',
      tasks: 'id, due, subjectId',
      settings: 'id',
    });

    // v2: quote and chart caches; default coins get their symbol and name.
    this.version(2)
      .stores({ quotes: 'coinId', charts: 'key, coinId' })
      .upgrade(async (tx) => {
        for (const coin of DEFAULT_WATCH) {
          await tx.table('watch').where('coinId').equals(coin.coinId).modify({ symbol: coin.symbol, name: coin.name });
        }
      });

    this.on('populate', (tx) => {
      void tx.table('settings').add(DEFAULT_SETTINGS);
      void tx.table('watch').bulkAdd(DEFAULT_WATCH);
    });
  }
}

export const db = new TrackerDb();

/** User data: exported, imported and wiped together. */
export const TABLES = ['subjects', 'grades', 'txns', 'lessons', 'notes', 'watch', 'tasks', 'settings'] as const;
export type TableName = (typeof TABLES)[number];

/** Network caches: rebuilt from the API, so not exported. */
export const CACHE_TABLES = ['quotes', 'charts'] as const;

export const newId = () => crypto.randomUUID();
