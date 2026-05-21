'use client'

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation"

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar/sidebar"
import {
  buildDashboardTenantBasePath,
  buildLegacyDashboardBasePath,
  type DashboardTenantType,
} from "@/lib/dashboard-site-path"

type TenantDashboardLayoutClientProps = {
  children: React.ReactNode
  routeKind: "legacy" | DashboardTenantType
}

export default function TenantDashboardLayoutClient({
  children,
  routeKind,
}: TenantDashboardLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authStatus, setAuthStatus] = useState<"loading" | "authorized" | "unauthorized">("loading")
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [redirectStatus, setRedirectStatus] = useState<"checking" | "ready">(
    routeKind === "legacy" ? "checking" : "ready",
  )
  const params = useParams() as {
    slug?: string | string[]
    subdomain?: string | string[]
  }
  const slugParam = Array.isArray(params.slug) ? params.slug[0] : params.slug
  const subdomainParam = Array.isArray(params.subdomain) ? params.subdomain[0] : params.subdomain
  const resolvedSubdomain = slugParam || subdomainParam
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const toggleSidebar = () => setSidebarOpen((prev) => !prev)
  const searchParamsString = searchParams?.toString() ?? ""

  useEffect(() => {
    const updateSidebarState = () => {
      const isDesktop = typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches
      setSidebarOpen(isDesktop)
    }

    updateSidebarState()
    window.addEventListener("resize", updateSidebarState)
    return () => window.removeEventListener("resize", updateSidebarState)
  }, [])

  useEffect(() => {
    if (routeKind !== "legacy") {
      setRedirectStatus("ready")
      return
    }

    if (!resolvedSubdomain || !pathname) return

    const legacyBasePath = buildLegacyDashboardBasePath(resolvedSubdomain)
    if (!pathname.startsWith(legacyBasePath)) {
      setRedirectStatus("ready")
      return
    }

    let active = true

    const resolveAndRedirect = async () => {
      try {
        const response = await fetch(
          `/api/retail/supermarkets/slug/${encodeURIComponent(resolvedSubdomain)}`,
          { cache: "no-store" },
        )
        if (!active) return

        const tenantType: DashboardTenantType = response.ok ? "supermarket" : "restaurant"
        const suffix = pathname.slice(legacyBasePath.length)
        const targetPath = `${buildDashboardTenantBasePath(tenantType, resolvedSubdomain)}${suffix}`
        const targetUrl = `${targetPath}${searchParamsString ? `?${searchParamsString}` : ""}`
        router.replace(targetUrl)
      } catch {
        if (!active) return
        const targetPath = buildDashboardTenantBasePath("restaurant", resolvedSubdomain)
        router.replace(`${targetPath}${searchParamsString ? `?${searchParamsString}` : ""}`)
      }
    }

    void resolveAndRedirect()

    return () => {
      active = false
    }
  }, [pathname, resolvedSubdomain, routeKind, router, searchParamsString])

  useEffect(() => {
    if (redirectStatus !== "ready") return

    let active = true
    const runCheck = async () => {
      if (!resolvedSubdomain) return
      try {
        const authorizeQuery =
          routeKind === "brand"
            ? `brandSlug=${encodeURIComponent(resolvedSubdomain)}`
            : `subdomain=${encodeURIComponent(resolvedSubdomain)}`
        const res = await fetch(`/api/auth/authorize?${authorizeQuery}`, {
          cache: "no-store",
        })
        if (!active) return

        if (res.ok) {
          setAuthStatus("authorized")
          return
        }

        const data = await res.json().catch(() => ({}))
        if (res.status === 401) {
          const returnUrl = pathname
            ? `${pathname}${searchParamsString ? `?${searchParamsString}` : ""}`
            : "/dashboard"
          router.push(`/auth/login?return_url=${encodeURIComponent(returnUrl)}`)
          return
        }

        setAuthStatus("unauthorized")
        setAuthMessage(data?.error || "У вас нет доступа к этой странице.")
      } catch {
        if (!active) return
        setAuthStatus("unauthorized")
        setAuthMessage("Не удалось проверить права доступа.")
      }
    }

    void runCheck()
    return () => {
      active = false
    }
  }, [pathname, redirectStatus, resolvedSubdomain, routeKind, router, searchParamsString])

  const unauthorizedView = useMemo(() => {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f3f7ff] px-6 text-center">
        <div className="max-w-md rounded-3xl bg-white p-8 shadow-[0_18px_40px_rgba(0,0,0,0.08)]">
          <h2 className="text-xl font-bold text-gray-900">Нет доступа</h2>
          <p className="mt-2 text-sm text-gray-600">{authMessage || "У вас нет прав владельца для этого филиала."}</p>
          <button
            type="button"
            onClick={() => router.push("/auth/login")}
            className="mt-5 w-full rounded-2xl bg-[#46b6ff] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#3aa9ef]"
          >
            Войти под другим аккаунтом
          </button>
        </div>
      </div>
    )
  }, [authMessage, router])

  if (redirectStatus !== "ready" || authStatus === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f3f7ff]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-[#46b6ff]" />
      </div>
    )
  }

  if (authStatus === "unauthorized") {
    return unauthorizedView
  }

  return (
    <div className="min-h-dvh bg-background text-left text-foreground" dir="ltr">
      <Sidebar subdomain={resolvedSubdomain || ""} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-dvh flex-col lg:ml-72 lg:pl-0">
        <Header subdomain={resolvedSubdomain || ""} onOpenSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto bg-[#f3f7ff] px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
