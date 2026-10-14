import { registerSW } from 'virtual:pwa-register';
import { create } from 'zustand';
import { notify } from '../app/undo';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type PwaState = {
  /** A new version is waiting; calling `update` activates it and reloads. */
  needRefresh: boolean;
  update: () => void;
  /** Saved `beforeinstallprompt` event, or null when the browser does not offer install. */
  installEvent: BeforeInstallPromptEvent | null;
  installed: boolean;
};

export const usePwa = create<PwaState>(() => ({
  needRefresh: false,
  update: () => undefined,
  installEvent: null,
  installed: false,
}));

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** iPhone and iPad (including iPadOS that reports itself as a Mac). */
export function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export async function promptInstall(): Promise<void> {
  const event = usePwa.getState().installEvent;
  if (!event) return;
  await event.prompt();
  const { outcome } = await event.userChoice;
  usePwa.setState({ installEvent: null, installed: outcome === 'accepted' });
}

/** Registers the service worker and the install listeners. Call once at startup. */
export function setupPwa(): void {
  usePwa.setState({ installed: isStandalone() });

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    usePwa.setState({ installEvent: event as BeforeInstallPromptEvent });
  });
  window.addEventListener('appinstalled', () => usePwa.setState({ installEvent: null, installed: true }));

  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;
  const updateSW = registerSW({
    onNeedRefresh: () => usePwa.setState({ needRefresh: true, update: () => void updateSW(true) }),
    onOfflineReady: () => notify('Готово к работе без сети'),
  });
}
