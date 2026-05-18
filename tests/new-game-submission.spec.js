import { test, expect } from '@playwright/test';
import {
  captureScreenshot,
  injectGameRegistry,
  newRegistryFixturePath,
  readGameRegistry,
  trackConsoleErrors,
  waitForGameGrid
} from './helpers.js';

test('new game submissions appear in the lobby and launch correctly', async ({ page }, testInfo) => {
  const consoleTracker = trackConsoleErrors(page);
  const registry = await readGameRegistry();

  await injectGameRegistry(page, newRegistryFixturePath);
  await page.goto('/');
  await waitForGameGrid(page);

  await expect(page.locator('#game-grid .game-card')).toHaveCount(registry.games.length + 1);

  const card = page.locator('#game-grid .game-card[data-game-id="test-lab-showcase"]');
  await expect(card.getByRole('heading', { name: 'Test Lab Showcase' })).toBeVisible();
  await expect(card).toContainText('A bright little fixture game used for PR validation and demo recordings.');
  await expect(card).toContainText('Arcade');
  await expect(card).toContainText('1 player');
  await captureScreenshot(page, testInfo, 'new-game-card');

  await card.getByRole('button', { name: /launch game/i }).click();
  await expect(page.locator('#game-launcher-title')).toHaveText(/now playing: test lab showcase/i);
  await expect(page.frameLocator('#game-frame').getByText('Hello from Test Game')).toBeVisible();
  await captureScreenshot(page, testInfo, 'new-game-launch');

  await page.getByRole('button', { name: /close/i }).click();
  consoleTracker.assertNone();
});
