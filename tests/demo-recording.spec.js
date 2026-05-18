import { test, expect } from '@playwright/test';
import {
  captureScreenshot,
  injectGameRegistry,
  newRegistryFixturePath,
  waitForGameGrid
} from './helpers.js';

test('records a slow arcade walkthrough for demo capture', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'Record the demo flow once in Chromium.');
  test.setTimeout(90000);

  await injectGameRegistry(page, newRegistryFixturePath);
  await page.goto('/');
  await waitForGameGrid(page);
  await page.waitForTimeout(1200);
  await captureScreenshot(page, testInfo, 'demo-landing');

  await page.locator('.nav-list').getByRole('link', { name: 'Games', exact: true }).click();
  await page.waitForTimeout(900);
  const newCard = page.locator('#game-grid .game-card[data-game-id="test-lab-showcase"]');
  await newCard.scrollIntoViewIfNeeded();
  await newCard.hover();
  await page.waitForTimeout(900);
  await captureScreenshot(page, testInfo, 'demo-lobby');

  await newCard.getByRole('button', { name: /launch game/i }).click();
  await expect(page.locator('#game-launcher-title')).toHaveText(/now playing: test lab showcase/i);
  await expect(page.frameLocator('#game-frame').getByText('Hello from Test Game')).toBeVisible();
  await page.waitForTimeout(1500);
  await captureScreenshot(page, testInfo, 'demo-launcher');

  await page.getByRole('button', { name: /close/i }).click();
  await page.waitForTimeout(900);
  await page.locator('.nav-list').getByRole('link', { name: 'About', exact: true }).click();
  await expect(page).toHaveURL(/#about$/);
  await page.waitForTimeout(1200);
});
