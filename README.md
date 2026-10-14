# Tracker

An offline-first PWA for students: grades, finances, schedule, notes and crypto quotes in one app. Everything is stored on the device in IndexedDB: there is no backend and no sign-up. The only network request is for crypto quotes (CoinGecko). The interface is in Russian, with a strict angular look: square corners, thick rules, one lime accent and large numbers.

The full spec (in Russian) is in [PROMPT.md](PROMPT.md). Every non-obvious decision is logged in [DECISIONS.md](DECISIONS.md).

## Quick start

Node.js 22.6 or newer.

```sh
npm install
npm run dev          # http://127.0.0.1:5173, opens the browser
```

On Windows PowerShell with script execution disabled, use `npm.cmd` instead of `npm`.

To see the app with data: **Настройки → Добавить демо-данные**.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server (no service worker) |
| `npm run typecheck` | TypeScript in strict mode |
| `npm test` | Vitest: all calculations, API parsing, export/import round-trip, schema migrations, colour contrast |
| `npm run build` | Type check and production build into `dist/`, with the service worker |
| `npm run preview` | Serve `dist/` at http://127.0.0.1:4173; install and offline mode work only here |
| `npm run smoke` | After `build`: a Playwright walk-through of every feature, including offline mode |
| `npm run screenshots` | After `build`: 390×844 and 1440×900 screenshots (dark, light, empty, demo) into `screenshots/`; fails on horizontal overflow at 320px or console errors |
| `npm run icons` | Re-render the PWA icons into `public/icons` |

`smoke`, `screenshots` and `icons` need Playwright's Chromium once: `npx playwright install chromium`.

`VITE_DEMO_MARKET=1 npm run dev` replaces CoinGecko with deterministic series from `src/lib/demoMarket.ts`. Use it offline or when the public API rate-limits you. In PowerShell: `$env:VITE_DEMO_MARKET='1'; npm.cmd run dev`.

## Features

- **Overview:** the home screen on both layouts. The desktop shows every section as a panel; on the phone it opens by tapping ТРЕКЕР. On Sundays it starts with a weekly summary.
- **Grades:** subjects (create, rename, archive), grades on a 1–5, 1–10 or 1–12 scale with weights 1–3, weighted averages, one-tap quick add, a weekly trend chart and a target calculator ("две десятки").
- **Finance:** expenses and income in minor units, balance, daily expense bars by week or month, filters, recurring transactions, monthly category limits (red at 80%) and a savings goal.
- **Plan:** a six-day timetable with the current lesson and a countdown, odd/even weeks and copy day; deadlines with a day countdown; a 25/5 focus timer with a 12-week activity grid.
- **Notes:** search, tags, pinning, subject link, autosave after 400 ms.
- **Market:** CoinGecko quotes refreshed every minute, a 1D/7D/30D polyline chart, a watch list of up to 10 coins, price alerts and a notional portfolio. The last saved prices stay visible offline.
- **Settings:** grade scale, currency (BYN by default), start balance, week parity, categories, theme (dark, light, system), JSON export and import (replace or merge), demo data, and delete everything (confirmed by typing УДАЛИТЬ).
- **Everywhere:** deleting has no dialogs; a square "ОТМЕНИТЬ" bar appears for 5 seconds instead.
- **Desktop only:** each section opens full screen in two columns. `Ctrl+K` opens quick entry (`оценка информатика 9`, `расход 6.4 транспорт`, `заметка идея для проекта`). Keys `1`–`5` open sections and `0` opens the overview.

## Structure

```
src/
  app/        shell (phone / desktop), hash router, UI state (Zustand), theme, undo and update bars
  design/     tokens.css, base.css, fonts, components: Panel, Stat, Chip, Segmented, Button, Field,
              Bar, EmptyState, Dialog, LineChart, Delta, Columns
  db/         Dexie schema and migrations, settings, export/import, demo data, recurring transactions
  features/   grades, finance, schedule, notes, market, overview, settings, tasks, focus, command
  lib/        pure logic with tests: dates, money, grades, grade calculator, recurring, schedule,
              notes, market, CoinGecko client, tasks, focus, budget, alerts, portfolio,
              quick-entry parser, weekly summary
  pwa/        service worker registration, install prompt, notifications
public/       favicon and PWA icons
scripts/      smoke test, screenshots, icons, CoinGecko mock for Playwright
```

## Data

- Money is stored as integer minor units (kopecks). Dates are `YYYY-MM-DD` strings. IDs come from `crypto.randomUUID()`.
- The Dexie schema is versioned (`SCHEMA_VERSION` in `src/db/db.ts`, currently 3), and the v1 → v3 migration is tested.
- Export is one JSON file with all user tables and a `version` field. Import validates it and offers replace or merge. Quote caches are not exported.
- `navigator.storage.persist()` is requested when the first user data is saved.

## Offline, quotes and install

- Workbox (via vite-plugin-pwa) precaches the whole shell: JS, CSS, fonts and icons. A new version shows a "ДОСТУПНО ОБНОВЛЕНИЕ" bar and reloads only on request.
- CoinGecko requests are network-first with a 4-second timeout and fall back to the cache. Quotes are also kept in IndexedDB with their timestamp ("ОБНОВЛЕНО 14:20").
- Quotes refresh every 60 seconds while the tab is visible, with at most one request per coin and period per minute. CoinGecko sends its 429 without CORS headers, so any failure while online backs off: 2, 4 and 8 minutes, up to 15.
- Install comes from the browser prompt (the "Установить" button in settings). On iOS, settings show a "Поделиться → На экран „Домой“" hint.

## Quality checks

- Type check, 113 unit tests and the build pass. The smoke test covers every feature, offline mode, the skip link and the focus ring.
- No border radius except 0, no shadows, gradients, blur, emoji or icon fonts. Colours come only from tokens, and there is no purple (also enforced by a test).
- Text contrast is at least 4.5:1 in both themes, tested against `tokens.css`. Lighthouse Accessibility is 100 on every phone screen. Best Practices is 96–100: it drops only when CoinGecko refuses a request and the browser logs the CORS error. Performance on the overview is 92 on the phone and 100 on the desktop.
- No horizontal scroll at 320px on any screen.

## Not done or done differently

- **Desktop layout:** at the owner's request, each section opens full screen instead of all living on one overview panel. The overview with every panel is still the home screen.
- **Plan section:** on the phone it is split into tabs (lessons, deadlines, focus) so the screen does not grow endlessly.
- **Price alerts:** these work only while the app is open. Push without a server is impossible, and the app has no server; settings say so.
- **Install and offline mode** were checked automatically (manifest, service worker control, offline reload with Playwright). On a real phone they need hosting over HTTPS, which is not set up.
- **Manifest:** generated by vite-plugin-pwa at build time rather than kept as `public/manifest.webmanifest`.
- **Quotes:** the keyless CoinGecko API is rate-limited per IP and shared with everyone on the same network. A Demo key would raise the limit, but keys must not ship in client code.
