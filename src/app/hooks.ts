import { useEffect, useState, useSyncExternalStore } from 'react';

/** Phone and desktop layouts switch at this width. */
export const DESKTOP_QUERY = '(min-width: 900px)';

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
  );
}

/** Current time, refreshed every `intervalMs` (for countdowns). */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}

/** The current date, refreshed once a minute so the UI rolls over at midnight. */
export function useToday(): Date {
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = new Date();
      setToday((prev) => (prev.toDateString() === now.toDateString() ? prev : now));
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return today;
}
