import { useNow, useToday } from '../../app/hooks';
import { Button, SelectField } from '../../design';
import type { Subject } from '../../db/types';
import { formatDayMonth } from '../../lib/date';
import { activityGrid, BREAK_MIN, FOCUS_MIN, formatTimer, weekBySubject, weekMinutes } from '../../lib/focus';
import styles from './Focus.module.css';
import { pauseTimer, resumeTimer, setFocusSubject, startFocus, stopTimer, timeLeft, useFocusSessions, useTimer } from './timer';

const DAY_ROWS = ['ПН', '', 'СР', '', 'ПТ', '', 'ВС'];

/** Focus timer (25/5), minutes this week and a 12-week activity grid. */
export function FocusBlock({ subjects }: { subjects: readonly Subject[] }) {
  useNow(1000);
  const today = useToday();
  const timer = useTimer();
  const sessions = useFocusSessions() ?? [];

  const left = timeLeft(timer);
  const paused = timer.phase !== 'idle' && timer.endsAt === null;
  const week = weekMinutes(sessions, today);
  const bySubject = weekBySubject(sessions, today).slice(0, 3);
  const grid = activityGrid(sessions, today);
  const subjectName = (id: string) => (id ? (subjects.find((s) => s.id === id)?.name ?? 'Предмет удалён') : 'Без предмета');
  const options = [
    { value: '', label: 'Без предмета' },
    ...subjects.filter((s) => !s.archived).map((s) => ({ value: s.id, label: s.name })),
  ];

  return (
    <section className={styles.block} aria-labelledby="focus-title">
      <h2 className={styles.heading} id="focus-title">
        Фокус
      </h2>

      <div className={styles.timer} data-phase={timer.phase}>
        <span className="label">
          {timer.phase === 'focus' ? `Фокус · ${FOCUS_MIN} мин` : timer.phase === 'break' ? `Перерыв · ${BREAK_MIN} мин` : 'Готов к старту'}
          {paused && ' · пауза'}
        </span>
        <span className={styles.clock} role="timer" aria-live="off">
          {formatTimer(timer.phase === 'idle' ? FOCUS_MIN * 60_000 : left)}
        </span>
        <div className={styles.controls}>
          {timer.phase === 'idle' ? (
            <Button variant="primary" onClick={startFocus}>
              Старт {FOCUS_MIN} мин
            </Button>
          ) : paused ? (
            <Button variant="primary" onClick={resumeTimer}>
              Продолжить
            </Button>
          ) : (
            <Button variant="secondary" onClick={pauseTimer}>
              Пауза
            </Button>
          )}
          {timer.phase !== 'idle' && (
            <Button variant="ghost" onClick={() => void stopTimer()}>
              Стоп
            </Button>
          )}
        </div>
      </div>

      <SelectField
        label="Предмет"
        options={options}
        value={timer.subjectId ?? ''}
        onChange={(e) => setFocusSubject(e.target.value || undefined)}
        disabled={timer.phase === 'focus'}
        hint={timer.phase === 'focus' ? 'Предмет меняется между интервалами' : undefined}
      />

      <div className={styles.week}>
        <div>
          <span className="label">За неделю</span>
          <p className={styles.weekValue}>{week} мин</p>
        </div>
        {bySubject.length > 0 && (
          <ul className={styles.bySubject}>
            {bySubject.map((s) => (
              <li key={s.subjectId}>
                <span>{subjectName(s.subjectId)}</span>
                <span className={styles.mono}>{s.minutes}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <span className="label">Активность · 12 недель</span>
        <div className={styles.heat} role="img" aria-label={`Минуты фокуса за 12 недель, всего ${grid.flat().reduce((n, c) => n + c.minutes, 0)}`}>
          <div className={styles.days} aria-hidden="true">
            {DAY_ROWS.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          {grid.map((weekCells) => (
            <div key={weekCells[0]!.date} className={styles.column}>
              {weekCells.map((cell) => (
                <span
                  key={cell.date}
                  className={cell.future ? `${styles.cell} ${styles.future}` : `${styles.cell} ${styles[`l${cell.level}`]}`}
                  title={cell.future ? undefined : `${formatDayMonth(cell.date)}: ${cell.minutes} мин`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className={styles.legend} aria-hidden="true">
          <span className="label">Меньше</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <span key={l} className={`${styles.cell} ${styles[`l${l}`]}`} />
          ))}
          <span className="label">Больше</span>
        </div>
      </div>
    </section>
  );
}
