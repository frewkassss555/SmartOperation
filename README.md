# Tracker

An offline-first PWA for students: grades, finances, schedule, notes and crypto quotes in one app. All data stays on the device. The full spec (in Russian) is in [PROMPT.md](PROMPT.md); non-obvious decisions are logged in [DECISIONS.md](DECISIONS.md).

**Status:** stage 1 of 5 (scaffold and design system). The five sections are empty stubs.

## Requirements

Node.js 20 or newer.

## Scripts

```sh
npm install
npm run dev          # dev server at http://localhost:5173
npm run typecheck    # TypeScript, strict
npm test             # Vitest unit tests
npm run build        # type check + production build into dist/
npm run preview      # serve dist/
npm run screenshots  # after build: 390×844 and 1440×900 screenshots into screenshots/
```

`npm run screenshots` needs Playwright's Chromium once: `npx playwright install chromium`.

## Structure

```
src/
  app/        shell, navigation, hash router, UI state (Zustand)
  design/     tokens.css, base.css, fonts, components: Panel, Stat, Chip, Segmented, Button, Field, Bar, EmptyState
  features/   one folder per section: grades, finance, schedule, notes, market, settings
  lib/        pure helpers (dates) with tests
public/       static assets
scripts/      screenshot check
```

## Design rules

The look is defined by tokens in `src/design/tokens.css`. Use tokens only. No border radius, shadows, gradients, blur, emoji or icon fonts. Phone layout below 900px, desktop overview from 900px.
