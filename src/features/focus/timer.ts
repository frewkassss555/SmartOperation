import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect } from 'react';
import { create } from 'zustand';
import { notify } from '../../app/undo';
import { db, newId } from '../../db/db';
import { requestPersistenceOnce } from '../../db/settings';
import type { FocusSession } from '../../db/types';
import { toIsoDate } from '../../lib/date';
import { BREAK_MIN, FOCUS_MIN } from '../../lib/focus';

export type Phase = 'idle' | 'focus' | 'break';

type TimerState = {
  phase: Phase;
  /** End of the running interval (epoch ms), or null while paused or idle. */
  endsAt: number | null;
  /** Milliseconds left while paused. */
  pausedLeft: number | null;
  /** Length of the current focus interval in ms (for partial sessions). */
  length: number;
  subjectId: string | undefined;
};

// The timer survives reloads: its small state lives in localStorage on this device.
const KEY = 'tracker.focus';
const IDLE: TimerState = { phase: 'idle', endsAt: null, pausedLeft: null, length: FOCUS_MIN * 60_000, subjectId: undefined };

function load(): TimerState {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...IDLE, ...(JSON.parse(raw) as Partial<TimerState>) } : IDLE;
  } catch {
    return IDLE;
  }
}

export const useTimer = create<TimerState>(() => load());

useTimer.subscribe((state) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Private mode or storage blocked: the timer just will not survive a reload.
  }
});

export const timeLeft = (s: TimerState, now = Date.now()) => (s.endsAt !== null ? s.endsAt - now : (s.pausedLeft ?? s.length));

export function setFocusSubject(subjectId: string | undefined) {
  useTimer.setState({ subjectId });
}

export function startFocus() {
  const length = FOCUS_MIN * 60_000;
  useTimer.setState({ phase: 'focus', endsAt: Date.now() + length, pausedLeft: null, length });
}

export function pauseTimer() {
  const s = useTimer.getState();
  if (s.endsAt === null) return;
  useTimer.setState({ endsAt: null, pausedLeft: Math.max(0, s.endsAt - Date.now()) });
}

export function resumeTimer() {
  const s = useTimer.getState();
  if (s.pausedLeft === null) return;
  useTimer.setState({ endsAt: Date.now() + s.pausedLeft, pausedLeft: null });
}

async function record(minutes: number, subjectId: string | undefined) {
  if (minutes < 1) return;
  const session: FocusSession = { id: newId(), subjectId, minutes, date: toIsoDate(new Date()), endedAt: Date.now() };
  await db.focus.add(session);
  void requestPersistenceOnce();
}

/** Stops early; a focus interval counts the whole minutes already spent. */
export async function stopTimer() {
  const s = useTimer.getState();
  const spent = s.length - timeLeft(s);
  const subjectId = s.subjectId;
  const wasFocus = s.phase === 'focus';
  useTimer.setState({ ...IDLE, subjectId });
  if (wasFocus) {
    const minutes = Math.floor(spent / 60_000);
    await record(minutes, subjectId);
    if (minutes >= 1) notify(`Фокус: засчитано ${minutes} мин`);
  }
}

/** Called every second: finishes the interval when its time is up. */
async function tick() {
  const s = useTimer.getState();
  if (s.endsAt === null || s.endsAt > Date.now()) return;
  if (s.phase === 'focus') {
    const length = BREAK_MIN * 60_000;
    useTimer.setState({ phase: 'break', endsAt: Date.now() + length, pausedLeft: null, length });
    await record(Math.round(s.length / 60_000), s.subjectId);
    notify(`Фокус ${FOCUS_MIN} мин готов · перерыв ${BREAK_MIN} мин`);
  } else {
    useTimer.setState({ ...IDLE, subjectId: s.subjectId });
    notify('Перерыв закончился');
  }
}

/** Runs the timer clock while the app is open (mounted once in the shell). */
export function useFocusTicker() {
  const running = useTimer((s) => s.endsAt !== null);
  useEffect(() => {
    if (!running) return;
    void tick();
    const timer = window.setInterval(() => void tick(), 1000);
    return () => window.clearInterval(timer);
  }, [running]);
}

export function useFocusSessions(): FocusSession[] | undefined {
  return useLiveQuery(() => db.focus.toArray(), []);
}
