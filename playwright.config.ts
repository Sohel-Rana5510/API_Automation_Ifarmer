import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

// Ports 3000 and 3001 are already in use on this machine, so the default
// here points at 3002. Override at any time via BASE_URL in .env or the
// environment, e.g.  BASE_URL=http://localhost:4000 npx playwright test
const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // tests share state (tokens/ids), run sequentially
  workers: 1,
  retries: 0,
  timeout: 30_000,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: BASE_URL,
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
    trace: 'retain-on-failure',
  },
});
