# Tracker

An offline-first PWA for students: grades, finances, schedule, notes and crypto quotes in one app. All data stays on the device in IndexedDB. The full spec (in Russian) is in [PROMPT.md](PROMPT.md); non-obvious decisions are logged in [DECISIONS.md](DECISIONS.md).

**Status:** stage 2 of 5. Grades, finances, schedule, notes, overview and settings work on local data. Market quotes and offline install come in stage 3.

## Requirements

Node.js 20 or newer.

## Scripts

```sh
npm install
npm run dev          # dev server at http://127.0.0.1:5173 (opens the browser)
npm run typecheck    # TypeScript, strict
npm test             # Vitest: calculations, export/import round-trip
npm run build        # type check + production build into dist/
npm run preview      # serve dist/
npm run screenshots  # after build: 390×844 and 1440×900 screenshots into screenshots/
npm run smoke        # after build: Playwright walk-through of add/edit/delete/undo
```

`screenshots` and `smoke` need Playwright's Chromium once: `npx playwright install chromium`.

On Windows PowerShell with script execution disabled, use `npm.cmd` instead of `npm`.

## Structure

```
src/
  app/        shell, navigation, hash router, UI state (Zustand), undo bar
  design/     tokens.css, base.css, fonts, components (Panel, Stat, Chip, Segmented, Button,
              Field, Bar, EmptyState, Dialog, LineChart)
  db/         Dexie schema, settings, export/import, demo data, recurring transactions
  features/   grades, finance, schedule, notes, market, overview, settings
  lib/        pure calculations with tests: dates, money, grades, recurring, schedule, notes
public/       static assets
scripts/      screenshot and smoke checks
```

## Data

- Money is stored as integer minor units (kopecks); dates as `YYYY-MM-DD` strings.
- The Dexie schema is versioned (`SCHEMA_VERSION` in `src/db/db.ts`); add a new `version(n)` block for migrations.
- Export is one JSON file with all tables and a `version` field. Import validates it and offers replace or merge.

## Design rules

The look is defined by tokens in `src/design/tokens.css`. Use tokens only. No border radius, shadows, gradients, blur, emoji or icon fonts. Phone layout below 900px, desktop overview from 900px.
