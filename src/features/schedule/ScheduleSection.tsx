import { useState } from 'react';
import { useNow } from '../../app/hooks';
import { useUi, type PlanTab } from '../../app/uiStore';
import { Button, Columns, Dialog, EmptyState, Segmented } from '../../design';
import { useSettings } from '../../db/settings';
import type { Lesson } from '../../db/types';
import { defaultSchoolDay, schoolWeek, SCHOOL_DAYS, toIsoDate } from '../../lib/date';
import { formatDuration, lessonsForDay, lessonStatus, parityOf, type Parity } from '../../lib/schedule';
import { FocusBlock } from '../focus/FocusBlock';
import { DeadlinesBlock } from '../tasks/DeadlinesBlock';
import type { SectionProps } from '../types';
import { copyDay, useLessons, useSubjects } from './data';
import { LessonDialog } from './LessonDialog';
import styles from './Schedule.module.css';

const DAY_ACC = ['понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу'] as const;
const DAY_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'] as const;

const PLAN_TABS = [
  { value: 'lessons', label: 'Уроки' },
  { value: 'deadlines', label: 'Дедлайны' },
  { value: 'focus', label: 'Фокус' },
] as const satisfies readonly { value: PlanTab; label: string }[];

const PARITIES = [
  { value: 'even', label: 'Чётная' },
  { value: 'odd', label: 'Нечётная' },
] as const satisfies readonly { value: Parity; label: string }[];

export function ScheduleSection({ wide }: SectionProps) {
  const now = useNow();
  const settings = useSettings();
  const lessons = useLessons();
  const subjects = useSubjects();
  const storedDay = useUi((s) => s.scheduleDay);
  const setDay = useUi((s) => s.setScheduleDay);
  const storedParity = useUi((s) => s.scheduleParity);
  const setParity = useUi((s) => s.setScheduleParity);
  const planTab = useUi((s) => s.planTab);
  const setPlanTab = useUi((s) => s.setPlanTab);
  const [editor, setEditor] = useState<{ lesson?: Lesson | undefined } | null>(null);
  const [copyOpen, setCopyOpen] = useState(false);

  const selected = storedDay ?? defaultSchoolDay(now);
  const week = schoolWeek(now);
  const todayIso = toIsoDate(now);
  const selectedDate = week[selected]!;
  const currentParity = parityOf(selectedDate);
  const parity = settings.weekParity ? (storedParity ?? currentParity) : null;

  const dayLessons = lessonsForDay(lessons ?? [], selected, parity);
  const isToday = toIsoDate(selectedDate) === todayIso && (parity === null || parity === currentParity);
  const status = isToday ? lessonStatus(dayLessons, now.getHours() * 60 + now.getMinutes()) : null;
  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? 'Без предмета';

  const lessonsBlock = (
    <>
      <div className={styles.strip} role="group" aria-label="День недели">
        {week.map((date, i) => {
          const isSelected = i === selected;
          return (
            <button
              key={toIsoDate(date)}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${DAY_FULL[i]}, ${date.getDate()}${toIsoDate(date) === todayIso ? ', сегодня' : ''}`}
              className={isSelected ? `${styles.day} ${styles.selected}` : styles.day}
              onClick={() => setDay(i)}
            >
              <span className={styles.dayName}>{SCHOOL_DAYS[i]}</span>
              <span className={styles.dayNum}>{date.getDate()}</span>
              {toIsoDate(date) === todayIso && <span className={styles.todayMark} aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      {parity !== null && (
        <div className={styles.parity}>
          <span className="label">Неделя · сейчас {currentParity === 'even' ? 'чётная' : 'нечётная'}</span>
          <Segmented label="Чётность недели" options={PARITIES} value={parity} onChange={setParity} />
        </div>
      )}

      {lessons !== undefined && dayLessons.length === 0 ? (
        <EmptyState
          title={`На ${DAY_ACC[selected]} уроков нет`}
          action={
            <Button variant="primary" onClick={() => setEditor({})}>
              Добавить урок +
            </Button>
          }
        >
          Заполните неделю один раз: текущий урок и время до перемены будут видны здесь.
        </EmptyState>
      ) : (
        <ol className={`${styles.lessons} appear`} key={`${selected}-${parity}`} aria-label={`Уроки, ${DAY_FULL[selected]}`}>
          {dayLessons.map((lesson, i) => {
            const current = status?.index === i;
            return (
              <li key={lesson.id}>
                <button
                  type="button"
                  className={current ? `${styles.lesson} ${styles.current}` : styles.lesson}
                  onClick={() => setEditor({ lesson })}
                  aria-current={current && status?.kind === 'lesson' ? 'time' : undefined}
                >
                  <span className={styles.index}>{String(i + 1).padStart(2, '0')}</span>
                  <span className={styles.time}>
                    {lesson.start}
                    <span className={styles.timeEnd}>{lesson.end}</span>
                  </span>
                  <span className={styles.lessonMain}>
                    <span className={styles.subject}>{subjectName(lesson.subjectId)}</span>
                    {current && status && (
                      <span className={styles.countdown}>
                        {status.kind === 'lesson'
                          ? `До конца урока ${formatDuration(status.minutesLeft)}`
                          : `Перемена · до урока ${formatDuration(status.minutesLeft)}`}
                      </span>
                    )}
                    {lesson.note && <span className={styles.lessonNote}>{lesson.note}</span>}
                    {parity !== null && lesson.week && (
                      <span className={styles.lessonNote}>{lesson.week === 'even' ? 'Чётные недели' : 'Нечётные недели'}</span>
                    )}
                  </span>
                  {lesson.room && <span className={styles.room}>{lesson.room}</span>}
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {dayLessons.length > 0 && (
        <div className={styles.actions}>
          <Button variant="primary" onClick={() => setEditor({})}>
            Добавить урок +
          </Button>
          <Button variant="secondary" onClick={() => setCopyOpen(true)}>
            Копировать день
          </Button>
        </div>
      )}
    </>
  );

  return (
    <div className={styles.section}>
      {wide ? (
        <Columns
          wide
          main={lessonsBlock}
          side={
            <>
              <DeadlinesBlock subjects={subjects} />
              <FocusBlock subjects={subjects} />
            </>
          }
        />
      ) : (
        <>
          <Segmented label="Раздел плана" options={PLAN_TABS} value={planTab} onChange={setPlanTab} block />
          <div key={planTab} className={styles.tabBody}>
            {planTab === 'lessons' ? lessonsBlock : planTab === 'deadlines' ? <DeadlinesBlock subjects={subjects} /> : <FocusBlock subjects={subjects} />}
          </div>
        </>
      )}

      <LessonDialog
        open={editor !== null}
        onClose={() => setEditor(null)}
        day={selected}
        dayLabel={DAY_FULL[selected]!}
        lesson={editor?.lesson}
        subjects={subjects}
        parityOn={settings.weekParity}
        previousEnd={dayLessons.at(-1)?.end}
      />

      <Dialog open={copyOpen} onClose={() => setCopyOpen(false)} kicker={DAY_FULL[selected]} title="Копировать в">
        <p className={styles.muted}>Уроки выбранного дня заменят уроки того дня, куда вы копируете. Отменить можно 5 секунд.</p>
        <div className={styles.copyGrid}>
          {SCHOOL_DAYS.map((label, i) =>
            i === selected ? null : (
              <Button
                key={label}
                variant="secondary"
                onClick={async () => {
                  setCopyOpen(false);
                  await copyDay(selected, i, parity, DAY_ACC[i]!);
                }}
              >
                {DAY_FULL[i]}
              </Button>
            ),
          )}
        </div>
      </Dialog>
    </div>
  );
}
