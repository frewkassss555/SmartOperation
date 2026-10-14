import { useNow } from '../../app/hooks';
import { useSettings } from '../../db/settings';
import { mondayIndex } from '../../lib/date';
import { formatAverage } from '../../lib/grades';
import { balance, formatMoney } from '../../lib/money';
import { lessonsForDay, lessonStatus, parityOf } from '../../lib/schedule';
import { useTxns } from '../finance/data';
import { useGradesData } from '../grades/data';
import { useLessons, useSubjects } from '../schedule/data';
import { useTasks } from '../tasks/data';
import { daysUntil, upcoming } from '../../lib/tasks';

/** Numbers shared by the desktop header strip and the phone overview screen. */
export function useOverview() {
  const now = useNow();
  const settings = useSettings();
  const grades = useGradesData();
  const txns = useTxns() ?? [];
  const lessons = useLessons() ?? [];
  const subjects = useSubjects();
  const tasks = useTasks() ?? [];

  const dayIndex = mondayIndex(now);
  const today = dayIndex === 6 ? [] : lessonsForDay(lessons, dayIndex, settings.weekParity ? parityOf(now) : null);
  const status = lessonStatus(today, now.getHours() * 60 + now.getMinutes());

  return {
    average: formatAverage(grades.overall),
    balance: formatMoney(balance(settings.startBalance, txns), settings.currency),
    lessonsToday: today.length,
    today,
    status,
    subjectName: (id: string) => subjects.find((s) => s.id === id)?.name ?? 'Без предмета',
    demo: settings.demo,
    deadlines: upcoming(tasks, 3).map((t) => ({ ...t, days: daysUntil(t.due, now) })),
  };
}
