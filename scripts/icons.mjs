// Renders the app icons into public/icons with Playwright (no image libraries needed).
// Icon: a #101110 square with a lime square in the centre, no rounding.
// The maskable icon keeps the lime square inside the 80% safe zone.
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const GROUND = '#101110';
const ACCENT = '#D7FF3D';

const ICONS = [
  { file: 'icon-192.png', size: 192, inner: 0.42 },
  { file: 'icon-512.png', size: 512, inner: 0.42 },
  { file: 'maskable-512.png', size: 512, inner: 0.34 },
  { file: 'apple-touch-icon.png', size: 180, inner: 0.42 },
];

await mkdir('public/icons', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();

for (const { file, size, inner } of ICONS) {
  const side = Math.round(size * inner);
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<body style="margin:0;width:${size}px;height:${size}px;background:${GROUND};display:grid;place-items:center">
       <div style="width:${side}px;height:${side}px;background:${ACCENT}"></div>
     </body>`,
  );
  await page.screenshot({ path: `public/icons/${file}`, omitBackground: false });
}

await browser.close();
console.log(`Icons written to public/icons: ${ICONS.map((i) => i.file).join(', ')}`);
