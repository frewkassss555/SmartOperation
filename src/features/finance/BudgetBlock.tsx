import { useEffect, useState } from 'react';
import { useToday } from '../../app/hooks';
import { Bar, Button, Dialog, Field } from '../../design';
import { updateSettings, useSettings } from '../../db/settings';
import type { Txn } from '../../db/types';
import { goalProgress, limitStatus, monthSpentByCategory } from '../../lib/budget';
import { balance, formatMoney, minorToInput, parseMoney } from '../../lib/money';
import styles from './Finance.module.css';

/** Monthly limits per expense category and a savings goal. */
export function BudgetBlock({ txns }: { txns: readonly Txn[] }) {
  const today = useToday();
  const settings = useSettings();
  const [limitsOpen, setLimitsOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);

  const spent = monthSpentByCategory(txns, today);
  const limits = Object.entries(settings.limits).filter(([c, v]) => v > 0 && settings.categories.includes(c));
  const money = (m: number) => formatMoney(m, settings.currency);
  const goal = settings.goal;
  const progress = goal ? goalProgress(balance(settings.startBalance, txns), goal.target) : null;

  return (
    <div className={styles.budget}>
      <section className={styles.budgetBlock} aria-labelledby="limits-title">
        <div className={styles.budgetHead}>
          <h3 className={styles.budgetTitle} id="limits-title">
            Лимиты на месяц
          </h3>
          <Button variant="ghost" onClick={() => setLimitsOpen(true)}>
            Настроить
          </Button>
        </div>
        {limits.length === 0 ? (
          <p className={styles.muted}>Лимитов нет. Задайте месячный лимит на категорию — шкала покраснеет на 80%.</p>
        ) : (
          <ul className={styles.limits}>
            {limits.map(([category, limit]) => {
              const s = limitStatus(spent.get(category) ?? 0, limit);
              return (
                <li key={category} className={s.warn ? `${styles.limit} ${styles.limitWarn}` : styles.limit}>
                  <div className={styles.limitRow}>
                    <span className={styles.limitName}>{category}</span>
                    <span className={styles.limitNums}>
                      {money(s.spent)} / {money(limit)}
                    </span>
                  </div>
                  <Bar
                    value={s.blocks}
                    tone={s.warn ? 'negative' : 'text'}
                    label={`${category}: потрачено ${Math.round(s.ratio * 100)}% лимита`}
                  />
                  {s.warn && (
                    <span className={styles.limitNote}>
                      {s.over ? `Лимит превышен на ${money(s.spent - limit)}` : `${Math.round(s.ratio * 100)}% лимита`}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={styles.budgetBlock} aria-labelledby="goal-title">
        <div className={styles.budgetHead}>
          <h3 className={styles.budgetTitle} id="goal-title">
            Цель
          </h3>
          <Button variant="ghost" onClick={() => setGoalOpen(true)}>
            {goal ? 'Изменить' : 'Поставить'}
          </Button>
        </div>
        {goal && progress ? (
          <div className={styles.goal}>
            <div className={styles.limitRow}>
              <span className={styles.limitName}>{goal.title}</span>
              <span className={styles.limitNums}>{money(goal.target)}</span>
            </div>
            <Bar value={progress.blocks} tone="accent" label={`Накоплено ${Math.round(progress.ratio * 100)}% цели`} />
            <span className={progress.left === 0 ? styles.goalDone : styles.limitNums}>
              {progress.left === 0 ? 'Цель достигнута' : `Осталось ${money(progress.left)}`}
            </span>
          </div>
        ) : (
          <p className={styles.muted}>Цель накопления считается по балансу: например, «Наушники» за 250 {settings.currency}.</p>
        )}
      </section>

      <LimitsDialog open={limitsOpen} onClose={() => setLimitsOpen(false)} />
      <GoalDialog open={goalOpen} onClose={() => setGoalOpen(false)} />
    </div>
  );
}

function LimitsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useSettings();
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setValues(Object.fromEntries(settings.categories.map((c) => [c, settings.limits[c] ? minorToInput(settings.limits[c]) : ''])));
    setErrors({});
    // Reset only on open.
  }, [open]);

  const submit = async () => {
    const limits: Record<string, number> = {};
    const nextErrors: Record<string, string> = {};
    for (const [category, text] of Object.entries(values)) {
      if (!text.trim()) continue;
      const minor = parseMoney(text);
      if (minor === null) nextErrors[category] = 'Например, 120 или 85,50';
      else if (minor > 0) limits[category] = minor;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    await updateSettings({ limits });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      kicker="Финансы"
      title="Лимиты на месяц"
      onSubmit={submit}
      actions={
        <Button variant="primary" type="submit">
          Сохранить
        </Button>
      }
    >
      <p className={styles.muted}>Пустое поле — без лимита. Считаются расходы с первого числа месяца.</p>
      <div className={styles.limitFields}>
        {settings.categories.map((c) => (
          <Field
            key={c}
            label={`${c}, ${settings.currency}`}
            inputMode="decimal"
            placeholder="Без лимита"
            value={values[c] ?? ''}
            onChange={(e) => setValues({ ...values, [c]: e.target.value })}
            error={errors[c]}
          />
        ))}
      </div>
    </Dialog>
  );
}

function GoalDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useSettings();
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!open) return;
    setTitle(settings.goal?.title ?? '');
    setTarget(settings.goal ? minorToInput(settings.goal.target) : '');
    setError(undefined);
    // Reset only on open.
  }, [open]);

  const submit = async () => {
    const minor = parseMoney(target);
    if (!title.trim()) return setError('Назовите цель');
    if (minor === null || minor === 0) return setError('Укажите сумму, например 250');
    await updateSettings({ goal: { title: title.trim(), target: minor } });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      kicker="Финансы"
      title="Цель накопления"
      onSubmit={submit}
      actions={
        <>
          {settings.goal && (
            <Button
              variant="ghost"
              onClick={async () => {
                await updateSettings({ goal: null });
                onClose();
              }}
            >
              Убрать цель
            </Button>
          )}
          <Button variant="primary" type="submit">
            Сохранить
          </Button>
        </>
      }
    >
      <Field label="На что копим" value={title} onChange={(e) => (setTitle(e.target.value), setError(undefined))} maxLength={40} placeholder="Например, наушники" />
      <Field
        label={`Сумма, ${settings.currency}`}
        inputMode="decimal"
        value={target}
        onChange={(e) => (setTarget(e.target.value), setError(undefined))}
        error={error}
      />
    </Dialog>
  );
}
