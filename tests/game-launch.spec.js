import { test, expect } from '@playwright/test';
import { trackConsoleErrors, waitForGameGrid } from './helpers.js';

test('launching a game opens the iframe overlay and can be closed by button or Escape', async ({ page }) => {
  const consoleTracker = trackConsoleErrors(page);

  await page.goto('/');
  await waitForGameGrid(page);

  const card = page.locator('#game-grid .game-card[data-game-id="grid-warden"]');
  await card.getByRole('button', { name: /launch game/i }).click();

  const dialog = page.locator('#game-launcher');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('open', '');
  await expect(page.locator('#game-launcher-title')).toHaveText(/now playing: grid warden/i);
  await expect(page.frameLocator('#game-frame').getByRole('heading', { name: /grid warden test cabinet/i })).toBeVisible();

  await page.getByRole('button', { name: /close/i }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('#game-frame')).toHaveAttribute('src', 'about:blank');

  await card.getByRole('button', { name: /launch game/i }).click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('#game-frame')).toHaveAttribute('src', 'about:blank');

  consoleTracker.assertNone();
});
