import { create } from 'zustand';

export type FinanceRange = 'week' | 'month';
export type MarketPeriod = '1' | '7' | '30';
export type CoinId = string;

type UiState = {
  financeRange: FinanceRange;
  marketPeriod: MarketPeriod;
  coin: CoinId;
  /** Selected school day 0..5, or null to follow today. */
  scheduleDay: number | null;
  setFinanceRange: (range: FinanceRange) => void;
  setMarketPeriod: (period: MarketPeriod) => void;
  setCoin: (coin: CoinId) => void;
  setScheduleDay: (day: number) => void;
};

export const useUi = create<UiState>((set) => ({
  financeRange: 'week',
  marketPeriod: '7',
  coin: 'bitcoin',
  scheduleDay: null,
  setFinanceRange: (financeRange) => set({ financeRange }),
  setMarketPeriod: (marketPeriod) => set({ marketPeriod }),
  setCoin: (coin) => set({ coin }),
  setScheduleDay: (scheduleDay) => set({ scheduleDay }),
}));
