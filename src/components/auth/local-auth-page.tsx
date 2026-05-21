"use client"

import { FormEvent, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

type Locale = "ar" | "en"
type Mode = "login" | "register"

type LocalAuthPageProps = {
  locale: Locale
}

const copy = {
  ar: {
    loginTitle: "Вход",
    registerTitle: "Создать аккаунт",
    subtitle: "Используйте email и пароль для входа в аккаунт.",
    name: "Имя",
    email: "Email",
    password: "Пароль",
    login: "Войти",
    register: "Создать аккаунт",
    noAccount: "Нет аккаунта?",
    hasAccount: "Уже есть аккаунт?",
    switchRegister: "Создать новый аккаунт",
    switchLogin: "Войти",
    loading: "Обработка...",
    home: "На главную",
  },
  en: {
    loginTitle: "Вход",
    registerTitle: "Создать аккаунт",
    subtitle: "Используйте email и пароль для входа в аккаунт.",
    name: "Имя",
    email: "Email",
    password: "Пароль",
    login: "Войти",
    register: "Создать аккаунт",
    noAccount: "Нет аккаунта?",
    hasAccount: "Уже есть аккаунт?",
    switchRegister: "Создать новый аккаунт",
    switchLogin: "Войти",
    loading: "Обработка...",
    home: "На главную",
  },
} satisfies Record<Locale, Record<string, string>>

export function LocalAuthPage({ locale }: LocalAuthPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = copy[locale]
  const [mode, setMode] = useState<Mode>(searchParams.get("mode") === "register" ? "register" : "login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const returnUrl = useMemo(
    () => searchParams.get("return_url") || searchParams.get("callbackUrl") || "/dashboard",
    [locale, searchParams],
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (loading) return
    setError(null)
    setLoading(true)

    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          returnUrl,
        }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(data?.error || (locale === "ar" ? "Произошла ошибка" : "Произошла ошибка"))
        return
      }

      router.replace(data?.redirectTo || "/dashboard")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const dir = "ltr"
  const title = mode === "register" ? t.registerTitle : t.loginTitle

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10" dir={dir}>
      <section className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_25px_60px_-45px_rgba(15,23,42,0.45)]">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500">{t.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === "register" && (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-gray-700">{t.name}</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                required
                autoComplete="name"
                className="h-11 w-full rounded-2xl border border-gray-200 px-4 text-sm outline-none transition focus:border-[#6c5ce7] focus:ring-2 focus:ring-[#6c5ce7]/20"
              />
            </label>
          )}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-gray-700">{t.email}</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="h-11 w-full rounded-2xl border border-gray-200 px-4 text-sm outline-none transition focus:border-[#6c5ce7] focus:ring-2 focus:ring-[#6c5ce7]/20"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-gray-700">{t.password}</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={mode === "register" ? 6 : 1}
              required
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              className="h-11 w-full rounded-2xl border border-gray-200 px-4 text-sm outline-none transition focus:border-[#6c5ce7] focus:ring-2 focus:ring-[#6c5ce7]/20"
            />
          </label>

          {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#6c5ce7] px-4 text-sm font-semibold text-white transition hover:bg-[#5a4bd1] disabled:opacity-70"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? t.loading : mode === "register" ? t.register : t.login}
          </button>
        </form>

        <div className="mt-5 space-y-3 text-center text-sm">
          <button
            type="button"
            onClick={() => {
              setError(null)
              setMode(mode === "register" ? "login" : "register")
            }}
            className="font-medium text-[#6c5ce7] hover:text-[#5a4bd1]"
          >
            {mode === "register" ? `${t.hasAccount} ${t.switchLogin}` : `${t.noAccount} ${t.switchRegister}`}
          </button>
          <div>
            <Link href={`/${locale}`} className="text-gray-500 hover:text-gray-700">
              {t.home}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
