const CSRF_COOKIE = 'rms.csrf='

const getCsrfTokenFromCookie = () => {
  if (typeof document === 'undefined') return undefined
  const parts = document.cookie.split(';').map((part) => part.trim())
  const match = parts.find((part) => part.startsWith(CSRF_COOKIE))
  return match ? decodeURIComponent(match.slice(CSRF_COOKIE.length)) : undefined
}

interface FetchJsonOptions extends RequestInit {
  csrf?: boolean
  csrfToken?: string
}

export async function fetchJson<T>(input: RequestInfo | URL, options: FetchJsonOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')

  if (options.csrf !== false) {
    const token = options.csrfToken || getCsrfTokenFromCookie()
    if (token) {
      headers.set('X-CSRF-Token', token)
    }
  }

  const response = await fetch(input, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.error ?? 'Request failed')
  }

  return response.json() as Promise<T>
}

export const getCsrfToken = async () => {
  if (typeof window === 'undefined') return undefined
  const token = getCsrfTokenFromCookie()
  if (token) return token
  const response = await fetch('/api/auth/csrf', { method: 'GET', credentials: 'include' })
  if (!response.ok) return undefined
  const data = (await response.json()) as { csrfToken?: string }
  return data.csrfToken
}
