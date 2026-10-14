import { lazy, type ComponentType } from 'react';
import { FinanceSection } from '../features/finance/FinanceSection';
import { GradesSection } from '../features/grades/GradesSection';
import { MarketSection } from '../features/market/MarketSection';
import { NotesSection } from '../features/notes/NotesSection';
import { OverviewSection } from '../features/overview/OverviewSection';
import { ScheduleSection } from '../features/schedule/ScheduleSection';
import type { SectionProps } from '../features/types';
import type { Route } from './routes';

// Sections load with the app: the desktop overview shows all of them at once, and lazy
// panels popping in one by one shifted the layout (CLS 0.3). Settings are never part of
// the first screen, so they are a separate chunk (precached for offline use).
export const SECTION_VIEWS: Record<Route, ComponentType<SectionProps>> = {
  grades: GradesSection,
  finance: FinanceSection,
  schedule: ScheduleSection,
  notes: NotesSection,
  market: MarketSection,
  overview: OverviewSection,
  settings: lazy(() => import('../features/settings/SettingsSection').then((m) => ({ default: m.SettingsSection }))),
};
