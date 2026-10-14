import { useEffect, useState } from 'react';
import { Button, Dialog, Field, Segmented, SelectField } from '../../design';
import type { Txn } from '../../db/types';
import { toIsoDate } from '../../lib/date';
import { minorToInput, parseMoney, type TxnKind } from '../../lib/money';
import type { Repeat } from '../../lib/recurring';
import { deleteTxn, saveTxn } from './data';
import styles from './Finance.module.css';

const KINDS = [
  { value: 'out', label: 'Расход' },
  { value: 'in', label: 'Доход' },
] as const satisfies readonly { value: TxnKind; label: string }[];

const REPEATS = [
  { value: '', label: 'Не повторять' },
  { value: 'week', label: 'Каждую неделю' },
  { value: 'month', label: 'Каждый месяц' },
];

type Props = {
  open: boolean;
  onClose: () => void;
  txn?: Txn | undefined;
  categories: readonly string[];
  currency: string;
};

export function TxnDialog({ open, onClose, txn, categories, currency }: Props) {
  const [kind, setKind] = useState<TxnKind>('out');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [repeat, setRepeat] = useState<Repeat | ''>('');
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!open) return;
    setKind(txn?.kind ?? 'out');
    setAmount(txn ? minorToInput(txn.amount) : '');
    setCategory(txn?.category ?? categories[0] ?? 'Другое');
    setDate(txn?.date ?? toIsoDate(new Date()));
    setNote(txn?.note ?? '');
    setRepeat(txn?.repeat ?? '');
    setError(undefined);
  }, [open, txn, categories]);

  const options = [...new Set([...categories, ...(txn ? [txn.category] : [])])].map((c) => ({ value: c, label: c }));
  const generated = txn?.seriesId !== undefined;

  const submit = async () => {
    const minor = parseMoney(amount);
    if (minor === null || minor === 0) return setError('Введите сумму, например 6,40');
    await saveTxn(
      { kind, amount: minor, category, date: date || toIsoDate(new Date()), note: note.trim() || undefined, repeat: repeat || undefined },
      txn,
    );
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      kicker="Операция"
      title={txn ? 'Изменить' : 'Новая операция'}
      onSubmit={submit}
      actions={
        <>
          {txn && (
            <Button
              variant="ghost"
              onClick={async () => {
                onClose();
                await deleteTxn(txn);
              }}
            >
              Удалить
            </Button>
          )}
          <Button variant="primary" type="submit">
            Сохранить
          </Button>
        </>
      }
    >
      <Segmented label="Тип операции" options={KINDS} value={kind} onChange={setKind} block />
      <Field
        label={`Сумма, ${currency || 'валюта'}`}
        inputMode="decimal"
        value={amount}
        onChange={(e) => (setAmount(e.target.value), setError(undefined))}
        placeholder="0,00"
        className={styles.amountField}
        error={error}
        autoFocus={!txn}
      />
      <SelectField label="Категория" options={options} value={category} onChange={(e) => setCategory(e.target.value)} />
      <Field label="Дата" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <Field label="Название" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Например, Обед" maxLength={60} />
      {generated ? (
        <p className="label">Создано автоматически из повторяющейся операции</p>
      ) : (
        <SelectField
          label="Повтор"
          options={REPEATS}
          value={repeat}
          onChange={(e) => setRepeat(e.target.value as Repeat | '')}
          hint="Повторы создаются сами при открытии приложения"
        />
      )}
    </Dialog>
  );
}
