import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'test',
  use: { baseURL: 'http://localhost:5173', viewport: { width: 1200, height: 800 } },
  webServer: {
    command: 'npx vite --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    env: { BROWSER: 'none' },
  },
});
