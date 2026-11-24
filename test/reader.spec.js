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

test('renders pages with a selectable text layer', async ({ page }) => {
  await open(page);
  await expect.poll(() => page.evaluate(() => window.__POC_RENDERED__())).toBeGreaterThan(2);
  await expect(page.locator('.textLayer span').first()).toBeAttached();
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

test('rejects a missing or foreign PDF', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#error')).toContainText('?pdf=');
  await page.goto('/?pdf=https://example.com/x.pdf');
  await expect(page.locator('#error')).toContainText('stejného serveru');
});
