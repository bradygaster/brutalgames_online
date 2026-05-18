import { test, expect } from '@playwright/test';
import { trackConsoleErrors, waitForGameGrid } from './helpers.js';

test('homepage renders the shell cleanly with no console errors', async ({ page }) => {
  const consoleTracker = trackConsoleErrors(page);

  await page.goto('/');
  await waitForGameGrid(page);

  await expect(page).toHaveTitle(/BrutalGames\.online/);
  await expect(page.getByRole('heading', { name: /play brutal little games without the bloat/i })).toBeVisible();
  await expect(page.locator('#featured')).toBeVisible();
  await expect(page.locator('#games')).toBeVisible();
  await expect(page.locator('#about')).toBeVisible();
  await expect(page.locator('#featured-game .featured-card')).toBeVisible();
  await expect(page.locator('#game-grid .game-card')).toHaveCount(4);
  await expect(page.locator('#game-count')).toContainText('4 games in view');

  consoleTracker.assertNone();
});
