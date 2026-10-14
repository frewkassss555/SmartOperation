import { useState } from 'react';
import { Bar, Button, Columns, EmptyState, Stat } from '../../design';
import { useSettings } from '../../db/settings';
import type { Grade } from '../../db/types';
import { formatAverage, scaleBlocks, type GradeScale } from '../../lib/grades';
import type { SectionProps } from '../types';
import { quickAddGrade, useGradesData, type SubjectStats } from './data';
import { GradeDialog } from './GradeDialog';
import styles from './Grades.module.css';
import { SubjectDialog } from './SubjectDialog';
import { SubjectNameDialog } from './SubjectNameDialog';
import { ValuePicker } from './ValuePicker';

/** How many recent grades are shown as plates in a subject row. */
const PLATES = 9;

type GradeEditor = { subjectId: string; grade?: Grade | undefined };

export function GradesSection({ wide }: SectionProps) {
  const data = useGradesData();
  const { gradeScale } = useSettings();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [gradeEditor, setGradeEditor] = useState<GradeEditor | null>(null);
  const [nameDialog, setNameDialog] = useState<{ subjectId?: string | undefined } | null>(null);
  const [showArchive, setShowArchive] = useState(false);

  const all = [...data.active, ...data.archived];
  const find = (id: string | null | undefined) => all.find((s) => s.subject.id === id);
  const detail = find(detailId);
  const editorSubject = find(gradeEditor?.subjectId);

  const summary = (
      <div className={styles.summary}>
        <Stat className={styles.average} label="Средний балл" value={formatAverage(data.overall)} size="average" tone="accent" />
        <div className={styles.cells}>
          <Stat className={styles.cell} label="Оценок" value={data.count} />
          <Stat className={styles.cell} label="Лучший предмет" value={data.best?.subject.name ?? '—'} size="sm" />
        </div>
      </div>
  );

  const empty = !data.loading && data.active.length === 0 && (
        <EmptyState
          title="Предметов пока нет"
          action={
            <Button variant="primary" onClick={() => setNameDialog({})}>
              Добавить предмет +
            </Button>
          }
        >
          Добавьте предмет, и здесь появятся оценки, средний балл и шкала прогресса.
        </EmptyState>
  );

  const list = data.active.length > 0 && (
        <ul className={`${styles.subjects} appear`}>
          {data.active.map((s) => (
            <SubjectRow
              key={s.subject.id}
              stats={s}
              scale={gradeScale}
              expanded={expanded === s.subject.id}
              onToggle={() => setExpanded(expanded === s.subject.id ? null : s.subject.id)}
              onOpen={() => setDetailId(s.subject.id)}
              onEditGrade={(grade) => setGradeEditor({ subjectId: s.subject.id, grade })}
              plates={wide ? 16 : PLATES}
            />
          ))}
        </ul>
  );

  const add = data.active.length > 0 && (
        <Button variant="secondary" onClick={() => setNameDialog({})}>
          Добавить предмет +
        </Button>
  );

  const archive = data.archived.length > 0 && (
        <div className={styles.archive}>
          <button type="button" className={styles.archiveToggle} aria-expanded={showArchive} onClick={() => setShowArchive(!showArchive)}>
            <span className="label">Архив · {data.archived.length}</span>
            <span className="label">{showArchive ? 'Скрыть' : 'Показать'}</span>
          </button>
          {showArchive && (
            <ul className="appear">
              {data.archived.map((s) => (
                <li key={s.subject.id}>
                  <button type="button" className={styles.archived} onClick={() => setDetailId(s.subject.id)}>
                    <span>{s.subject.name}</span>
                    <span className={styles.archivedAvg}>{formatAverage(s.average)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
  );

  return (
    <div className={styles.section}>
      {wide ? (
        <Columns
          wide
          main={
            <>
              {summary}
              {empty}
              {add}
              {archive}
            </>
          }
          side={list}
        />
      ) : (
        <>
          {summary}
          {empty}
          {list}
          {add}
          {archive}
        </>
      )}

      <SubjectDialog
        stats={detail}
        scale={gradeScale}
        onClose={() => setDetailId(null)}
        onAddGrade={() => detail && setGradeEditor({ subjectId: detail.subject.id })}
        onEditGrade={(grade) => detail && setGradeEditor({ subjectId: detail.subject.id, grade })}
        onRename={() => detail && setNameDialog({ subjectId: detail.subject.id })}
      />

      <GradeDialog
        open={gradeEditor !== null && editorSubject !== undefined}
        onClose={() => setGradeEditor(null)}
        subjectId={gradeEditor?.subjectId ?? ''}
        subjectName={editorSubject?.subject.name ?? ''}
        scale={gradeScale}
        grade={gradeEditor?.grade}
      />

      <SubjectNameDialog
        open={nameDialog !== null}
        onClose={() => setNameDialog(null)}
        subject={find(nameDialog?.subjectId)?.subject}
        existing={data.subjects}
        onCreated={(id) => setExpanded(id)}
      />
    </div>
  );
}

type SubjectRowProps = {
  stats: SubjectStats;
  scale: GradeScale;
  expanded: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onEditGrade: (grade: Grade) => void;
  plates: number;
};

function SubjectRow({ stats, scale, expanded, onToggle, onOpen, onEditGrade, plates }: SubjectRowProps) {
  const { subject, grades, average } = stats;
  const recent = grades.slice(-plates);
  const pickerId = `quick-${subject.id}`;

  return (
    <li className={styles.subject}>
      <div className={styles.subjectHead}>
        <button type="button" className={styles.subjectName} aria-expanded={expanded} aria-controls={pickerId} onClick={onToggle}>
          <span>{subject.name}</span>
          <span className={styles.subjectAvg}>{formatAverage(average)}</span>
        </button>
        <button type="button" className={styles.more} onClick={onOpen} aria-label={`Открыть предмет ${subject.name}`}>
          <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
            <path d="M3 1 L8 6 L3 11" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div id={pickerId} className={`${styles.quick} appear`}>
          <span className="label">Быстрая оценка · сегодня</span>
          <ValuePicker scale={scale} onPick={(v) => quickAddGrade(subject, v)} label={`Поставить оценку: ${subject.name}`} />
        </div>
      )}

      {recent.length > 0 ? (
        <ul className={styles.plates} aria-label="Последние оценки">
          {recent.map((g, i) => (
            <li key={g.id}>
              <button
                type="button"
                className={i === recent.length - 1 ? `${styles.plate} ${styles.plateLast}` : styles.plate}
                onClick={() => onEditGrade(g)}
                aria-label={`Оценка ${g.value}${g.weight > 1 ? `, вес ${g.weight}` : ''}, изменить`}
              >
                {g.value}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.muted}>Оценок нет. Нажмите на название, чтобы поставить первую.</p>
      )}

      <Bar value={scaleBlocks(average, scale)} label={`Средний балл ${formatAverage(average)} из ${scale}`} />
    </li>
  );
}
