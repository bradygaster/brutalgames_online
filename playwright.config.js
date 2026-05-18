import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;
const desktopViewport = { width: 1440, height: 900 };
const desktopVideo = { mode: 'on', size: { width: 1280, height: 720 } };

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  use: {
    baseURL,
    actionTimeout: 15000,
    navigationTimeout: 30000,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: desktopVideo,
    viewport: desktopViewport
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: desktopViewport,
        video: desktopVideo
      }
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: desktopViewport,
        video: desktopVideo
      }
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: desktopViewport,
        video: desktopVideo
      }
    },
    {
      name: 'iphone-13',
      use: {
        ...devices['iPhone 13'],
        video: { mode: 'on', size: { width: 390, height: 844 } }
      }
    },
    {
      name: 'ipad-pro-11',
      use: {
        ...devices['iPad Pro 11'],
        video: { mode: 'on', size: { width: 834, height: 1194 } }
      }
    }
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: 'npm run serve:test',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        stdout: 'pipe',
        stderr: 'pipe',
        timeout: 120000
      }
});
