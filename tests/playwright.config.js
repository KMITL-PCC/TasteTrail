// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // โฟลเดอร์หลัก (default)
  // testDir: './tests',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter */
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }]],

  /* Shared settings */
  use: {
    trace: 'on-first-retry',
    headless: false,
    video: 'on',
    screenshot: 'on',
  },

  /* Projects */
  projects: [
    // Frontend tests
    {
      name: 'Frontend-In-Tests',
      testDir: './Frontend-In-Tests',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
      },
    },
    // Backend tests
    {
      name: 'Backend-In-Tests',
      testDir: './Backend-In-Tests',
      use: {
        baseURL: 'http://localhost:4000/api',
      },
    },
    // E2E tests
    {
      name: 'E2E-Tests',
      testDir: './E2E-Tests',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
      },
    },
    // Extra: cross-browser run (เฉพาะ chromium)
    // {
    //   name: 'chromium',
    //   use: { ...devices['Desktop Chrome'] },
    // },
  ],
});