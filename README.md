# Tracker

An offline-first PWA for students: grades, finances, schedule, notes and crypto quotes in one app. All data stays on the device in IndexedDB. The only network request is for crypto quotes (CoinGecko). The full spec (in Russian) is in [PROMPT.md](PROMPT.md); non-obvious decisions are logged in [DECISIONS.md](DECISIONS.md).

**Status:** stage 4 of 5. All five sections, the overview and settings work offline, plus the stage 4 extras: grade target calculator, deadlines, focus timer with an activity grid, category limits and a savings goal, price alerts, a notional portfolio, Ctrl+K quick entry and a Sunday weekly summary. On the desktop each section opens full screen; the overview shows them all as panels.

## Requirements

Node.js 22.6 or newer (the check scripts import TypeScript directly).

## Scripts

```sh
npm install
npm run dev          # dev server at http://127.0.0.1:5173 (opens the browser)
npm run typecheck    # TypeScript, strict
npm test             # Vitest: calculations, API parsing, export/import, migrations
npm run build        # type check + production build into dist/ (with the service worker)
npm run preview      # serve dist/; install and offline mode only work here, not in dev
npm run screenshots  # after build: 390×844 and 1440×900 screenshots into screenshots/
npm run smoke        # after build: Playwright walk-through, including offline mode
npm run icons        # re-render the PWA icons into public/icons
```

`screenshots`, `smoke` and `icons` need Playwright's Chromium once: `npx playwright install chromium`.

On Windows PowerShell with script execution disabled, use `npm.cmd` instead of `npm`.

### Demo quotes

`VITE_DEMO_MARKET=1 npm run dev` replaces CoinGecko with deterministic series from `src/lib/demoMarket.ts`. This is useful offline or when the public API rate-limits you. In PowerShell: `$env:VITE_DEMO_MARKET='1'; npm.cmd run dev`.

## Structure

```
src/
  app/        shell, navigation, hash router, UI state (Zustand), undo and update bars
  design/     tokens.css, base.css, fonts, components (Panel, Stat, Chip, Segmented, Button,
              Field, Bar, EmptyState, Dialog, LineChart, Delta, Columns)
  db/         Dexie schema and migrations, settings, export/import, demo data, recurring transactions
  features/   grades, finance, schedule, notes, market, overview, settings,
              tasks (deadlines), focus, command (Ctrl+K)
  lib/        pure logic with tests: dates, money, grades, grade calculator, recurring, schedule,
              notes, market, CoinGecko client, tasks, focus, budget, alerts, portfolio, quick-entry
              parser, weekly summary
  pwa/        service worker registration, install prompt, notifications
public/       favicon and PWA icons
scripts/      screenshot, smoke and icon scripts
```

## Data

- Money is stored as integer minor units (kopecks); dates as `YYYY-MM-DD` strings.
- The Dexie schema is versioned (`SCHEMA_VERSION` in `src/db/db.ts`, currently 3) and migrations are tested.
- Export is one JSON file with all user tables and a `version` field. Import validates it and offers replace or merge. Quote caches are not exported.

## Offline and quotes

- The service worker (Workbox via vite-plugin-pwa) precaches the whole shell: JS, CSS, fonts and icons.
- CoinGecko requests are network-first with a 4-second timeout and fall back to the cache. Responses are also stored in IndexedDB. The UI shows the last saved prices with the time ("ОБНОВЛЕНО 14:20").
- Quotes refresh every 60 seconds while the tab is visible. After a 429 the app waits 2, 4, 8 and at most 15 minutes before trying again.

## Keyboard (desktop)

- `Ctrl+K` / `Cmd+K`: quick entry, e.g. `оценка информатика 9`, `расход 6.4 транспорт`, `заметка идея для проекта`.
- `1`–`5`: open a section; `0`: the overview.

## Design rules

The look is defined by tokens in `src/design/tokens.css`. Use tokens only. No border radius, shadows, gradients, blur, emoji or icon fonts. Phone layout below 900px, desktop overview from 900px.
