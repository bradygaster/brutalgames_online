import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect } from '@playwright/test';

const helpersPath = fileURLToPath(import.meta.url);
const testsDir = path.dirname(helpersPath);
export const repoRoot = path.resolve(testsDir, '..');
export const registryPath = path.join(repoRoot, 'games.json');
export const fixturesDir = path.join(testsDir, 'fixtures');
export const sampleGameFixturePath = path.join(fixturesDir, 'sample-game', 'index.html');
export const newRegistryFixturePath = path.join(fixturesDir, 'games-with-new-entry.json');

export async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

export async function readGameRegistry(filePath = registryPath) {
  return readJson(filePath);
}

export async function injectGameRegistry(page, registryOrPath) {
  await page.route('**/games.json', async (route) => {
    const payload =
      typeof registryOrPath === 'string'
        ? await readJson(registryOrPath)
        : registryOrPath;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload, null, 2),
      headers: {
        'cache-control': 'no-store'
      }
    });
  });
}

export async function injectNewGameEntry(page, newGame) {
  const registry = await readGameRegistry();
  return injectGameRegistry(page, {
    ...registry,
    games: [...registry.games, newGame]
  });
}

export function trackConsoleErrors(page) {
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  return {
    consoleErrors,
    pageErrors,
    assertNone() {
      expect(
        [...consoleErrors, ...pageErrors],
        `Unexpected console or page errors: ${[...consoleErrors, ...pageErrors].join(' | ')}`
      ).toEqual([]);
    }
  };
}

export async function waitForGameGrid(page) {
  await expect(page.locator('#game-count')).not.toContainText('Loading');
  await expect(page.locator('#game-grid .game-card').first()).toBeVisible();
}

export async function captureScreenshot(page, testInfo, name, locator = page.locator('body')) {
  const sanitized = name.replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
  const screenshotPath = testInfo.outputPath(`${sanitized}.png`);
  await locator.screenshot({ path: screenshotPath, animations: 'disabled' });
  await testInfo.attach(name, {
    path: screenshotPath,
    contentType: 'image/png'
  });
  return screenshotPath;
}

export function expectedGridColumns(viewportWidth) {
  if (viewportWidth >= 1280) {
    return 4;
  }

  if (viewportWidth >= 1024) {
    return 3;
  }

  if (viewportWidth >= 640) {
    return 2;
  }

  return 1;
}

export async function startStaticServer({ cwd = repoRoot, port = 4173 } = {}) {
  const serverCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const server = spawn(serverCommand, ['http-server', '.', '-c-1', '-a', '127.0.0.1', '-p', String(port)], {
    cwd,
    stdio: 'ignore'
  });

  await waitForUrl(`http://127.0.0.1:${port}`);
  return server;
}

export async function stopStaticServer(server) {
  if (!server || server.killed) {
    return;
  }

  server.kill();
}

async function waitForUrl(url, timeoutMs = 30000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      await requestUrl(url);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  throw new Error(`Timed out waiting for ${url}`);
}

function requestUrl(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      response.resume();
      if (response.statusCode && response.statusCode < 500) {
        resolve();
        return;
      }
      reject(new Error(`Unexpected status code: ${response.statusCode}`));
    });

    request.on('error', reject);
  });
}
