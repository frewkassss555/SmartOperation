import { useEffect, useRef } from 'react';
import { FocusIndicator } from '../features/focus/FocusIndicator';
import { useTimer } from '../features/focus/timer';
import { formatHeaderDate, overviewTitle, toIsoDate } from '../lib/date';
import { Brand } from './Brand';
import { useToday } from './hooks';
import { routeHref, SECTIONS, type Route } from './routes';
import { SECTION_VIEWS } from './sectionViews';
import styles from './PhoneShell.module.css';

export function PhoneShell({ route }: { route: Route }) {
  const today = useToday();
  const mainRef = useRef<HTMLElement>(null);
  const View = SECTION_VIEWS[route];
  const section = SECTIONS.find((s) => s.id === route);
  const dayTitle = overviewTitle(today);
  // While the focus timer runs it takes the date's place: the header stays one line at 320px.
  const focusRunning = useTimer((s) => s.phase !== 'idle');

  // Each screen starts at the top.
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [route]);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <a
          href={routeHref('overview')}
          className={styles.brandLink}
          aria-current={route === 'overview' ? 'page' : undefined}
          aria-label="Трекер, обзор"
        >
          <Brand />
        </a>
        <div className={styles.headerRight}>
          {focusRunning ? (
            <FocusIndicator />
          ) : (
            <time className={styles.date} dateTime={toIsoDate(today)}>
              {formatHeaderDate(today)}
            </time>
          )}
          <a href={routeHref('settings')} className={styles.settings} aria-current={route === 'settings' ? 'page' : undefined}>
            Настр.
          </a>
        </div>
      </header>

      <main className={styles.main} ref={mainRef} id="content" tabIndex={-1}>
        <div className={styles.screenHead}>
          <h1 className={styles.title}>
            {route === 'overview' ? (
              <>
                {dayTitle.weekday}
                <span className={styles.dot}>.</span>
                {dayTitle.day}
              </>
            ) : (
              (section?.title ?? 'Настройки')
            )}
          </h1>
          {section && (
            <span className={styles.counter}>
              {section.index} / {String(SECTIONS.length).padStart(2, '0')}
            </span>
          )}
        </div>
        <div key={route} className="appear">
          <View compact />
        </div>
      </main>

      <nav className={styles.nav} aria-label="Разделы">
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
    </div>
  );
}
