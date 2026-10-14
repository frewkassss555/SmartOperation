import { useState } from 'react';
import { Button, Chip, EmptyState, Field } from '../../design';
import { NOT_READY, type SectionProps } from '../types';
import styles from './NotesSection.module.css';

type Filter = 'all' | 'pinned';

export function NotesSection(_: SectionProps) {
  const [filter, setFilter] = useState<Filter>('all');

  return (
    <div className={styles.section}>
      <Button variant="primary" size="lg" block disabled title={NOT_READY}>
        Новая заметка +
      </Button>

      <div className={styles.tools}>
        <Field label="Поиск" type="search" placeholder="Заголовок или текст" />
        <div className={styles.filters} role="group" aria-label="Фильтр заметок">
          <Chip pressed={filter === 'all'} onClick={() => setFilter('all')}>
            Все
          </Chip>
          <Chip pressed={filter === 'pinned'} onClick={() => setFilter('pinned')}>
            Закреплённые
          </Chip>
        </div>
      </div>

      <EmptyState title="Заметок пока нет">
        Конспекты, идеи и списки: заметка сохраняется сама, пока вы печатаете.
      </EmptyState>
    </div>
  );
}
