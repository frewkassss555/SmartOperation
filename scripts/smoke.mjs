// End-to-end smoke test on the production build: add, edit, delete with undo, autosave,
// persistence across reload, delete-all. Run `npm run build` first.
import { chromium } from 'playwright';
import { preview } from 'vite';

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
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
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

  await context.close();
  console.log('Smoke test passed.');
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}

if (errors.length) {
  console.error('Console errors:\n' + [...new Set(errors)].join('\n'));
  process.exitCode = 1;
}
