import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { notify, removeWithUndo } from '../../app/undo';
import { db, newId } from '../../db/db';
import { requestPersistenceOnce } from '../../db/settings';
import type { Grade, Subject } from '../../db/types';
import { toIsoDate } from '../../lib/date';
import { bestSubject, overallAverage, weightedAverage } from '../../lib/grades';

export type SubjectStats = { subject: Subject; grades: Grade[]; average: number | null };

const byName = (a: Subject, b: Subject) => a.name.localeCompare(b.name, 'ru');

/** Live subjects and grades with derived averages. `loading` is true until both queries resolve. */
export function useGradesData() {
  const subjects = useLiveQuery(() => db.subjects.toArray(), []);
  const grades = useLiveQuery(() => db.grades.toArray(), []);

  return useMemo(() => {
    const allSubjects = [...(subjects ?? [])].sort(byName);
    const gradesBySubject = new Map<string, Grade[]>();
    for (const g of [...(grades ?? [])].sort((a, b) => a.date.localeCompare(b.date))) {
      const list = gradesBySubject.get(g.subjectId);
      if (list) list.push(g);
      else gradesBySubject.set(g.subjectId, [g]);
    }
    const gradesOf = (id: string) => gradesBySubject.get(id) ?? [];
    const stats = (s: Subject): SubjectStats => ({ subject: s, grades: gradesOf(s.id), average: weightedAverage(gradesOf(s.id)) });

    const active = allSubjects.filter((s) => !s.archived);
    return {
      loading: subjects === undefined || grades === undefined,
      subjects: allSubjects,
      active: active.map(stats),
      archived: allSubjects.filter((s) => s.archived).map(stats),
      overall: overallAverage(active.map((s) => gradesOf(s.id))),
      best: bestSubject(active, gradesOf),
      count: active.reduce((n, s) => n + gradesOf(s.id).length, 0),
      gradesOf,
    };
  }, [subjects, grades]);
}

export async function addSubject(name: string): Promise<string> {
  const id = newId();
  await db.subjects.add({ id, name: name.trim(), archived: false });
  void requestPersistenceOnce();
  return id;
}

export async function renameSubject(id: string, name: string) {
  await db.subjects.update(id, { name: name.trim() });
}

export async function setArchived(subject: Subject, archived: boolean) {
  await db.subjects.update(subject.id, { archived });
  notify(archived ? `«${subject.name}» в архиве` : `«${subject.name}» возвращён`, () =>
    db.subjects.update(subject.id, { archived: !archived }).then(() => undefined),
  );
}

export async function deleteSubject(subject: Subject) {
  const gradeIds = (await db.grades.where('subjectId').equals(subject.id).primaryKeys()) as string[];
  await removeWithUndo(`Удалён предмет «${subject.name}»`, [
    { table: 'subjects', ids: [subject.id] },
    { table: 'grades', ids: gradeIds },
  ]);
}

export type GradeInput = Omit<Grade, 'id'>;

/** One-tap grade with today's date and weight 1. */
export async function quickAddGrade(subject: Subject, value: number) {
  const id = newId();
  await db.grades.add({ id, subjectId: subject.id, value, weight: 1, date: toIsoDate(new Date()) });
  void requestPersistenceOnce();
  notify(`Оценка ${value} · ${subject.name}`, () => db.grades.delete(id));
}

export async function saveGrade(input: GradeInput, id?: string) {
  if (id) await db.grades.put({ ...input, id });
  else await db.grades.add({ ...input, id: newId() });
  void requestPersistenceOnce();
}

export async function deleteGrade(grade: Grade) {
  await removeWithUndo(`Удалена оценка ${grade.value}`, [{ table: 'grades', ids: [grade.id] }]);
}
