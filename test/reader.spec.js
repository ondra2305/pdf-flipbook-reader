import { test, expect } from '@playwright/test';

const PDF = '/test/tracemonkey.pdf';

async function open(page, query = '', pdf = PDF) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`/?pdf=${pdf}${query}`);
  await page.waitForFunction(() => window.__POC_READY__);
  return errors;
}

test('opens on the cover and flips by button and keyboard', async ({ page }) => {
  const errors = await open(page);
  const label = page.locator('#pageLabel');
  await expect(label).toHaveText('1 / 14');
  await page.click('#next');
  await expect(label).toHaveText('2 / 14');
  await page.waitForTimeout(800);
  await page.keyboard.press('ArrowRight');
  await expect(label).toHaveText('4 / 14');
  await page.waitForTimeout(800);
  await page.click('#prev');
  await expect(label).toHaveText('2 / 14');
  expect(errors).toEqual([]);
});

test('renders a selectable text layer only for the shown spread', async ({ page }) => {
  await open(page);
  await expect.poll(() => page.evaluate(() => window.__POC_RENDERED__())).toBeGreaterThan(2);
  await expect(page.locator('.textLayer span').first()).toBeAttached();
  await expect(page.locator('.textLayer')).toHaveCount(2);
});

test('hides the text layer of turning pages', async ({ page }) => {
  await open(page);
  await expect.poll(() => page.evaluate(() => window.__POC_RENDERED__())).toBeGreaterThan(2);
  const hidden = () => page.evaluate(() => [...document.querySelectorAll('.textLayer')]
    .filter((el) => el.parentElement.style.display !== 'none' && getComputedStyle(el).contentVisibility === 'hidden').length);
  await page.click('#next');
  await expect.poll(hidden, { intervals: [10] }).toBeGreaterThan(0);
  await expect.poll(hidden).toBe(0);
});

test('zooms and resets', async ({ page }) => {
  await open(page);
  await page.click('#zoomIn');
  await expect(page.locator('#zoomLabel')).toHaveText('150%');
  await page.keyboard.press('0');
  await expect(page.locator('#zoomLabel')).toHaveText('100%');
});

test('downloads the loaded PDF', async ({ page }) => {
  await open(page);
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#download')]);
  expect(download.suggestedFilename()).toBe('tracemonkey.pdf');
});

test('uses the filename parameter for title and download', async ({ page }) => {
  await open(page, '&filename=Issue%2012.pdf');
  await expect(page).toHaveTitle('Issue 12.pdf');
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#download')]);
  expect(download.suggestedFilename()).toBe('Issue 12.pdf');
});

test('opens a single-page PDF', async ({ page }) => {
  const errors = await open(page, '', '/test/one-page.pdf');
  await expect(page.locator('#pageLabel')).toHaveText('1 / 1');
  const stage = await page.locator('#stage').boundingBox();
  const sheet = await page.locator('#book .page').boundingBox();
  expect(Math.abs(sheet.x + sheet.width / 2 - (stage.x + stage.width / 2))).toBeLessThanOrEqual(2);
  await page.keyboard.press('ArrowRight');
  await page.click('#zoomIn');
  await expect(page.locator('#pageLabel')).toHaveText('1 / 1');
  await expect(page.locator('#error')).toBeEmpty();
  expect(errors).toEqual([]);
});

test('keeps the proportions of a differently sized page', async ({ page }) => {
  await open(page, '', '/test/mixed-sizes.pdf');
  await page.click('#next');
  await page.waitForTimeout(800);
  await page.click('#next');
  await expect(page.locator('#pageLabel')).toHaveText('4 / 5');
  await page.waitForTimeout(800);
  const layer = page.locator('.textLayer', { hasText: 'Landscape' });
  const [text, slot] = await layer.evaluate((el) => [el, el.parentElement].map((e) => e.getBoundingClientRect().toJSON()));
  expect(text.width / text.height).toBeCloseTo(842 / 595, 1);
  expect(Math.abs((text.top - slot.top) - (slot.bottom - text.bottom))).toBeLessThan(2);
  expect(Math.abs((text.left - slot.left) - (slot.right - text.right))).toBeLessThan(2);
});

test('frees pages far behind the current spread', async ({ page }) => {
  await open(page);
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(800);
  }
  await expect(page.locator('#pageLabel')).toHaveText('12 / 14');
  await expect.poll(() => page.evaluate(() => window.__POC_RENDERED__())).toBeLessThan(14);
});

test('hides fullscreen when the iframe does not allow it', async ({ page }) => {
  await open(page);
  await expect(page.locator('#fs')).toBeVisible();
  await page.setContent(`<iframe src="/?pdf=${PDF}" allow="fullscreen 'none'" width="800" height="600"></iframe>`);
  const frame = page.frameLocator('iframe');
  await expect(frame.locator('#pageLabel')).toHaveText('1 / 14');
  await expect(frame.locator('#fs')).toBeHidden();
});

test('applies URL parameters', async ({ page }) => {
  await open(page, '&lang=en&dl=0&tl=0');
  await expect(page.locator('#lang')).toHaveText('CZ');
  await expect(page.locator('#download')).toBeHidden();
  await expect(page.locator('.textLayer')).toHaveCount(0);
});

for (const [query, turning] of [['', 2], ['&mode=magazine', 1]]) {
  test(`turns ${turning} page(s) when flipping back to the cover${query}`, async ({ page }) => {
    await open(page, query);
    await page.click('#next');
    await page.waitForTimeout(1200);
    const max = page.evaluate(() => new Promise((resolve) => {
      let most = 0;
      const end = performance.now() + 1200;
      const tick = () => {
        const shown = [...document.querySelectorAll('#book .page')]
          .filter((el) => el.style.display === 'block' && !el.classList.contains('--simple'));
        most = Math.max(most, shown.length);
        if (performance.now() < end) requestAnimationFrame(tick);
        else resolve(most);
      };
      requestAnimationFrame(tick);
    }));
    await page.click('#prev');
    expect(await max).toBe(turning);
  });
}

test('fits the book to the page height and zooms from the top-left corner', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 760 });
  await open(page);
  const book = page.locator('#book');
  const cover = page.locator('#book .page').first();
  expect(Math.abs((await book.boundingBox()).height - (await cover.boundingBox()).height)).toBeLessThanOrEqual(1);
  await page.click('#zoomIn');
  const viewport = await page.locator('#viewport').boundingBox();
  const zoomed = await cover.boundingBox();
  expect(zoomed.x).toBeGreaterThanOrEqual(viewport.x - 1);
  expect(zoomed.y).toBeGreaterThanOrEqual(viewport.y - 1);
});

test('hides the unstyled page until the script has run', async ({ page }) => {
  let release;
  const held = new Promise((resolve) => { release = resolve; });
  await page.route('**/src/main.js*', async (route) => { await held; await route.continue(); });
  await page.goto(`/?pdf=${PDF}`, { waitUntil: 'commit' });
  await expect(page.locator('body')).toBeAttached();
  await expect(page.locator('#toolbar')).toBeHidden();
  release();
  await expect(page.locator('#toolbar')).toBeVisible();
});

test('explains a missing or invalid PDF', async ({ page }) => {
  await page.route((url) => url.pathname === '/missing.pdf', (route) => route.fulfill({ status: 404 }));
  await page.goto('/?pdf=/missing.pdf');
  await expect(page.locator('#error')).toHaveText('Chyba: Dokument nebyl nalezen.');
  await page.goto('/?pdf=/index.html&lang=en');
  await expect(page.locator('#error')).toHaveText('Error: The file is not a valid PDF.');
});

test.describe('touch', () => {
  test.use({ viewport: { width: 390, height: 760 }, hasTouch: true, isMobile: true });

  test('turns pages by tapping a side or swiping, but not by a long press', async ({ page }) => {
    await open(page);
    const cdp = await page.context().newCDPSession(page);
    const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
    const label = page.locator('#pageLabel');
    const box = await page.locator('#viewport').boundingBox();
    const y = box.y + box.height / 2;
    const right = box.x + box.width - 30;

    await page.touchscreen.tap(right, y);
    await expect(label).toHaveText('2 / 14');
    await page.waitForTimeout(900);

    await touch('touchStart', right, y);
    for (let i = 1; i <= 4; i++) {
      await page.waitForTimeout(100);
      await touch('touchMove', right - i * 40, y);
    }
    await touch('touchEnd', right - 160, y);
    await expect(label).toHaveText('3 / 14');
    await page.waitForTimeout(900);

    await page.touchscreen.tap(box.x + 30, y);
    await expect(label).toHaveText('2 / 14');
    await page.waitForTimeout(900);

    await touch('touchStart', right, y);
    await page.waitForTimeout(700);
    await touch('touchEnd', right, y);
    await page.waitForTimeout(900);
    await expect(label).toHaveText('2 / 14');
  });
});

test('rejects a missing or foreign PDF', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#error')).toContainText('?pdf=');
  await page.goto('/?pdf=https://example.com/x.pdf');
  await expect(page.locator('#error')).toContainText('stejného serveru');
});
