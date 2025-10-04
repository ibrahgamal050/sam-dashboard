import assert from 'node:assert'

const requiredEnv = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_ISSUER',
  'SECURITY_CSRF_SECRET',
  'AUTH_TOKEN_EXPIRES_IN',
  'REFRESH_TOKEN_EXPIRES_IN',
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
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET as string,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET as string,
  jwtIssuer: process.env.JWT_ISSUER as string,
  authTokenExpiresIn: process.env.AUTH_TOKEN_EXPIRES_IN ?? '15m',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d',
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
