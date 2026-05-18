import { test, expect } from '@playwright/test';
import { readGameRegistry, waitForGameGrid } from './helpers.js';

test('game cards render from games.json with the expected metadata', async ({ page }) => {
  const registry = await readGameRegistry();

  await page.goto('/');
  await waitForGameGrid(page);

  await expect(page.locator('#game-grid .game-card')).toHaveCount(registry.games.length);

  for (const game of registry.games) {
    const card = page.locator(`#game-grid .game-card[data-game-id="${game.id}"]`);
    await expect(card.getByRole('heading', { name: game.title })).toBeVisible();
    await expect(card).toContainText(game.description);
    await expect(card).toContainText(game.genre);
    await expect(card).toContainText(game.playerCount);
    for (const tag of game.tags) {
      await expect(card).toContainText(tag);
    }
  }
});
