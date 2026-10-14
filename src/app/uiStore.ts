import { create } from 'zustand';
import type { Parity } from '../lib/schedule';

export type FinanceRange = 'week' | 'month';
export type ListPeriod = 'week' | 'month' | 'all';
export type MarketPeriod = '1' | '7' | '30';
export type CoinId = string;

type UiState = {
  financeRange: FinanceRange;
  financeListPeriod: ListPeriod;
  marketPeriod: MarketPeriod;
  coin: CoinId;
  /** Selected school day 0..5, or null to follow today. */
  scheduleDay: number | null;
  /** Week shown in the schedule when parity is on, or null for the current week's parity. */
  scheduleParity: Parity | null;
  setFinanceRange: (range: FinanceRange) => void;
  setFinanceListPeriod: (period: ListPeriod) => void;
  setMarketPeriod: (period: MarketPeriod) => void;
  setCoin: (coin: CoinId) => void;
  setScheduleDay: (day: number) => void;
  setScheduleParity: (parity: Parity) => void;
};

export const useUi = create<UiState>((set) => ({
  financeRange: 'week',
  financeListPeriod: 'month',
  marketPeriod: '7',
  coin: 'bitcoin',
  scheduleDay: null,
  scheduleParity: null,
  setFinanceRange: (financeRange) => set({ financeRange }),
  setFinanceListPeriod: (financeListPeriod) => set({ financeListPeriod }),
  setMarketPeriod: (marketPeriod) => set({ marketPeriod }),
  setCoin: (coin) => set({ coin }),
  setScheduleDay: (scheduleDay) => set({ scheduleDay }),
  setScheduleParity: (scheduleParity) => set({ scheduleParity }),
}));
