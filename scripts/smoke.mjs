// End-to-end smoke test on the production build: add, edit, delete with undo, autosave,
// persistence across reload, delete-all. Run `npm run build` first.
import { chromium } from 'playwright';
import { preview } from 'vite';
import { mockCoinGecko } from './mockMarket.mjs';

const PORT = 4319;
const base = `http://127.0.0.1:${PORT}/`;
const server = await preview({ preview: { host: '127.0.0.1', port: PORT, strictPort: true }, logLevel: 'warn' });
const browser = await chromium.launch();
const errors = [];
let step = '';

const expectVisible = async (locator, what) => {
  try {
    await locator.first().waitFor({ state: 'visible', timeout: 3000 });
  } catch {
    throw new Error(`${step}: not visible: ${what}`);
  }
};
const expectGone = async (locator, what) => {
  try {
    await locator.first().waitFor({ state: 'detached', timeout: 3000 });
  } catch {
    throw new Error(`${step}: still visible: ${what}`);
  }
};

try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await mockCoinGecko(context);
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  const dialog = page.getByRole('dialog');
  const undo = page.getByRole('button', { name: 'Отменить' });

  step = 'grades: add subject';
  await page.goto(`${base}#/grades`);
  await page.getByRole('button', { name: 'Добавить предмет +' }).click();
  await dialog.getByLabel('Название').fill('Физика');
  await dialog.getByRole('button', { name: 'Добавить' }).click();
  await expectVisible(page.getByRole('button', { name: /Физика/ }), 'subject row');

  step = 'grades: quick add + undo';
  const quick = page.getByRole('group', { name: 'Поставить оценку: Физика' });
  await quick.getByRole('button', { name: '7', exact: true }).click();
  const plate7 = page.getByRole('button', { name: 'Оценка 7, изменить' });
  await expectVisible(plate7, 'plate 7');
  await undo.click();
  await expectGone(plate7, 'plate 7 after undo');
  await quick.getByRole('button', { name: '9', exact: true }).click();
  const plate9 = page.getByRole('button', { name: 'Оценка 9, изменить' });
  await expectVisible(plate9, 'plate 9');

  step = 'grades: delete + undo';
  await plate9.click();
  await dialog.getByRole('button', { name: 'Удалить' }).click();
  await expectGone(plate9, 'plate 9 after delete');
  await undo.click();
  await expectVisible(plate9, 'plate 9 after undo');

  step = 'finance: add expense';
  await page.goto(`${base}#/finance`);
  await page.getByRole('button', { name: 'Добавить операцию +' }).click();
  await dialog.getByLabel(/Сумма/).fill('6,4');
  await dialog.getByLabel('Категория').selectOption('Транспорт');
  await dialog.getByLabel('Название').fill('Проезд');
  await dialog.getByRole('button', { name: 'Сохранить' }).click();
  await expectVisible(page.getByText('−6,40 Br'), 'expense row');
  await expectVisible(page.getByText('Проезд'), 'expense title');

  step = 'notes: create with autosave';
  await page.goto(`${base}#/notes`);
  await page.getByRole('button', { name: 'Новая заметка +' }).click();
  await dialog.getByLabel('Заголовок').fill('Проверка');
  await dialog.getByLabel('Текст').fill('Автосохранение работает');
  await expectVisible(page.getByText('Заметка · сохранено'), 'saved status');
  await dialog.getByRole('button', { name: 'Готово' }).click();
  await expectVisible(page.getByRole('button', { name: /Проверка/ }), 'note card');

  step = 'schedule: add lesson';
  await page.goto(`${base}#/schedule`);
  await page.getByRole('button', { name: 'Добавить урок +' }).click();
  await dialog.getByLabel('Кабинет').fill('305');
  await dialog.getByRole('button', { name: 'Сохранить' }).click();
  await expectVisible(page.getByText('305'), 'lesson room');

  step = 'schedule: deadline';
  await page.getByRole('button', { name: 'Добавить +' }).click();
  await dialog.getByLabel('Задача').fill('Реферат');
  await dialog.getByRole('button', { name: 'Сохранить' }).click();
  await expectVisible(page.getByText('Через 7 дней'), 'deadline countdown');
  // The checked task moves to the collapsed "done" list, so click rather than check().
  await page.getByRole('checkbox', { name: 'Выполнено: Реферат' }).click();
  await expectVisible(page.getByText('Выполнено · 1'), 'done counter');
  await undo.click();
  await expectVisible(page.getByText('Через 7 дней'), 'deadline back after undo');
  await page.getByRole('checkbox', { name: 'Выполнено: Реферат' }).click();
  await expectVisible(page.getByText('Выполнено · 1'), 'done again');

  step = 'persistence after reload';
  await page.reload();
  await page.goto(`${base}#/notes`);
  await expectVisible(page.getByRole('button', { name: /Проверка/ }), 'note after reload');

  step = 'overview';
  await page.goto(`${base}#/overview`);
  await expectVisible(page.getByText('9,0'), 'average on overview');

  step = 'settings: delete all';
  await page.goto(`${base}#/settings`);
  await page.getByRole('button', { name: 'Удалить всё' }).click();
  await dialog.getByLabel('Введите УДАЛИТЬ').fill('удалить');
  await dialog.getByRole('button', { name: 'Удалить навсегда' }).click();
  await page.goto(`${base}#/grades`);
  await expectVisible(page.getByText('Предметов пока нет'), 'empty grades');

  step = 'market: quotes, period, watch list';
  await page.goto(`${base}#/market`);
  await expectVisible(page.getByText(/^\$81\u00a08\d\d$/), 'BTC price');
  await expectVisible(page.getByText(/^Обновлено \d\d:\d\d$/), 'updated time');
  await page.getByRole('button', { name: '30Д' }).click();
  await expectVisible(page.getByText('Макс. за 30Д'), '30-day range');
  await page.getByRole('button', { name: 'Изменить список' }).click();
  await dialog.getByLabel('Добавить монету').fill('doge');
  await dialog.getByRole('button', { name: 'Добавить', exact: true }).click();
  await expectVisible(dialog.getByRole('button', { name: 'Убрать DOGE' }), 'DOGE in watch list');
  await dialog.getByRole('button', { name: 'Готово' }).click();
  await page.getByRole('button', { name: /^DOGE/ }).click();
  await expectVisible(page.getByText(/Dogecoin · DOGE \/ USD/), 'DOGE selected');

  await context.close();

  step = 'desktop: sections open full screen';
  const desk = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  await mockCoinGecko(desk);
  const dp = await desk.newPage();
  dp.on('pageerror', (e) => errors.push(e.message));
  await dp.goto(base);
  await expectVisible(dp.getByRole('link', { name: 'Открыть раздел Финансы на весь экран' }), 'overview panels');
  await dp.getByRole('link', { name: 'Открыть раздел Финансы на весь экран' }).click();
  await expectVisible(dp.getByRole('heading', { level: 1, name: 'Финансы' }), 'finance page');
  await dp.getByRole('navigation', { name: 'Разделы' }).getByRole('link', { name: /План/ }).click();
  await expectVisible(dp.getByRole('heading', { level: 1, name: 'Расписание' }), 'schedule page');
  await dp.getByRole('link', { name: 'Трекер, обзор' }).click();
  await expectVisible(dp.getByRole('link', { name: 'Открыть раздел Оценки на весь экран' }), 'back to overview');
  await desk.close();

  step = 'pwa: manifest and offline';
  const offline = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await mockCoinGecko(offline);
  const app = await offline.newPage();
  app.on('pageerror', (e) => errors.push(e.message));
  const manifest = await (await offline.request.get(`${base}manifest.webmanifest`)).json();
  if (manifest.display !== 'standalone' || manifest.lang !== 'ru' || manifest.theme_color !== '#101110' || manifest.icons.length !== 3) {
    throw new Error(`${step}: unexpected manifest ${JSON.stringify(manifest)}`);
  }
  await app.goto(`${base}#/market`);
  await app.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await app.reload();
  await app.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await expectVisible(app.getByText(/^\$81\u00a08\d\d$/), 'price before going offline');
  await offline.unrouteAll();
  await offline.setOffline(true);
  await app.reload();
  await expectVisible(app.getByRole('heading', { name: 'Рынок' }), 'app shell offline');
  await expectVisible(app.getByText(/^\$81\u00a08\d\d$/), 'saved price offline');
  await expectVisible(app.getByText(/^Обновлено \d\d:\d\d$/), 'saved time offline');
  await expectVisible(app.getByText(/Нет сети/), 'offline status');
  for (const [route, text] of [
    ['grades', 'Предметов пока нет'],
    ['finance', 'Операций пока нет'],
    ['schedule', /уроков нет/],
    ['notes', 'Заметок пока нет'],
  ]) {
    await app.goto(`${base}#/${route}`);
    await expectVisible(app.getByText(text), `${route} offline`);
  }
  await offline.close();

  console.log('Smoke test passed.');
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  // Keep-alive connections would hold close() open; drop them first.
  server.httpServer.closeAllConnections?.();
  await new Promise((resolve) => server.httpServer.close(resolve));
}

if (errors.length) {
  console.error('Console errors:\n' + [...new Set(errors)].join('\n'));
  process.exitCode = 1;
}
