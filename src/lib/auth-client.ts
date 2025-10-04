import { fetchJson, getCsrfToken } from './http'

export interface AuthUser {
  id: string
  email: string
  name: { first: string; last: string }
  roles: string[]
  status: string
  emailVerifiedAt?: string
  securityProfile: {
    hardeningComplete: boolean
    lastPasswordChangeAt?: string
  }
  createdAt: string
  updatedAt: string
}

interface AuthResponse {
  ok: true
  user: AuthUser
  sessionId?: string
}

export async function ensureCsrfToken() {
  return getCsrfToken()
}

export async function registerUser(payload: {
  firstName: string
  lastName: string
  email: string
  password: string
}) {
  const csrfToken = await ensureCsrfToken()
  return fetchJson<{ ok: true }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
    csrfToken,
  })
}

export async function verifyEmail(token: string) {
  const csrfToken = await ensureCsrfToken()
  return fetchJson<AuthResponse>('/api/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
    csrfToken,
  })
}

export async function activateSecurity(userId: string) {
  const csrfToken = await ensureCsrfToken()
  return fetchJson<AuthResponse>('/api/auth/activate-security', {
    method: 'POST',
    body: JSON.stringify({ userId, checklistCompleted: true }),
    csrfToken,
  })
}

export async function login(payload: { email: string; password: string; fingerprint?: string }) {
  const csrfToken = await ensureCsrfToken()
  return fetchJson<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
    csrfToken,
  })
}

export async function refreshSession() {
  const csrfToken = await ensureCsrfToken()
  return fetchJson<AuthResponse>('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({}),
    csrfToken,
  })
}

export async function logout() {
  const csrfToken = await ensureCsrfToken()
  return fetchJson<{ ok: true }>('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({}),
    csrfToken,
  })
}

export async function requestPasswordReset(email: string) {
  const csrfToken = await ensureCsrfToken()
  return fetchJson<{ ok: true }>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
    csrfToken,
  })
}

export async function resetPassword(token: string, password: string) {
  const csrfToken = await ensureCsrfToken()
  return fetchJson<{ ok: true }>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
    csrfToken,
  })
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const csrfToken = await ensureCsrfToken()
  return fetchJson<{ ok: true }>('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
    csrfToken,
  })
}

export async function updateProfile(updates: { firstName?: string; lastName?: string }) {
  const csrfToken = await ensureCsrfToken()
  return fetchJson<AuthResponse>('/api/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(updates),
    csrfToken,
  })
}

export async function disableAccount(reason?: string) {
  const csrfToken = await ensureCsrfToken()
  return fetchJson<{ ok: true }>('/api/auth/disable', {
    method: 'POST',
    body: JSON.stringify({ reason }),
    csrfToken,
  })
}
