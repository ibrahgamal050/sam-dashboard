# Authentication & Security Architecture

_(Arabic/English mix to align with request context)_

## Objectives
- Deny-by-default API access.
- Mandatory email verification + security hardening before login succeeds.
- JWT (access + refresh) with rotation & revocation.
- RBAC with roles: `USER`, `ADMIN`, `SUPERADMIN`.
- Comprehensive protection: rate limit, CORS, CSRF, Helmet, brute-force guard, audit trails.
- Modular middlewares reusable across Next.js App Router routes and the internal Express gateway.

## High-Level Overview
1. **Identity lifecycle**
   1. `POST /api/auth/register` → creates user in `users` collection (status `PENDING_EMAIL`, role `USER`). Sends verification email (placeholder console log locally) storing token in `emailVerificationTokens`.
   2. `POST /api/auth/verify-email` → consumes verification token, marks `emailVerifiedAt`, sets status `READY`.
   3. User cannot login until `emailVerified` **and** `securityProfile.hardeningComplete` flag true (set via initial security checklist `POST /api/auth/activate-security`).
   4. Login issues short-lived access JWT (15m) + refresh JWT (7d) stored as httpOnly cookies. Refresh tokens persisted in `sessionTokens` collection for rotation.
   5. `POST /api/auth/refresh` rotates tokens (revoke old session, issue new pair).
   6. `POST /api/auth/logout` revokes refresh token document and clears cookies.
   7. Password reset flow: request reset token, verify token, set new password.
   8. Account management: update profile, change password (requires old password), disable account.

2. **Express security gateway**
   - A dedicated Express server (`src/server/security/express-app.ts`) mounts critical middlewares: Helmet, rate limiter, CORS (allowlist), brute-force shield, CSRF (double-submit cookie), body parser.
   - Express mounts Next.js API routes via custom handler, but also provides shared middlewares consumed by App Router through exported helpers.

3. **Next.js App Router integration**
   - Each API route imports `withApiProtect` wrapper from `@/server/security/with-api-protect` which enforces deny-by-default, JWT verification, RBAC, and audit logging.
   - Client-side React components call helper functions in `src/lib/auth-client.ts` for login/logout, using fetch wrappers that include CSRF token header.

4. **Data model additions**
   - `User`: extended with password hash (bcrypt), roles array, security flags, audit metadata.
   - `SessionToken`: persists refresh tokens + fingerprint, rotation counters.
   - `EmailVerificationToken`, `PasswordResetToken`, `AuditLogEntry`.

5. **Security controls**
   - **Deny-by-default**: `withApiProtect` rejects any unauthenticated request unless route explicitly allows (`allowUnauthenticated: true`, `requiredRoles: []`).
   - **RBAC**: route options specify min role. Superadmin bypass.
   - **Rate limiting**: Express `rateLimit` + per-user login attempt limiter stored in Redis-like memory (fallback Map). For production recommend Redis; local fallback provided.
   - **CORS**: Only allow environment-provided origins; fail closed.
   - **CSRF**: Double submit (httpOnly refresh cookie + `X-CSRF-Token` header). Token stored in signed cookie using server secret.
   - **Helmet**: Standard secure headers.
   - **Brute-force**: `loginAttemptStore` increments failed attempts, locks account temporarily.
   - **Zod validation**: All request payloads validated with schemas in `src/server/validation/auth-schemas.ts`.
   - **Audit logs**: `logAuditEvent` writes to Mongo `auditLogs` collection for sensitive actions.

6. **Email delivery**
   - Provided via `src/server/email/send.ts` with console transport for local dev. Real SMTP can be plugged via environment config.

## Authentication Flow Diagram (Textual)
```
Register -> create user(PENDING_EMAIL) -> send verify token
VerifyEmail -> mark verified -> respond success
ActivateSecurity -> set hardeningComplete -> user READY
Login -> check status READY && !disabled -> check brute force -> issue tokens -> log audit
Authenticated request -> withApiProtect -> verify JWT -> check role -> proceed -> audit success/failure
Refresh -> validate refresh token doc -> rotate -> update doc
Logout -> revoke refresh token -> clear cookies
ForgotPassword -> issue token -> email
ResetPassword -> validate token -> update hash -> revoke sessions -> audit
ChangePassword -> verify old hash -> update -> revoke sessions -> audit
UpdateProfile -> requires auth -> update allowed fields -> audit diff
DisableAccount -> mark disabled -> revoke sessions -> audit
```

## Configuration & Secrets
- `.env.local` additions:
  - `JWT_ACCESS_SECRET`
  - `JWT_REFRESH_SECRET`
  - `JWT_ISSUER`
  - `AUTH_TOKEN_EXPIRES_IN=15m`
  - `REFRESH_TOKEN_EXPIRES_IN=7d`
  - `SECURITY_CSRF_SECRET`
  - `ALLOWED_ORIGINS=https://dashboard.example.com,https://admin.example.com`
  - `RATE_LIMIT_WINDOW_MS=60000`
  - `RATE_LIMIT_MAX=100`
  - `BCRYPT_SALT_ROUNDS=12`
  - `EMAIL_FROM=no-reply@example.com`
  - `SMTP_URL=` (optional for prod)

## Files & Modules
- `src/server/security/express-app.ts` — central Express app.
- `src/server/security/with-api-protect.ts` — deny-by-default wrapper.
- `src/server/security/rbac.ts` — role helpers.
- `src/server/security/rate-limit.ts` — login limiter.
- `src/server/security/csrf.ts` — token utilities.
- `src/server/security/cors.ts` — strict CORS middleware.
- `src/server/security/helmet.ts` — standard Helmet config.
- `src/server/security/audit.ts` — audit logging.
- `src/server/auth/auth-service.ts` — core auth business logic.
- `src/server/auth/token-service.ts` — JWT issuance, rotation, persistence.
- `src/server/auth/password-service.ts` — bcrypt hashing + comparison.
- `src/server/auth/email-service.ts` — wrappers for verification / reset.
- `src/server/routes/auth/*.ts` — route handlers for all auth endpoints.
- `src/app/api/auth/*/route.ts` — Next.js API files, each call into server modules.
- `src/lib/auth-client.ts` — browser helpers, fetch wrappers.
- `src/lib/http.ts` — `fetchJson` with CSRF header injection.
- `src/models/*.ts` — new/updated Mongoose models.

## Deployment Notes
- Express app can be run separately or embedded via custom Next.js server. Local instructions use `npm run dev:secure` to start Express (which proxies to Next dev via custom server). Production should run Next standalone with Express deployed as middleware.
- Rate limiter & brute force store default to in-memory; for production supply Redis connection via `REDIS_URL` env.

## Testing Plan
- Unit tests for token service, password service (bcrypt hash), security middleware.
- Integration tests for happy-path register/login/refresh flows using Supertest (if available) else Next request mocks.

## Postman Collection (Summary)
Collection will cover endpoints:
- `POST /api/auth/register`
- `POST /api/auth/verify-email`
- `POST /api/auth/activate-security`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/change-password`
- `PATCH /api/auth/profile`
- `POST /api/auth/disable`
Each request includes headers, body schema samples, and pre-request scripts for CSRF token handling.

