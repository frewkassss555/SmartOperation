import { create } from 'zustand';

export type Theme = 'dark' | 'light' | 'system';

// A per-device preference, so it lives in localStorage; index.html applies it before the
// first paint to avoid a dark flash in the light theme.
const KEY = 'tracker.theme';

function read(): Theme {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'light' || value === 'system' ? value : 'dark';
  } catch {
    return 'dark';
  }
}

/** Keeps the browser UI colour (address bar, PWA title bar) in step with the theme. */
function syncThemeColor() {
  const ground = getComputedStyle(document.documentElement).getPropertyValue('--ground').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', ground || '#101110');
}

export const useTheme = create<{ theme: Theme }>(() => ({ theme: read() }));

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Storage blocked: the theme still applies for this visit.
  }
  document.documentElement.dataset.theme = theme;
  useTheme.setState({ theme });
  syncThemeColor();
}

export function setupTheme() {
  document.documentElement.dataset.theme = useTheme.getState().theme;
  syncThemeColor();
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', syncThemeColor);
}
