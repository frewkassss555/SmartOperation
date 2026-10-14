import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { DEFAULT_SETTINGS, type Settings } from './types';

/** Current settings; defaults while loading or if the row is missing. */
export function useSettings(): Settings {
  const stored = useLiveQuery(() => db.settings.get('app'), []);
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function updateSettings(patch: Partial<Omit<Settings, 'id'>>): Promise<void> {
  await db.transaction('rw', db.settings, async () => {
    const current = (await db.settings.get('app')) ?? DEFAULT_SETTINGS;
    await db.settings.put({ ...current, ...patch, id: 'app' });
  });
}

/**
 * Ask the browser not to evict our storage. Called after the first piece of user data
 * is saved; asked once per device.
 */
export async function requestPersistenceOnce(): Promise<void> {
  const current = await db.settings.get('app');
  if (current?.persistAsked) return;
  await updateSettings({ persistAsked: true });
  try {
    await navigator.storage?.persist?.();
  } catch {
    // Not supported or denied: data still lives in IndexedDB, just without the guarantee.
  }
}
