import { DESKTOP_QUERY, useMediaQuery } from './hooks';
import { DesktopShell } from './DesktopShell';
import { PhoneShell } from './PhoneShell';
import { useRoute } from './router';

/** One code base, two layouts: phone below 900px, desktop overview from 900px. */
export function Shell() {
  const route = useRoute();
  const desktop = useMediaQuery(DESKTOP_QUERY);
  return desktop ? <DesktopShell route={route} /> : <PhoneShell route={route} />;
}
