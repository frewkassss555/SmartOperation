import { useEffect, useRef, useState, type ReactNode } from 'react';
import { notify } from '../../app/undo';
import { Button, Dialog, Field, Segmented } from '../../design';
import { backupFileName, deleteAllData, exportBackup, importBackup, parseBackup, type Backup, type ImportMode } from '../../db/backup';
import { addDemoData } from '../../db/demo';
import { updateSettings, useSettings } from '../../db/settings';
import type { GradeScale } from '../../lib/grades';
import { formatMinor, minorToInput, parseSignedMoney } from '../../lib/money';
import { PUSH_NOTE } from '../../pwa/notifications';
import { isIos, promptInstall, usePwa } from '../../pwa/pwa';
import type { SectionProps } from '../types';
import styles from './Settings.module.css';

const SCALES = [
  { value: '5', label: '1–5' },
  { value: '10', label: '1–10' },
  { value: '12', label: '1–12' },
] as const;

const ON_OFF = [
  { value: 'off', label: 'Выкл' },
  { value: 'on', label: 'Вкл' },
] as const;

const CONFIRM_WORD = 'УДАЛИТЬ';

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.group} aria-label={title}>
      <h2 className={styles.groupTitle}>{title}</h2>
      {children}
    </section>
  );
}

/** Install button when the browser offers it, a hint for iOS, or the installed state. */
function InstallBlock() {
  const installEvent = usePwa((s) => s.installEvent);
  const installed = usePwa((s) => s.installed);

  if (installed) return <p className={styles.note}>Приложение установлено и работает без сети.</p>;
  if (installEvent) {
    return (
      <div className={styles.buttons}>
        <Button variant="primary" onClick={promptInstall}>
          Установить
        </Button>
        <p className={styles.note}>Трекер откроется отдельным окном и будет работать без сети.</p>
      </div>
    );
  }
  if (isIos()) {
    return (
      <p className={styles.note}>
        Чтобы установить на iPhone или iPad: откройте Трекер в Safari, нажмите «Поделиться», затем «На экран „Домой“».
      </p>
    );
  }
  return (
    <p className={styles.note}>
      Установить можно из меню браузера (Chrome, Edge, Яндекс Браузер): «Установить приложение». После первой загрузки Трекер
      работает и без сети.
    </p>
  );
}

export function SettingsSection(_: SectionProps) {
  const settings = useSettings();
  const [currency, setCurrency] = useState(settings.currency);
  const [start, setStart] = useState('');
  const [startError, setStartError] = useState<string | undefined>();
  const [newCategory, setNewCategory] = useState('');
  const [pendingImport, setPendingImport] = useState<Backup | null>(null);
  const [importError, setImportError] = useState<string | undefined>();
  const [wipeOpen, setWipeOpen] = useState(false);
  const [wipeWord, setWipeWord] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sync inputs once settings arrive from the database.
  useEffect(() => setCurrency(settings.currency), [settings.currency]);
  useEffect(() => setStart(minorToInput(settings.startBalance)), [settings.startBalance]);

  const saveStart = () => {
    const value = parseSignedMoney(start);
    if (value === null) return setStartError('Например, 120 или 85,50');
    setStartError(undefined);
    void updateSettings({ startBalance: value });
  };

  const addCategory = () => {
    const name = newCategory.trim();
    if (!name || settings.categories.some((c) => c.toLocaleLowerCase('ru') === name.toLocaleLowerCase('ru'))) return;
    void updateSettings({ categories: [...settings.categories, name] });
    setNewCategory('');
  };

  const removeCategory = (name: string) => {
    const before = settings.categories;
    void updateSettings({ categories: before.filter((c) => c !== name) });
    notify(`Категория «${name}» удалена`, () => updateSettings({ categories: before }));
  };

  const download = async () => {
    const backup = await exportBackup();
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = backupFileName();
    a.click();
    URL.revokeObjectURL(url);
    notify('Экспорт сохранён');
  };

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    const result = parseBackup(await file.text());
    if (fileRef.current) fileRef.current.value = '';
    if (result.ok) {
      setImportError(undefined);
      setPendingImport(result.backup);
    } else setImportError(result.error);
  };

  const runImport = async (mode: ImportMode) => {
    if (!pendingImport) return;
    setBusy(true);
    await importBackup(pendingImport, mode);
    setBusy(false);
    setPendingImport(null);
    notify(mode === 'replace' ? 'Данные заменены' : 'Данные объединены');
  };

  const importCount = pendingImport
    ? Object.entries(pendingImport.tables)
        .filter(([name]) => name !== 'settings' && name !== 'watch')
        .reduce((n, [, rows]) => n + rows.length, 0)
    : 0;

  return (
    <div className={styles.section}>
      <Group title="Оценки">
        <div className={styles.row}>
          <span className={styles.rowLabel}>Шкала оценок</span>
          <Segmented
            label="Шкала оценок"
            options={SCALES}
            value={String(settings.gradeScale) as '5' | '10' | '12'}
            onChange={(v) => void updateSettings({ gradeScale: Number(v) as GradeScale })}
          />
        </div>
      </Group>

      <Group title="Финансы">
        <div className={styles.fields}>
          <Field
            label="Валюта"
            value={currency}
            maxLength={4}
            onChange={(e) => setCurrency(e.target.value)}
            onBlur={() => void updateSettings({ currency: currency.trim() })}
            hint="Символ после суммы: Br, ₽, $"
          />
          <Field
            label="Стартовый баланс"
            inputMode="decimal"
            value={start}
            onChange={(e) => (setStart(e.target.value), setStartError(undefined))}
            onBlur={saveStart}
            error={startError}
            hint={`Сейчас: ${formatMinor(settings.startBalance)}`}
          />
        </div>
        <div className={styles.block}>
          <span className="label">Категории</span>
          <ul className={styles.categories}>
            {settings.categories.map((c) => (
              <li key={c} className={styles.category}>
                <span>{c}</span>
                <button type="button" className={styles.remove} onClick={() => removeCategory(c)} aria-label={`Удалить категорию ${c}`}>
                  <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                    <path d="M1 1 L11 11 M11 1 L1 11" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
          <form
            className={styles.addRow}
            onSubmit={(e) => {
              e.preventDefault();
              addCategory();
            }}
          >
            <Field label="Новая категория" hideLabel placeholder="Новая категория" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} maxLength={24} />
            <Button type="submit" variant="secondary">
              Добавить
            </Button>
          </form>
        </div>
      </Group>

      <Group title="Расписание">
        <div className={styles.row}>
          <span className={styles.rowLabel}>Чётные и нечётные недели</span>
          <Segmented
            label="Чётность недели"
            options={ON_OFF}
            value={settings.weekParity ? 'on' : 'off'}
            onChange={(v) => void updateSettings({ weekParity: v === 'on' })}
          />
        </div>
      </Group>

      <Group title="Приложение">
        <InstallBlock />
        <div className={styles.block}>
          <span className="label">Уведомления и алерты по цене</span>
          <p className={styles.note}>{PUSH_NOTE}</p>
        </div>
      </Group>

      <Group title="Данные">
        <p className={styles.note}>Всё хранится только на этом устройстве. Сделайте экспорт, чтобы перенести данные или сохранить копию.</p>
        <div className={styles.buttons}>
          <Button variant="secondary" onClick={download}>
            Экспорт JSON
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            Импорт JSON
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => pickFile(e.target.files?.[0])} />
        </div>
        {importError && (
          <p className={styles.error} role="alert">
            {importError}
          </p>
        )}
        <div className={styles.buttons}>
          <Button
            variant="secondary"
            disabled={settings.demo || busy}
            onClick={async () => {
              setBusy(true);
              await addDemoData();
              setBusy(false);
              notify('Демо-данные добавлены');
            }}
          >
            {settings.demo ? 'Демо-данные добавлены' : 'Добавить демо-данные'}
          </Button>
          <Button variant="ghost" className={styles.danger} onClick={() => (setWipeWord(''), setWipeOpen(true))}>
            Удалить всё
          </Button>
        </div>
      </Group>

      <Dialog
        open={pendingImport !== null}
        onClose={() => setPendingImport(null)}
        kicker="Импорт"
        title="Как загрузить?"
        actions={
          <>
            <Button variant="secondary" disabled={busy} onClick={() => runImport('merge')}>
              Объединить
            </Button>
            <Button variant="primary" disabled={busy} onClick={() => runImport('replace')}>
              Заменить
            </Button>
          </>
        }
      >
        <p className={styles.note}>
          В файле {importCount} записей. «Заменить» удалит текущие данные и загрузит файл. «Объединить» добавит записи из файла
          к текущим, совпадающие обновит.
        </p>
      </Dialog>

      <Dialog
        open={wipeOpen}
        onClose={() => setWipeOpen(false)}
        kicker="Необратимо"
        title="Удалить всё"
        onSubmit={async () => {
          if (wipeWord.trim().toLocaleUpperCase('ru') !== CONFIRM_WORD) return;
          setWipeOpen(false);
          await deleteAllData();
          notify('Все данные удалены');
        }}
        actions={
          <Button type="submit" variant="primary" disabled={wipeWord.trim().toLocaleUpperCase('ru') !== CONFIRM_WORD}>
            Удалить навсегда
          </Button>
        }
      >
        <p className={styles.note}>Оценки, операции, расписание и заметки будут удалены с этого устройства. Отменить это нельзя.</p>
        <Field label={`Введите ${CONFIRM_WORD}`} value={wipeWord} onChange={(e) => setWipeWord(e.target.value)} autoComplete="off" autoFocus />
      </Dialog>
    </div>
  );
}
