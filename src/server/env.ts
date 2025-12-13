import assert from 'node:assert'

const requiredEnv = [
  'NEXTAUTH_SECRET',
  'SECURITY_CSRF_SECRET',
]

for (const key of requiredEnv) {
  assert(process.env[key], `Missing required env var: ${key}`)
}

const parseNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const env = {
  nextAuthSecret: process.env.NEXTAUTH_SECRET as string,
  csrfSecret: process.env.SECURITY_CSRF_SECRET as string,
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  rateLimitWindowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
  rateLimitMax: parseNumber(process.env.RATE_LIMIT_MAX, 100),
  bcryptSaltRounds: parseNumber(process.env.BCRYPT_SALT_ROUNDS, 12),
  emailFrom: process.env.EMAIL_FROM ?? 'no-reply@example.com',
  smtpUrl: process.env.SMTP_URL,
}

export type Env = typeof env
