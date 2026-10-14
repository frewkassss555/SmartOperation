/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Reads the real tokens.css and checks WCAG contrast for every text role in both themes.
// (Vitest stubs CSS imports, so the file is read from disk.)
const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');

function tokens(block: string): Record<string, string> {
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})/g)].map((m) => [m[1]!, m[2]!]));
}

const blockAfter = (selector: string) => {
  const start = css.indexOf(selector);
  return css.slice(start, css.indexOf('}', start));
};

const dark = tokens(blockAfter(':root {'));
const light = { ...dark, ...tokens(blockAfter(":root[data-theme='light'] {")) };
const system = { ...dark, ...tokens(blockAfter(":root[data-theme='system'] {")) };

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

const TEXT_ROLES = ['text', 'text-soft', 'muted', 'accent', 'negative'];

describe.each([
  ['dark', dark],
  ['light', light],
])('%s theme contrast', (_, t) => {
  it.each(TEXT_ROLES)('%s is at least 4.5:1 on the ground and on panels', (role) => {
    expect(contrast(t[role]!, t.ground!)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t[role]!, t.panel!)).toBeGreaterThanOrEqual(4.5);
  });

  it('ground text on the accent and on the text colour (inverted items) is readable', () => {
    expect(contrast(t.ground!, t.accent!)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t.ground!, t.text!)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('theme blocks', () => {
  it('uses the light palette from the spec and keeps both light blocks identical', () => {
    expect(light.ground).toBe('#ECE8DC');
    expect(light.text).toBe('#101110');
    expect(light.accent).not.toBe(dark.accent);
    expect(system).toEqual(light);
  });

  it('has no purple anywhere', () => {
    for (const hex of [...Object.values(dark), ...Object.values(light)]) {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
      // Purple: red and blue both clearly above green.
      expect(r! > g! + 30 && b! > g! + 30).toBe(false);
    }
  });
});
