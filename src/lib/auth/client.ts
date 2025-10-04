const TOKEN_KEY = "rms.admin.session.token"
const USER_KEY = "rms.admin.session.user"
const SESSION_EVENT = "rms-admin-session-changed"

type StoredUser = {
  id?: string
  email?: string
  name?: string
}

type StoredSession = {
  token: string | null
  user: StoredUser | null
}

function getFromStorage(key: string): string | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const sessionValue = window.sessionStorage.getItem(key)
    if (sessionValue) return sessionValue
    return window.localStorage.getItem(key)
  } catch (error) {
    console.warn("Failed to read auth session from storage", error)
    return null
  }
}

function setInStorage(key: string, value: string | null) {
  if (typeof window === "undefined") {
    return
  }

  try {
    if (value === null) {
      window.sessionStorage.removeItem(key)
      window.localStorage.removeItem(key)
    } else {
      window.sessionStorage.setItem(key, value)
      window.localStorage.setItem(key, value)
    }
  } catch (error) {
    console.warn("Failed to persist auth session", error)
  }
}

export function getStoredSession(): StoredSession {
  const token = getFromStorage(TOKEN_KEY)
  const rawUser = getFromStorage(USER_KEY)

  let user: StoredUser | null = null

  if (rawUser) {
    try {
      user = JSON.parse(rawUser) as StoredUser
    } catch (error) {
      console.warn("Failed to parse stored user", error)
    }
  }

  return {
    token: token || null,
    user,
  }
}

export function setStoredSession(token: string, user: StoredUser | null) {
  setInStorage(TOKEN_KEY, token)
  setInStorage(USER_KEY, user ? JSON.stringify(user) : null)
  notifySessionListeners()
}

export function clearStoredSession() {
  setInStorage(TOKEN_KEY, null)
  setInStorage(USER_KEY, null)
  notifySessionListeners()
}

export function onSessionChange(listener: () => void) {
  if (typeof window === "undefined") {
    return () => {}
  }

  const handler = () => listener()
  window.addEventListener(SESSION_EVENT, handler)
  return () => window.removeEventListener(SESSION_EVENT, handler)
}

function notifySessionListeners() {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(new Event(SESSION_EVENT))
}

type AuthHeaderOptions = {
  headers?: HeadersInit
}

export function withAuthHeaders(options: AuthHeaderOptions = {}): HeadersInit {
  const { token } = getStoredSession()
  const headers = new Headers(options.headers)

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  return headers
}

export type { StoredSession, StoredUser }
