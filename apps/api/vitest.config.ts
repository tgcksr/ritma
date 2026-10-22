import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: 'file:./test.db',
      NODE_ENV: 'test',
      REMINDERS_ENABLED: 'false',
    },
    globalSetup: ['./test/global-setup.ts'],
    // All test files share one SQLite database.
    fileParallelism: false,
  },
});
