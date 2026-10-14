import { useFocusTicker } from '../features/focus/timer';
import { useMarketSync } from '../features/market/sync';
import { DESKTOP_QUERY, useMediaQuery } from './hooks';
import { DesktopShell } from './DesktopShell';
import { PhoneShell } from './PhoneShell';
import { useRoute } from './router';
import { UndoBar } from './UndoBar';

/** One code base, two layouts: phone below 900px, desktop overview from 900px. */
export function Shell() {
  const route = useRoute();
  const desktop = useMediaQuery(DESKTOP_QUERY);
  // Quotes are the only network traffic: refreshed while the app is open and visible.
  useMarketSync();
  // The focus timer keeps counting while any screen is open.
  useFocusTicker();
  return (
    <>
      {desktop ? <DesktopShell route={route} /> : <PhoneShell route={route} />}
      <UndoBar />
    </>
  );
}
