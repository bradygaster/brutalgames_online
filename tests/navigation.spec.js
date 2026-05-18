import { test, expect } from '@playwright/test';
import { waitForGameGrid } from './helpers.js';

test('primary navigation updates hash routes and browser history remains usable', async ({ page }) => {
  await page.goto('/');
  await waitForGameGrid(page);

  const nav = page.locator('.nav-list');

  await nav.getByRole('link', { name: 'Featured', exact: true }).click();
  await expect(page).toHaveURL(/#featured$/);

  await nav.getByRole('link', { name: 'Games', exact: true }).click();
  await expect(page).toHaveURL(/#games$/);

  await nav.getByRole('link', { name: 'About', exact: true }).click();
  await expect(page).toHaveURL(/#about$/);

  await page.goBack();
  await expect(page).toHaveURL(/#games$/);

  await page.goBack();
  await expect(page).toHaveURL(/#featured$/);
});
