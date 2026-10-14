import Dexie, { type EntityTable } from 'dexie';
import { DEFAULT_SETTINGS, DEFAULT_WATCH, type Grade, type Lesson, type Note, type Settings, type Subject, type Task, type Txn, type Watch } from './types';

/** Bump together with a new `this.version(n)` block below; also written into exports. */
export const SCHEMA_VERSION = 1;

export class TrackerDb extends Dexie {
  subjects!: EntityTable<Subject, 'id'>;
  grades!: EntityTable<Grade, 'id'>;
  txns!: EntityTable<Txn, 'id'>;
  lessons!: EntityTable<Lesson, 'id'>;
  notes!: EntityTable<Note, 'id'>;
  watch!: EntityTable<Watch, 'coinId'>;
  tasks!: EntityTable<Task, 'id'>;
  settings!: EntityTable<Settings, 'id'>;

  constructor(name = 'tracker') {
    super(name);
    // Only indexed fields are listed. Migrations: add `this.version(2).stores({...}).upgrade(tx => ...)`
    // below and keep version 1 intact so existing databases upgrade step by step.
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

    this.on('populate', (tx) => {
      void tx.table('settings').add(DEFAULT_SETTINGS);
      void tx.table('watch').bulkAdd(DEFAULT_WATCH);
    });
  }
}

export const db = new TrackerDb();

export const TABLES = ['subjects', 'grades', 'txns', 'lessons', 'notes', 'watch', 'tasks', 'settings'] as const;
export type TableName = (typeof TABLES)[number];

export const newId = () => crypto.randomUUID();
