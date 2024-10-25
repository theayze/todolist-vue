// tests/e2e/utils/setup.ts
import { test as base } from '@playwright/test';
import PocketBase from 'pocketbase';

// Extend the base test with PocketBase utilities
export const test = base.extend({
  pb: async ({}, use) => {
    const pb = new PocketBase('http://127.0.0.1:8090');
    await use(pb);
  },
  
  // Create a test task
  createTask: async ({ pb }, use) => {
    await use(async (taskName: string, date: string) => {
      return await pb.collection('todolist').create({
        task: taskName,
        date: date,
      });
    });
  },
  
  // Clean up test data
  cleanupTasks: async ({ pb }, use) => {
    await use(async () => {
      const records = await pb.collection('todolist').getFullList();
      for (const record of records) {
        await pb.collection('todolist').delete(record.id);
      }
    });
  },
});

// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});