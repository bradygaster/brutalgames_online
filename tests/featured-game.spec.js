import { test, expect } from '@playwright/test';
import { readGameRegistry, waitForGameGrid } from './helpers.js';

test('featured section highlights the flagged game with larger presentation', async ({ page }) => {
  const registry = await readGameRegistry();
  const featuredGame = registry.games.find((game) => game.featured);

  await page.goto('/');
  await waitForGameGrid(page);

  const featuredCard = page.locator(`#featured-game .featured-card[data-game-id="${featuredGame.id}"]`);
  const firstGridCard = page.locator('#game-grid .game-card').first();

  await expect(featuredCard).toBeVisible();
  await expect(featuredCard.getByRole('heading', { name: featuredGame.title })).toBeVisible();
  await expect(featuredCard).toContainText(featuredGame.description);
  await expect(featuredCard).toContainText(featuredGame.genre);
  await expect(featuredCard).toContainText(featuredGame.playerCount);
  await expect(featuredCard.getByRole('button', { name: /unavailable/i })).toBeDisabled();

  const viewportWidth = page.viewportSize()?.width ?? 1440;
  if (viewportWidth >= 640) {
    const featuredBox = await featuredCard.boundingBox();
    const gridBox = await firstGridCard.boundingBox();
    expect(featuredBox?.width ?? 0).toBeGreaterThan(gridBox?.width ?? 0);
  } else {
    const featuredImage = featuredCard.locator('.game-thumb img');
    await expect(featuredImage).toBeVisible();
  }
});
