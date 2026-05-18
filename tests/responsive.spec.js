import { test, expect } from '@playwright/test';
import { expectedGridColumns, waitForGameGrid } from './helpers.js';

test('grid responds to viewport breakpoints and navigation remains usable on mobile', async ({ page }) => {
  await page.goto('/');
  await waitForGameGrid(page);

  const viewportWidth = page.viewportSize()?.width ?? 1440;
  const expectedColumns = expectedGridColumns(viewportWidth);
  const templateColumns = await page.locator('#game-grid').evaluate((element) => getComputedStyle(element).gridTemplateColumns);
  const actualColumns = templateColumns.split(' ').filter(Boolean).length;

  expect(actualColumns).toBe(expectedColumns);

  if (viewportWidth < 640) {
    const navDirection = await page.locator('.site-nav').evaluate((element) => getComputedStyle(element).flexDirection);
    expect(navDirection).toBe('column');
  }

  await page.locator('.nav-list').getByRole('link', { name: 'Games', exact: true }).click();
  await expect(page).toHaveURL(/#games$/);
});
