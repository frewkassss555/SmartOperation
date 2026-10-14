import { describe, expect, it } from 'vitest';
import { parseHash, routeHref } from './routes';

describe('hash routes', () => {
  it('parses known routes', () => {
    expect(parseHash('#/grades')).toBe('grades');
    expect(parseHash('#/market')).toBe('market');
    expect(parseHash('#/settings')).toBe('settings');
    expect(parseHash('#/notes/123')).toBe('notes');
    expect(parseHash('#finance')).toBe('finance');
  });

  it('rejects unknown and empty hashes', () => {
    expect(parseHash('')).toBeNull();
    expect(parseHash('#/')).toBeNull();
    expect(parseHash('#/nope')).toBeNull();
  });

  it('builds hrefs', () => {
    expect(routeHref('schedule')).toBe('#/schedule');
  });
});
