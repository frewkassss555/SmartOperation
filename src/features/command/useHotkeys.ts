import { useEffect } from 'react';
import { routeHref, SECTIONS } from '../../app/routes';

const isEditable = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

/**
 * Desktop shortcuts: Ctrl/Cmd+K opens quick entry; 1–5 open sections and 0 the overview
 * (only when no field has focus and no dialog is open). KeyK by code, so it works in the Russian layout too.
 */
export function useHotkeys(openPalette: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.code === 'KeyK') {
        e.preventDefault();
        openPalette();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || isEditable(e.target)) return;
      if (document.querySelector('dialog[open]')) return;
      const digit = /^Digit(\d)$/.exec(e.code)?.[1];
      if (digit === undefined) return;
      if (digit === '0') window.location.hash = routeHref('overview');
      const section = SECTIONS[Number(digit) - 1];
      if (section && digit !== '0') window.location.hash = routeHref(section.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openPalette]);
}
