import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { notify } from '../../app/undo';
import { Button, Chip, Dialog, Field } from '../../design';
import { db, newId } from '../../db/db';
import { requestPersistenceOnce, useSettings } from '../../db/settings';
import { COMMAND_EXAMPLES, parseCommand, type Command } from '../../lib/command';
import { toIsoDate } from '../../lib/date';
import { formatMoney } from '../../lib/money';
import { quickAddGrade } from '../grades/data';
import styles from './Command.module.css';

function describe(command: Command, currency: string): string {
  switch (command.kind) {
    case 'grade':
      return `Оценка ${command.value} · ${command.subject.name}`;
    case 'txn':
      return `${command.txnKind === 'in' ? 'Доход' : 'Расход'} ${formatMoney(command.amount, currency)} · ${command.category}${command.note ? ` · ${command.note}` : ''}`;
    case 'note':
      return `Заметка «${command.title}»`;
    default:
      return '';
  }
}

async function run(command: Command, currency: string): Promise<void> {
  if (command.kind === 'grade') {
    const subject = await db.subjects.get(command.subject.id);
    if (subject) await quickAddGrade(subject, command.value);
  } else if (command.kind === 'txn') {
    const id = newId();
    await db.txns.add({ id, kind: command.txnKind, amount: command.amount, category: command.category, date: toIsoDate(new Date()), note: command.note });
    void requestPersistenceOnce();
    notify(describe(command, currency), () => db.txns.delete(id));
  } else if (command.kind === 'note') {
    const id = newId();
    await db.notes.add({ id, title: command.title, body: '', pinned: false, updatedAt: Date.now() });
    void requestPersistenceOnce();
    notify(describe(command, currency), () => db.notes.delete(id));
  }
}

/** Ctrl+K quick entry: one line creates a grade, an expense or income, or a note. */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useSettings();
  const subjects = useLiveQuery(() => db.subjects.toArray(), []) ?? [];
  const [text, setText] = useState('');

  useEffect(() => {
    if (open) setText('');
  }, [open]);

  const command = parseCommand(text, {
    subjects: subjects.filter((s) => !s.archived),
    categories: settings.categories,
    scale: settings.gradeScale,
  });
  const ready = command.kind === 'grade' || command.kind === 'txn' || command.kind === 'note';

  const submit = async () => {
    if (!ready) return;
    onClose();
    await run(command, settings.currency);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      kicker="Ctrl + K"
      title="Быстрый ввод"
      onSubmit={submit}
      actions={
        <Button variant="primary" type="submit" disabled={!ready}>
          Записать
        </Button>
      }
    >
      <Field
        label="Команда"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="оценка информатика 9"
        autoFocus
        autoComplete="off"
        spellCheck={false}
        className={styles.input}
      />
      <p className={ready ? styles.preview : styles.hint} role="status">
        {ready ? describe(command, settings.currency) : command.kind === 'error' ? command.message : 'Enter — записать, Esc — закрыть'}
      </p>
      <div className={styles.examples}>
        <span className="label">Примеры</span>
        <div className={styles.chips}>
          {COMMAND_EXAMPLES.map((example) => (
            <Chip key={example} onClick={() => setText(example)} pressed={text === example}>
              {example}
            </Chip>
          ))}
        </div>
      </div>
      <p className={styles.hint}>Клавиши 1–5 открывают разделы, 0 — обзор.</p>
    </Dialog>
  );
}
