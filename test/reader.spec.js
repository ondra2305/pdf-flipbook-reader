import { test, expect } from '@playwright/test';

const PDF = '/test/tracemonkey.pdf';

async function open(page, query = '') {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`/?pdf=${PDF}${query}`);
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
