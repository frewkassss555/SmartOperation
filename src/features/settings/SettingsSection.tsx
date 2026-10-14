import { EmptyState } from '../../design';
import type { SectionProps } from '../types';

export function SettingsSection(_: SectionProps) {
  return (
    <EmptyState title="Настройки готовятся">
      Шкала оценок, валюта, стартовый баланс, чётность недели, экспорт и импорт данных появятся здесь.
    </EmptyState>
  );
}
