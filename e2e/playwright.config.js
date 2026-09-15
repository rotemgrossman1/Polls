const { defineConfig, devices } = require('@playwright/test');
const {
  ROOT,
  API_PORT,
  CLIENT_PORT,
  API_URL,
  CLIENT_URL,
  E2E_USERNAME,
  e2eDatabaseUrl,
} = require('./helpers/env');

module.exports = defineConfig({
  testDir: __dirname,
  testMatch: '*.spec.js',
  globalSetup: require.resolve('./global-setup'),
  fullyParallel: true,
  // Two workers keep the API and client responsive on a developer machine.
  workers: 2,
  forbidOnly: true,
  retries: 0,
  timeout: 60 * 1000,
  expect: { timeout: 10 * 1000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: CLIENT_URL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-360',
      use: {
        browserName: 'chromium',
        viewport: { width: 360, height: 780 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        userAgent: devices['Pixel 5'].userAgent,
      },
    },
  ],
  // A dedicated API and client on their own ports, so dev servers and dev data are never touched.
  webServer: [
    {
      command: 'node server/server.js',
      cwd: ROOT,
      port: API_PORT,
      reuseExistingServer: false,
      timeout: 60 * 1000,
      stdout: 'ignore',
      env: {
        NODE_ENV: 'development',
        DATABASE_URL: e2eDatabaseUrl(),
        PORT: String(API_PORT),
        CLIENT_URL,
        TEST_USER_USERNAME: E2E_USERNAME,
      },
    },
    {
      // Production build served by `vite preview`: fast page loads, same bundle users get.
      command:
        'node client/node_modules/vite/bin/vite.js build client --outDir ../e2e/.client-dist --emptyOutDir' +
        ` && node client/node_modules/vite/bin/vite.js preview client --outDir ../e2e/.client-dist --port ${CLIENT_PORT} --strictPort`,
      cwd: ROOT,
      port: CLIENT_PORT,
      reuseExistingServer: false,
      timeout: 120 * 1000,
      stdout: 'ignore',
      env: { VITE_API_URL: API_URL },
    },
  ],
});
