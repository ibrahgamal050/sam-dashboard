'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'

export default function SignInPage() {
  const search = useSearchParams()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const errorParam = search?.get('error')

  const callbackUrl = React.useMemo(() => {
    const redirectParam = search?.get('callbackUrl') ?? search?.get('redirect')
    if (redirectParam && redirectParam.startsWith('/')) {
      return redirectParam
    }
    return '/dashboard'
  }, [search])

  React.useEffect(() => {
    if (!errorParam) return
    if (errorParam === 'missingRole') {
      setError('حسابك غير مرتبط بصلاحية تسمح بالدخول. تواصل مع مسؤول النظام لإضافتك.')
    } else {
      setError('غير مسموح لك بالدخول بهذا الحساب.')
    }
  }, [errorParam])

  const handleMeelzaLogin = React.useCallback(async () => {
    try {
      setLoading(true)
      await signIn('meelza-id', { callbackUrl })
    } catch (err: any) {
      setError(err?.message || 'Unable to connect to Meelza ID. Please try again.')
      setLoading(false)
    }
  }, [callbackUrl])

  return (
    <main className="min-h-svh bg-slate-50 py-16">
      <div className="mx-auto grid max-w-md gap-6 rounded-3xl border border-white/60 bg-white/90 p-10 text-center shadow-2xl shadow-indigo-100">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-500">Meelza RMS</p>
          <h1 className="text-2xl font-semibold text-slate-900">Sign in with Meelza ID</h1>
          <p className="text-sm text-slate-500">
            Use your unified Meelza ID (admin, owner, or staff) to access the restaurant dashboard.
          </p>
        </div>
        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        <button
          type="button"
          onClick={handleMeelzaLogin}
          disabled={loading}
          className="flex items-center justify-center gap-3 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Connecting…' : 'Continue with Meelza ID'}
        </button>
        <p className="text-xs text-slate-400">
          Need access? Contact your Meelza administrator to be added as owner or staff.
        </p>
      </div>
    </main>
  )
}
