import { useSyncExternalStore } from 'react';
import { DEFAULT_ROUTE, parseHash, routeHref, type Route } from './routes';

// A minimal hash router: the hash is the single source of truth for the current screen.

function subscribe(onChange: () => void) {
  const handle = () => {
    normalizeHash();
    onChange();
  };
  window.addEventListener('hashchange', handle);
  return () => window.removeEventListener('hashchange', handle);
}

const getHash = () => window.location.hash;

/** Rewrites unknown or empty hashes to the default route without adding a history entry. */
export function normalizeHash() {
  if (parseHash(window.location.hash) === null) {
    history.replaceState(null, '', routeHref(DEFAULT_ROUTE));
  }
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, getHash);
  return parseHash(hash) ?? DEFAULT_ROUTE;
}
