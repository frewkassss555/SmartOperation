import { Button, Dialog, LineChart, Stat } from '../../design';
import type { Grade } from '../../db/types';
import { formatDayMonth } from '../../lib/date';
import { formatAverage, weeklyAverages, type GradeScale } from '../../lib/grades';
import { deleteSubject, setArchived, type SubjectStats } from './data';
import styles from './Grades.module.css';

type Props = {
  stats: SubjectStats | undefined;
  scale: GradeScale;
  onClose: () => void;
  onAddGrade: () => void;
  onEditGrade: (grade: Grade) => void;
  onRename: () => void;
};

/** The subject screen: average, weekly trend, all grades and subject actions. */
export function SubjectDialog({ stats, scale, onClose, onAddGrade, onEditGrade, onRename }: Props) {
  const weekly = stats ? weeklyAverages(stats.grades) : [];

  return (
    <Dialog
      open={stats !== undefined}
      onClose={onClose}
      kicker={stats?.subject.archived ? 'Предмет · в архиве' : 'Предмет'}
      title={stats?.subject.name ?? ''}
      actions={
        stats && (
          <>
            <Button
              variant="ghost"
              onClick={async () => {
                onClose();
                await deleteSubject(stats.subject);
              }}
            >
              Удалить
            </Button>
            <Button variant="secondary" onClick={() => setArchived(stats.subject, !stats.subject.archived)}>
              {stats.subject.archived ? 'Из архива' : 'В архив'}
            </Button>
            <Button variant="secondary" onClick={onRename}>
              Переименовать
            </Button>
          </>
        )
      }
    >
      {stats && (
        <>
          <div className={styles.detailStats}>
            <Stat label="Средний" value={formatAverage(stats.average)} size="lg" tone="accent" />
            <Stat label="Оценок" value={stats.grades.length} size="lg" />
          </div>

          <div>
            <span className="label">Средний по неделям</span>
            {weekly.length >= 2 ? (
              <div className={styles.trend}>
                <LineChart
                  values={weekly.map((p) => p.average)}
                  width={440}
                  height={110}
                  domain={[1, scale]}
                  label={`Средний балл по неделям: ${weekly.map((p) => formatAverage(p.average)).join(', ')}`}
                />
              </div>
            ) : (
              <p className={styles.muted}>График появится, когда оценки будут хотя бы за две недели.</p>
            )}
          </div>

          <Button variant="primary" block onClick={onAddGrade}>
            Добавить оценку +
          </Button>

          {stats.grades.length > 0 && (
            <ul className={styles.gradeList} aria-label="Все оценки">
              {[...stats.grades].reverse().map((g) => (
                <li key={g.id}>
                  <button type="button" className={styles.gradeRow} onClick={() => onEditGrade(g)}>
                    <span className={styles.gradeRowDate}>{formatDayMonth(g.date)}</span>
                    <span className={styles.plate}>{g.value}</span>
                    <span className={styles.gradeRowComment}>{g.comment ?? ''}</span>
                    <span className={styles.gradeRowWeight}>{g.weight > 1 ? `×${g.weight}` : ''}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Dialog>
  );
}
