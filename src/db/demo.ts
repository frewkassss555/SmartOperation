import { addDays, mondayIndex, toIsoDate } from '../lib/date';
import type { GradeScale } from '../lib/grades';
import { db, newId } from './db';
import { applyRecurring } from './recurring';
import { requestPersistenceOnce, updateSettings } from './settings';
import { DEFAULT_SETTINGS, type FocusSession, type Grade, type Lesson, type Note, type Subject, type Task, type Txn } from './types';

// Deterministic demo set, dated relative to today. Values are written on a 10-point scale
// and converted to the current grade scale.

const SUBJECTS: { name: string; grades: number[] }[] = [
  { name: 'Математика', grades: [8, 9, 7, 9, 10, 8, 9] },
  { name: 'Физика', grades: [7, 6, 8, 7, 8, 9] },
  { name: 'Информатика', grades: [10, 9, 10, 10, 9, 10] },
  { name: 'Русский язык', grades: [7, 8, 7, 6, 8] },
  { name: 'Английский язык', grades: [9, 8, 9, 9, 10] },
  { name: 'История', grades: [6, 7, 8, 7] },
];

const TIMES = [
  ['08:30', '09:15'],
  ['09:25', '10:10'],
  ['10:25', '11:10'],
  ['11:25', '12:10'],
  ['12:20', '13:05'],
] as const;

/** Subject index per lesson slot, Monday..Saturday. */
const WEEK: number[][] = [
  [0, 1, 3, 4, 5],
  [2, 0, 4, 3],
  [0, 1, 1, 5, 3],
  [4, 0, 2, 2],
  [3, 0, 1, 5, 4],
  [2, 4, 0],
];
const ROOMS = ['214', '305', '118', '221', '402', '107'];

const toScale = (value: number, scale: GradeScale) => Math.min(scale, Math.max(1, Math.round((value / 10) * scale)));

export async function addDemoData(today = new Date()): Promise<void> {
  const settings = (await db.settings.get('app')) ?? DEFAULT_SETTINGS;
  const iso = (offset: number) => toIsoDate(addDays(today, offset));

  const subjects: Subject[] = SUBJECTS.map((s) => ({ id: newId(), name: s.name, archived: false }));

  const grades: Grade[] = SUBJECTS.flatMap((s, si) =>
    s.grades.map((value, gi) => {
      // Spread grades over the past five weeks, newest last, weekdays only.
      let offset = -((s.grades.length - 1 - gi) * 5 + si);
      const date = addDays(today, offset);
      if (date.getDay() === 0) offset -= 2;
      return {
        id: newId(),
        subjectId: subjects[si]!.id,
        value: toScale(value, settings.gradeScale),
        weight: gi % 4 === 3 ? 3 : gi % 3 === 2 ? 2 : 1,
        date: iso(offset),
        comment: gi % 4 === 3 ? 'Контрольная' : undefined,
      };
    }),
  );

  const lessons: Lesson[] = WEEK.flatMap((slots, day) =>
    slots.map((subjectIndex, slot) => ({
      id: newId(),
      day,
      start: TIMES[slot]![0],
      end: TIMES[slot]![1],
      subjectId: subjects[subjectIndex]!.id,
      room: ROOMS[subjectIndex],
    })),
  );

  const expense = (offset: number, amount: number, category: string, note: string): Txn => ({
    id: newId(),
    kind: 'out',
    amount,
    category,
    date: iso(offset),
    note,
  });
  const txns: Txn[] = [
    { id: newId(), kind: 'in', amount: 15000, category: 'Другое', date: iso(-mondayIndex(today) - 7), note: 'Стипендия' },
    { id: newId(), kind: 'in', amount: 4000, category: 'Другое', date: iso(-3), note: 'Подработка' },
    { id: newId(), kind: 'out', amount: 999, category: 'Подписки', date: iso(-40), note: 'Музыка', repeat: 'month' },
    expense(0, 640, 'Транспорт', 'Проездной на день'),
    expense(0, 450, 'Еда', 'Обед'),
    expense(-1, 1290, 'Еда', 'Продукты'),
    expense(-2, 320, 'Транспорт', 'Метро'),
    expense(-2, 2500, 'Учёба', 'Тетради и ручки'),
    expense(-4, 1800, 'Досуг', 'Кино'),
    expense(-5, 520, 'Еда', 'Кофе с собой'),
    expense(-6, 960, 'Еда', 'Обед'),
    expense(-8, 3400, 'Учёба', 'Учебник по физике'),
    expense(-9, 640, 'Транспорт', 'Проездной на день'),
    expense(-11, 2200, 'Досуг', 'Боулинг'),
    expense(-13, 780, 'Еда', 'Пицца'),
  ];

  const now = Date.now();
  const notes: Note[] = [
    {
      id: newId(),
      title: 'Список к контрольной',
      body: 'Производные: таблица и правила.\nКвадратные уравнения.\nРешить варианты 3 и 4.',
      tag: 'учёба',
      pinned: true,
      subjectId: subjects[0]!.id,
      updatedAt: now - 3_600_000,
    },
    {
      id: newId(),
      title: 'Идея для проекта',
      body: 'Сделать бота, который напоминает о домашке. Начать с расписания.',
      tag: 'идеи',
      pinned: false,
      subjectId: subjects[2]!.id,
      updatedAt: now - 86_400_000,
    },
    {
      id: newId(),
      title: 'Купить',
      body: 'Тетради в клетку — 3 шт.\nКалькулятор.\nПапка для черчения.',
      tag: 'дела',
      pinned: false,
      updatedAt: now - 2 * 86_400_000,
    },
    {
      id: newId(),
      title: 'Английский: слова',
      body: 'thorough, though, through, thought — разобрать произношение.',
      tag: 'учёба',
      pinned: false,
      subjectId: subjects[4]!.id,
      updatedAt: now - 4 * 86_400_000,
    },
  ];

  const tasks: Task[] = [
    { id: newId(), title: 'Конспект параграфа 12', due: iso(-2), subjectId: subjects[5]!.id, done: false },
    { id: newId(), title: 'Контрольная: производные', due: iso(1), subjectId: subjects[0]!.id, done: false },
    { id: newId(), title: 'Реферат по физике', due: iso(5), subjectId: subjects[1]!.id, done: false },
    { id: newId(), title: 'Проект: бот-напоминалка', due: iso(18), subjectId: subjects[2]!.id, done: false },
    { id: newId(), title: 'Сдать лабораторную', due: iso(-1), subjectId: subjects[1]!.id, done: true, doneAt: now - 86_400_000 },
  ];

  // 12 weeks of focus: a repeating pattern of 0–4 intervals a day, busier closer to today.
  const PATTERN = [1, 0, 2, 1, 3, 0, 0, 2, 1, 0, 4, 2, 0, 1];
  const focus: FocusSession[] = [];
  for (let back = 83; back >= 0; back--) {
    const count = Math.max(0, PATTERN[back % PATTERN.length]! - (back > 56 ? 1 : 0));
    for (let k = 0; k < count; k++) {
      focus.push({ id: newId(), subjectId: subjects[(back + k) % subjects.length]!.id, date: iso(-back), minutes: 25, endedAt: now - back * 86_400_000 });
    }
  }

  await db.transaction('rw', [db.subjects, db.grades, db.lessons, db.txns, db.notes, db.tasks, db.focus, db.watch, db.settings], async () => {
    await db.subjects.bulkAdd(subjects);
    await db.grades.bulkAdd(grades);
    await db.lessons.bulkAdd(lessons);
    await db.txns.bulkAdd(txns);
    await db.notes.bulkAdd(notes);
    await db.tasks.bulkAdd(tasks);
    await db.focus.bulkAdd(focus);
    // A small notional portfolio, unless the user already filled one.
    if (!(await db.watch.toArray()).some((w) => w.holding)) {
      await db.watch.update('bitcoin', { holding: 0.02, buyPrice: 64000 });
      await db.watch.update('ethereum', { holding: 0.5, buyPrice: 3900 });
    }
    await updateSettings({
      demo: true,
      // Keep the user's own limits and goal if they already set them.
      limits: Object.keys(settings.limits ?? {}).length ? settings.limits : { Еда: 6000, Транспорт: 1500, Досуг: 4000 },
      goal: settings.goal ?? { title: 'Наушники', target: 25000 },
    });
  });
  await applyRecurring(today);
  await requestPersistenceOnce();
}
