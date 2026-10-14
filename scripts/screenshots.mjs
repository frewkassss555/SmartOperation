// Builds nothing: run `npm run build` first. Serves dist/ with `vite preview` and captures
// the phone screens (390×844) and the desktop overview (1440×900) into screenshots/.
// Also checks for horizontal overflow at 320px.
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { preview } from 'vite';

const OUT = 'screenshots';
const ROUTES = ['grades', 'finance', 'schedule', 'notes', 'market', 'settings'];

const server = await preview({ preview: { host: '127.0.0.1', port: 4317, strictPort: true }, logLevel: 'warn' });
const base = 'http://127.0.0.1:4317/';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const problems = [];

async function shoot(width, height, route, file, scrollToBottom = false) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  page.on('pageerror', (err) => problems.push(`${route} @${width}: ${err.message}`));
  page.on('console', (msg) => msg.type() === 'error' && problems.push(`${route} @${width}: ${msg.text()}`));
  await page.goto(`${base}#/${route}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  const overflow = await page.evaluate(() =>
    Math.max(
      ...[document.documentElement, document.querySelector('main')]
        .filter(Boolean)
        .map((el) => el.scrollWidth - el.clientWidth),
    ),
  );
  if (overflow > 0) problems.push(`${route} @${width}: horizontal overflow ${overflow}px`);
  if (scrollToBottom) {
    await page.evaluate(() => document.querySelector('main')?.scrollTo(0, 1e6));
    await page.waitForTimeout(100);
  }
  if (file) await page.screenshot({ path: `${OUT}/${file}` });
  await page.close();
}

try {
  for (const route of ROUTES) await shoot(390, 844, route, `phone-${route}.png`);
  for (const route of ROUTES) await shoot(320, 640, route, null);
  await shoot(1440, 900, 'grades', 'desktop-overview.png');
  await shoot(1440, 900, 'grades', 'desktop-overview-bottom.png', true);
  await shoot(1440, 900, 'settings', 'desktop-settings.png');
  await shoot(1000, 800, 'grades', 'desktop-narrow-bottom.png', true);
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`Screenshots saved to ${OUT}/, no overflow at 320px, no console errors.`);
