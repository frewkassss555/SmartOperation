import { useState } from 'react';
import { useToday } from '../../app/hooks';
import { Button } from '../../design';
import type { Subject, Task } from '../../db/types';
import { formatDayMonth } from '../../lib/date';
import { daysUntil, deadlineLabel, sortTasks } from '../../lib/tasks';
import { setTaskDone, useTasks } from './data';
import styles from './Deadlines.module.css';
import { TaskDialog } from './TaskDialog';

/** Deadlines with a day countdown; overdue ones are marked red with a label. */
export function DeadlinesBlock({ subjects }: { subjects: readonly Subject[] }) {
  const today = useToday();
  const tasks = useTasks();
  const [editor, setEditor] = useState<{ task?: Task | undefined } | null>(null);
  const [showDone, setShowDone] = useState(false);

  const sorted = sortTasks(tasks ?? []);
  const open = sorted.filter((t) => !t.done);
  const done = sorted.filter((t) => t.done);
  const subjectName = (id: string | undefined) => subjects.find((s) => s.id === id)?.name;

  const row = (task: Task) => {
    const days = daysUntil(task.due, today);
    const overdue = !task.done && days < 0;
    return (
      <li key={task.id} className={overdue ? `${styles.task} ${styles.overdue}` : styles.task}>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={task.done}
            onChange={(e) => setTaskDone(task, e.target.checked)}
            aria-label={`Выполнено: ${task.title}`}
          />
        </label>
        <button type="button" className={styles.body} onClick={() => setEditor({ task })}>
          <span className={task.done ? `${styles.title} ${styles.doneTitle}` : styles.title}>{task.title}</span>
          <span className={styles.meta}>
            {formatDayMonth(task.due)}
            {subjectName(task.subjectId) && ` · ${subjectName(task.subjectId)}`}
          </span>
        </button>
        {!task.done && <span className={styles.countdown}>{deadlineLabel(days)}</span>}
      </li>
    );
  };

  return (
    <section className={styles.block} aria-labelledby="deadlines-title">
      <div className={styles.head}>
        <h2 className={styles.heading} id="deadlines-title">
          Дедлайны
        </h2>
        <Button variant="secondary" onClick={() => setEditor({})}>
          Добавить +
        </Button>
      </div>

      {tasks !== undefined && open.length === 0 && (
        <p className={styles.muted}>Открытых дедлайнов нет. Добавьте реферат, контрольную или проект — здесь будет отсчёт дней.</p>
      )}
      {open.length > 0 && <ul className={`${styles.list} appear`}>{open.map(row)}</ul>}

      {done.length > 0 && (
        <>
          <button type="button" className={styles.toggle} aria-expanded={showDone} onClick={() => setShowDone(!showDone)}>
            <span className="label">Выполнено · {done.length}</span>
            <span className="label">{showDone ? 'Скрыть' : 'Показать'}</span>
          </button>
          {showDone && <ul className={`${styles.list} appear`}>{done.map(row)}</ul>}
        </>
      )}

      <TaskDialog open={editor !== null} onClose={() => setEditor(null)} task={editor?.task} subjects={subjects} />
    </section>
  );
}
