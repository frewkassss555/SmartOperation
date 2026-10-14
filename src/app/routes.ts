export type SectionId = 'grades' | 'finance' | 'schedule' | 'notes' | 'market';
/** 'overview' is the phone's summary screen; on the desktop the overview is always shown. */
export type Route = SectionId | 'settings' | 'overview';

export type Section = {
  id: SectionId;
  index: string;
  /** Short label in the navigation. */
  nav: string;
  /** Screen and panel title. */
  title: string;
};

export const SECTIONS: readonly Section[] = [
  { id: 'grades', index: '01', nav: 'Оценки', title: 'Оценки' },
  { id: 'finance', index: '02', nav: 'Финансы', title: 'Финансы' },
  { id: 'schedule', index: '03', nav: 'План', title: 'Расписание' },
  { id: 'notes', index: '04', nav: 'Заметки', title: 'Заметки' },
  { id: 'market', index: '05', nav: 'Рынок', title: 'Рынок' },
];

/** The overview is the home screen on both layouts. */
export const DEFAULT_ROUTE: Route = 'overview';

const ROUTES: readonly Route[] = [...SECTIONS.map((s) => s.id), 'settings', 'overview'];

export function parseHash(hash: string): Route | null {
  const path = hash.replace(/^#\/?/, '').split(/[/?]/)[0] ?? '';
  return (ROUTES as readonly string[]).includes(path) ? (path as Route) : null;
}

export function routeHref(route: Route): string {
  return `#/${route}`;
}
