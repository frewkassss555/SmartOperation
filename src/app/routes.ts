export type SectionId = 'grades' | 'finance' | 'schedule' | 'notes' | 'market';
export type Route = SectionId | 'settings';

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

export const DEFAULT_ROUTE: Route = 'grades';

const ROUTES: readonly Route[] = [...SECTIONS.map((s) => s.id), 'settings'];

export function parseHash(hash: string): Route | null {
  const path = hash.replace(/^#\/?/, '').split(/[/?]/)[0] ?? '';
  return (ROUTES as readonly string[]).includes(path) ? (path as Route) : null;
}

export function routeHref(route: Route): string {
  return `#/${route}`;
}
