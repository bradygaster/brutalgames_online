import { test, expect } from '@playwright/test';
import { injectGameRegistry, readGameRegistry, trackConsoleErrors, waitForGameGrid } from './helpers.js';

const BAD_REGISTRY_DATE = '2026-05-18T16:31:59-07:00';

test('missing thumbnails fall back to generated artwork', async ({ page }) => {
  const registry = await readGameRegistry();
  const fallbackRegistry = {
    ...registry,
    games: registry.games.map((game, index) =>
      index === 0
        ? {
            ...game,
            thumbnail: './assets/thumbnails/definitely-missing.png'
          }
        : game
    )
  };

  await injectGameRegistry(page, fallbackRegistry);
  await page.goto('/');
  await waitForGameGrid(page);

  const featuredImage = page.locator('#featured-game img').first();
  await expect.poll(async () => await featuredImage.getAttribute('src')).toMatch(/^data:image\/svg\+xml/);
});

test('invalid game data is ignored without breaking the rest of the lobby', async ({ page }) => {
  const consoleTracker = trackConsoleErrors(page);
  const registry = await readGameRegistry();
  const validGame = registry.games.find((game) => game.id === 'grid-warden');

  await injectGameRegistry(page, {
    schemaVersion: 1,
    generatedAt: BAD_REGISTRY_DATE,
    games: [
      validGame,
      null,
      'bad-entry',
      {
        id: '',
        title: '   ',
        description: 'This should never render.'
      },
      {
        id: 'missing-entry-point',
        title: 'Broken Cabinet',
        description: 'Missing launch path and genre.',
        status: 'active'
      }
    ]
  });

  await page.goto('/');
  await waitForGameGrid(page);

  await expect(page.locator('#game-grid .game-card')).toHaveCount(2);
  await expect(page.locator('#game-count')).toContainText('2 games in view');
  await expect(page.locator('#game-grid')).not.toContainText('undefined');
  await expect(page.locator('#game-grid .game-card[data-game-id="missing-entry-point"]')).toContainText('Broken Cabinet');
  await expect(page.locator('#game-grid .game-card[data-game-id="missing-entry-point"] button')).toBeDisabled();

  consoleTracker.assertNone();
});
