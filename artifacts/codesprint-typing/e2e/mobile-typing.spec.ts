import { expect, test } from '@playwright/test';

test.use({
  hasTouch: true,
  isMobile: true,
  viewport: { width: 390, height: 844 },
});

test.describe('mobile typing flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.route('https://fonts.gstatic.com/**', route => route.abort());
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('keeps focus through a run and does not save an abandoned drill', async ({ page }) => {
    await expect(page.getByTestId('button-start-run')).toBeVisible();
    await page.getByTestId('button-start-run').click();

    const captureInput = page.getByTestId('input-code-capture');
    const codePanel = page.getByTestId('code-panel');
    const bottomNav = page.getByTestId('mobile-bottom-nav');

    await expect(captureInput).toBeFocused();
    await codePanel.click();
    await expect(captureInput).toBeFocused();

    const panelBox = await codePanel.boundingBox();
    const navBox = await bottomNav.boundingBox();
    expect(panelBox).not.toBeNull();
    expect(navBox).not.toBeNull();
    expect(panelBox!.y + panelBox!.height).toBeLessThanOrEqual(navBox!.y);

    await page.keyboard.type('g');
    await expect(page.locator('.code-correct')).toHaveCount(1);
    await page.keyboard.type('x');
    await expect(page.locator('.code-wrong')).toHaveCount(1);
    await page.keyboard.press('Backspace');
    await expect(page.locator('.code-wrong')).toHaveCount(0);
    await expect(captureInput).toBeFocused();

    await page.getByTestId('button-abandon-run').click();
    await expect(page.getByTestId('button-start-run')).toBeVisible();
    await expect(page.getByTestId('input-code-capture')).toHaveCount(0);
    expect(await page.evaluate(() => window.localStorage.getItem('codesprint_runs'))).toBe('[]');
  });
});