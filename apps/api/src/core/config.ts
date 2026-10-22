try {
  process.loadEnvFile();
} catch {
  // A .env file is optional; variables may come from the real environment.
}

const isProd = process.env.NODE_ENV === 'production';
const DEV_JWT_SECRET = 'dev-only-insecure-secret-do-not-use-in-production';

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (isProd) throw new Error('JWT_SECRET must be set to at least 32 characters in production.');
  return DEV_JWT_SECRET;
}

function intEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const config = {
  isProd,
  port: intEnv('PORT', 3001),
  host: process.env.HOST ?? '127.0.0.1',
  jwtSecret: jwtSecret(),
  sessionHours: intEnv('SESSION_HOURS', 12),
  remindersEnabled: process.env.REMINDERS_ENABLED !== 'false',
  reminderIntervalMs: intEnv('REMINDER_INTERVAL_MS', 60_000),
  notifyLocale: (process.env.NOTIFY_LOCALE === 'en' ? 'en' : 'tr') as 'tr' | 'en',
  businessName: process.env.BUSINESS_NAME ?? 'Ritma',
  businessTimeZone: process.env.BUSINESS_TIMEZONE ?? 'Europe/Istanbul',
} as const;
