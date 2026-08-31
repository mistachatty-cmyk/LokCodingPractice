import { execFileSync } from 'node:child_process';
import { defineConfig } from '@playwright/test';

function chromiumPath() {
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH) {
    return process.env.PLAYWRIGHT_CHROMIUM_PATH;
  }

  try {
    return execFileSync('which', ['chromium'], { encoding: 'utf8' }).trim();
  } catch {
    return undefined;
  }
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4174',
    launchOptions: {
      executablePath: chromiumPath(),
    },
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'PORT=4174 BASE_PATH=/ pnpm run dev',
    url: 'http://127.0.0.1:4174/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});