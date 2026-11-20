import { defineConfig, devices } from '@playwright/test'

/**
 * Smoke tests and accessibility checks against the built site (T8, T9).
 * Run `npm run build` first, then `npm run test:e2e`. The tests start `vite preview` themselves.
 */
export default defineConfig({
  testDir: './e2e',
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    baseURL: 'http://localhost:4173/',
    trace: 'retain-on-failure',
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
    // Lets the tests run with a Chromium that is already installed, e.g. in a sandbox without downloads.
    launchOptions: process.env.E2E_CHROMIUM_PATH ? { executablePath: process.env.E2E_CHROMIUM_PATH } : {},
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173/',
    reuseExistingServer: !process.env.CI,
  },
})
