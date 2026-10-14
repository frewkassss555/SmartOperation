import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Delta, Panel, Stat } from '../design';
import commandStyles from '../features/command/Command.module.css';
import { useHotkeys } from '../features/command/useHotkeys';
import { FocusIndicator } from '../features/focus/FocusIndicator';
import { coinLabel, useSelectedCoin } from '../features/market/coins';
import { useOverview } from '../features/overview/useOverview';
import { WeeklySummaryBlock } from '../features/overview/WeeklySummaryBlock';
import { formatUsd } from '../lib/market';
import { formatFullDate, formatHeaderDate, isoWeek, overviewTitle, toIsoDate } from '../lib/date';
import { Brand } from './Brand';
import { useToday } from './hooks';
import { routeHref, SECTIONS, type Route, type Section, type SectionId } from './routes';
import { SECTION_VIEWS } from './sectionViews';
import styles from './DesktopShell.module.css';

// Quick entry loads on first use.
const CommandPalette = lazy(() => import('../features/command/CommandPalette').then((m) => ({ default: m.CommandPalette })));

/** Panel rows of the overview, as in the approved layout. */
const ROWS: readonly (readonly SectionId[])[] = [
  ['grades', 'market'],
  ['schedule', 'finance', 'notes'],
];

const demoNote = (demo: boolean) =>
  demo ? 'Добавлены демо-данные. Очистить: Настройки → Удалить всё.' : 'Демо-данные выключены. Их можно добавить в настройках.';

/**
 * Desktop: the overview shows every section as a panel; choosing a section (sidebar or a
 * panel's "Открыть") opens it full screen with room for all of its tools.
 */
export function DesktopShell({ route }: { route: Route }) {
  const today = useToday();
  const overview = useOverview();
  const mainRef = useRef<HTMLElement>(null);
  const section = SECTIONS.find((s) => s.id === route);
  const isSettings = route === 'settings';
  const [paletteOpen, setPaletteOpen] = useState(false);
  useHotkeys(useCallback(() => setPaletteOpen(true), []));

  // Every screen starts at the top.
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [route]);

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <a
          href={routeHref('overview')}
          className={route === 'overview' ? `${styles.brandRow} ${styles.brandActive}` : styles.brandRow}
          aria-current={route === 'overview' ? 'page' : undefined}
          aria-label="Трекер, обзор"
        >
          <Brand />
        </a>
        <nav aria-label="Разделы">
          <a
            href={routeHref('overview')}
            className={route === 'overview' ? `${styles.navItem} ${styles.active}` : styles.navItem}
            aria-current={route === 'overview' ? 'page' : undefined}
          >
            <span className={styles.navIndex}>00</span>
            <span className={styles.navLabel}>Обзор</span>
          </a>
          {SECTIONS.map((s) => {
            const active = s.id === route;
            return (
              <a
                key={s.id}
                href={routeHref(s.id)}
                className={active ? `${styles.navItem} ${styles.active}` : styles.navItem}
                aria-current={active ? 'page' : undefined}
              >
                <span className={styles.navIndex}>{s.index}</span>
                <span className={styles.navLabel}>{s.nav}</span>
              </a>
            );
          })}
        </nav>
        <div className={styles.sidebarFoot}>
          <a
            href={routeHref('settings')}
            className={isSettings ? `${styles.navItem} ${styles.active}` : styles.navItem}
            aria-current={isSettings ? 'page' : undefined}
          >
            <span className={styles.navIndex}>—</span>
            <span className={styles.navLabel}>Настройки</span>
          </a>
          <div className={styles.meta}>
            <span className="label">Сегодня</span>
            <time className={styles.metaDate} dateTime={toIsoDate(today)}>
              {formatFullDate(today)}
            </time>
            <p className={styles.metaNote}>{demoNote(overview.demo)}</p>
          </div>
        </div>
      </aside>

      <div className={styles.column}>
        <header className={styles.header}>
          <span className={styles.crumb}>
            {section ? (
              <>
                <a href={routeHref('overview')} className={styles.crumbLink}>
                  Обзор
                </a>
                <span className={styles.crumbHint}>/</span>
                {section.title}
              </>
            ) : isSettings ? (
              'Настройки'
            ) : (
              <>
                Обзор<span className={styles.crumbHint}>Все разделы</span>
              </>
            )}
          </span>
          <span className={styles.headerMeta}>
            <button type="button" className={commandStyles.trigger} onClick={() => setPaletteOpen(true)} aria-keyshortcuts="Control+K">
              Быстрый ввод <span className={commandStyles.kbd}>Ctrl K</span>
            </button>
            <FocusIndicator />
            <span>Неделя {isoWeek(today)}</span>
            <span>{formatHeaderDate(today)}</span>
          </span>
        </header>

        <main className={styles.main} ref={mainRef} id="content" tabIndex={-1}>
          <div className={styles.content} key={route}>
            {section ? <SectionPage section={section} /> : isSettings ? <SettingsPage /> : <OverviewPage overview={overview} />}
          </div>

          <footer className={styles.footer}>
            <span>{demoNote(overview.demo)}</span>
            <span>Данные хранятся только на этом устройстве</span>
          </footer>
        </main>
      </div>
      {paletteOpen && (
        <Suspense fallback={null}>
          <CommandPalette open onClose={() => setPaletteOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}

function SectionPage({ section }: { section: Section }) {
  const View = SECTION_VIEWS[section.id];
  return (
    <>
      <div className={styles.pageHead}>
        <h1 className={styles.title}>{section.title}</h1>
        <span className={styles.counter}>
          {section.index} / {String(SECTIONS.length).padStart(2, '0')}
        </span>
      </div>
      <div className="appear">
        <Suspense fallback={null}>
          <Suspense fallback={null}>
        <View compact={false} wide />
      </Suspense>
        </Suspense>
      </div>
    </>
  );
}

function SettingsPage() {
  const View = SECTION_VIEWS.settings;
  return (
    <>
      <h1 className={styles.title}>Настройки</h1>
      <Suspense fallback={null}>
        <View compact={false} wide />
      </Suspense>
    </>
  );
}

function OverviewPage({ overview }: { overview: ReturnType<typeof useOverview> }) {
  const today = useToday();
  const coin = useSelectedCoin();
  const title = overviewTitle(today);

  return (
    <>
      <h1 className={styles.title}>
        {title.weekday}
        <span className={styles.dot}>.</span>
        {title.day}
      </h1>

      <div className={styles.stats}>
        <Stat className={styles.stat} label="Средний балл" value={overview.average} tone="accent" />
        <Stat className={styles.stat} label="Баланс" value={overview.balance} />
        <Stat
          className={styles.stat}
          label="Уроков сегодня"
          value={overview.lessonsToday}
          hint={
            overview.status
              ? `${overview.status.kind === 'lesson' ? 'Сейчас' : 'Дальше'}: ${overview.subjectName(overview.status.lesson.subjectId)}`
              : undefined
          }
        />
        <Stat
          className={styles.stat}
          label={`${coinLabel(coin.watch)} / USD`}
          value={formatUsd(coin.quote?.price)}
          hint={<Delta value={coin.quote?.change24h} suffix="24Ч" />}
        />
      </div>

      <WeeklySummaryBlock />

      <div className={styles.rows}>
        {ROWS.map((row) => (
          <div key={row.join('-')} className={styles.row}>
            {row.map((id) => {
              const s = SECTIONS.find((x) => x.id === id)!;
              const View = SECTION_VIEWS[id];
              return (
                <Panel
                  key={id}
                  className={styles[id]}
                  title={s.title}
                  index={s.index}
                  aside={
                    <a href={routeHref(id)} className={styles.open} aria-label={`Открыть раздел ${s.title} на весь экран`}>
                      Открыть
                      <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                        <path d="M3 1 L8 6 L3 11" stroke="currentColor" strokeWidth="2" fill="none" />
                      </svg>
                    </a>
                  }
                >
                  <Suspense fallback={null}>
                    <View compact={false} />
                  </Suspense>
                </Panel>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}
