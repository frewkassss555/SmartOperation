import { useEffect, useRef, type MouseEvent } from 'react';
import { Panel, Stat } from '../design';
import { coinById } from '../features/market/coins';
import { useOverview } from '../features/overview/useOverview';
import { SettingsSection } from '../features/settings/SettingsSection';
import { formatFullDate, formatHeaderDate, isoWeek, overviewTitle, toIsoDate } from '../lib/date';
import { Brand } from './Brand';
import { useToday } from './hooks';
import { routeHref, SECTIONS, type Route, type Section, type SectionId } from './routes';
import { SECTION_VIEWS } from './sectionViews';
import { useUi } from './uiStore';
import styles from './DesktopShell.module.css';

/** Panel rows of the overview, as in the approved layout. */
const ROWS: readonly (readonly SectionId[])[] = [
  ['grades', 'market'],
  ['schedule', 'finance', 'notes'],
];

const demoNote = (demo: boolean) =>
  demo ? 'Добавлены демо-данные. Очистить: Настройки → Удалить всё.' : 'Демо-данные выключены. Их можно добавить в настройках.';

const panelId = (id: SectionId) => `panel-${id}`;

function jumpTo(id: SectionId) {
  const panel = document.getElementById(panelId(id));
  if (!panel) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  panel.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  panel.focus({ preventScroll: true });
}

export function DesktopShell({ route }: { route: Route }) {
  const today = useToday();
  const coin = coinById(useUi((s) => s.coin));
  const overview = useOverview();
  const title = overviewTitle(today);
  const isSettings = route === 'settings';
  const prevRoute = useRef(route);

  const mainRef = useRef<HTMLElement>(null);

  // Navigation scrolls to the panel; the initial load keeps the overview header in view.
  // Switching between the overview and settings starts at the top.
  useEffect(() => {
    if (prevRoute.current === route) return;
    const fromSettings = prevRoute.current === 'settings';
    prevRoute.current = route;
    if (route === 'settings' || route === 'overview') mainRef.current?.scrollTo(0, 0);
    else if (fromSettings) requestAnimationFrame(() => jumpTo(route));
    else jumpTo(route);
  }, [route]);

  const onNavClick = (event: MouseEvent, id: SectionId) => {
    // Clicking the current section does not fire hashchange; scroll explicitly.
    if (id === route) {
      event.preventDefault();
      jumpTo(id);
    }
  };

  const renderPanel = (section: Section) => {
    const View = SECTION_VIEWS[section.id];
    return (
      <Panel
        key={section.id}
        id={panelId(section.id)}
        className={styles[section.id]}
        title={section.title}
        index={section.index}
        focusable
      >
        <View compact={false} />
      </Panel>
    );
  };

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <a href={routeHref('overview')} className={styles.brandRow} aria-label="Трекер, обзор">
          <Brand />
        </a>
        <nav aria-label="Разделы">
          {SECTIONS.map((s) => {
            const active = s.id === route;
            return (
              <a
                key={s.id}
                href={routeHref(s.id)}
                className={active ? `${styles.navItem} ${styles.active}` : styles.navItem}
                aria-current={active ? 'true' : undefined}
                onClick={(e) => onNavClick(e, s.id)}
              >
                <span className={styles.navIndex}>{s.index}</span>
                <span className={styles.navLabel}>{s.nav}</span>
              </a>
            );
          })}
        </nav>
        <div className={styles.sidebarFoot}>
          <a
            href={isSettings ? routeHref('overview') : routeHref('settings')}
            className={isSettings ? `${styles.navItem} ${styles.active}` : styles.navItem}
            aria-current={isSettings ? 'page' : undefined}
          >
            <span className={styles.navIndex}>{isSettings ? '←' : '—'}</span>
            <span className={styles.navLabel}>{isSettings ? 'К обзору' : 'Настройки'}</span>
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
            {isSettings ? 'Настройки' : 'Обзор'}
            <span className={styles.crumbHint}>{isSettings ? '' : 'Все разделы'}</span>
          </span>
          <span className={styles.headerMeta}>
            <span>Неделя {isoWeek(today)}</span>
            <span>{formatHeaderDate(today)}</span>
          </span>
        </header>

        <main className={styles.main} ref={mainRef}>
          <div className={styles.content}>
            {isSettings ? (
              <>
                <h1 className={styles.title}>Настройки</h1>
                <SettingsSection compact={false} />
              </>
            ) : (
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
                  <Stat className={styles.stat} label={`${coin.symbol} / USD`} value="—" />
                </div>

                <div className={styles.rows}>
                  {ROWS.map((row) => (
                    <div key={row.join('-')} className={styles.row}>
                      {row.map((id) => renderPanel(SECTIONS.find((s) => s.id === id)!))}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <footer className={styles.footer}>
            <span>{demoNote(overview.demo)}</span>
            <span>Данные хранятся только на этом устройстве</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
