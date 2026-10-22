import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const TEST_DB = fileURLToPath(new URL('../prisma/test.db', import.meta.url));

/** Recreates the throwaway test database from the migrations before the suite runs. */
export default function setup() {
  for (const file of [TEST_DB, `${TEST_DB}-journal`]) rmSync(file, { force: true });
  execSync('npx prisma migrate deploy', {
    stdio: 'pipe',
    env: { ...process.env, DATABASE_URL: 'file:./test.db', PRISMA_HIDE_UPDATE_MESSAGE: '1' },
  });
}
