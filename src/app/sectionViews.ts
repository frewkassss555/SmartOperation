import type { ComponentType } from 'react';
import { FinanceSection } from '../features/finance/FinanceSection';
import { GradesSection } from '../features/grades/GradesSection';
import { MarketSection } from '../features/market/MarketSection';
import { NotesSection } from '../features/notes/NotesSection';
import { OverviewSection } from '../features/overview/OverviewSection';
import { ScheduleSection } from '../features/schedule/ScheduleSection';
import { SettingsSection } from '../features/settings/SettingsSection';
import type { SectionProps } from '../features/types';
import type { Route } from './routes';

export const SECTION_VIEWS: Record<Route, ComponentType<SectionProps>> = {
  grades: GradesSection,
  finance: FinanceSection,
  schedule: ScheduleSection,
  notes: NotesSection,
  market: MarketSection,
  settings: SettingsSection,
  overview: OverviewSection,
};
