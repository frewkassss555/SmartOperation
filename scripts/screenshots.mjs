// Run `npm run build` first. Serves dist/ with `vite preview` and captures the phone screens
// (390×844) and the desktop overview (1440×900) into screenshots/: once empty, once with demo
// data. Also fails on horizontal overflow at 320px and on console errors.
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { preview } from 'vite';
import { mockCoinGecko } from './mockMarket.mjs';

const OUT = 'screenshots';
const ROUTES = ['overview', 'grades', 'finance', 'schedule', 'notes', 'market', 'settings'];
const PORT = 4317;
const base = `http://127.0.0.1:${PORT}/`;

const server = await preview({ preview: { host: '127.0.0.1', port: PORT, strictPort: true }, logLevel: 'warn' });
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const problems = [];

/** A browser context with its own IndexedDB; optionally filled with demo data. */
async function session(width, height, withDemo) {
  // Service workers are blocked so their 'offline ready' notice does not cover the screenshots.
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, serviceWorkers: 'block' });
  await mockCoinGecko(context);
  const page = await context.newPage();
  page.on('pageerror', (err) => problems.push(`@${width}: ${err.message}`));
  page.on('console', (msg) => msg.type() === 'error' && problems.push(`@${width}: ${msg.text()}`));
  if (withDemo) {
    await page.goto(`${base}#/settings`);
    await page.getByRole('button', { name: 'Добавить демо-данные' }).click();
    await page.getByRole('button', { name: 'Демо-данные добавлены' }).waitFor();
    // Clear the 5-second notice so it does not cover the screenshots.
    await page.reload();
  }
  return { context, page };
}

async function shoot(page, route, file, { scrollToBottom = false } = {}) {
  await page.goto(`${base}#/${route}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const overflow = await page.evaluate(() =>
    Math.max(
      ...[document.documentElement, document.querySelector('main')]
        .filter(Boolean)
        .map((el) => el.scrollWidth - el.clientWidth),
    ),
  );
  if (overflow > 0) problems.push(`${route} @${page.viewportSize().width}: horizontal overflow ${overflow}px`);
  if (scrollToBottom) {
    await page.evaluate(() => document.querySelector('main')?.scrollTo(0, 1e6));
    await page.waitForTimeout(100);
  }
  if (file) await page.screenshot({ path: `${OUT}/${file}` });
}

try {
  for (const demo of [false, true]) {
    const prefix = demo ? 'demo-' : '';

    const phone = await session(390, 844, demo);
    for (const route of ROUTES) await shoot(phone.page, route, `${prefix}phone-${route}.png`);
    if (demo) {
      await shoot(phone.page, 'grades', null);
      await phone.page.getByRole('button', { name: /^Математика/ }).click();
      await phone.page.screenshot({ path: `${OUT}/demo-phone-quick-add.png` });
      await phone.page.getByRole('button', { name: 'Открыть предмет Математика' }).click();
      await phone.page.waitForTimeout(200);
      await phone.page.screenshot({ path: `${OUT}/demo-phone-subject.png` });
    }
    await phone.context.close();

    const small = await session(320, 640, demo);
    for (const route of ROUTES) await shoot(small.page, route, null);
    await small.context.close();

    const desk = await session(1440, 900, demo);
    await shoot(desk.page, 'overview', `${prefix}desktop-overview.png`);
    await shoot(desk.page, 'overview', `${prefix}desktop-overview-bottom.png`, { scrollToBottom: true });
    await shoot(desk.page, 'settings', `${prefix}desktop-settings.png`);
    await desk.context.close();
  }
} finally {
  await browser.close();
  // Keep-alive connections would hold close() open; drop them first.
  server.httpServer.closeAllConnections?.();
  await new Promise((resolve) => server.httpServer.close(resolve));
}

if (problems.length) {
  console.error([...new Set(problems)].join('\n'));
  process.exit(1);
}
console.log(`Screenshots saved to ${OUT}/, no overflow at 320px, no console errors.`);
