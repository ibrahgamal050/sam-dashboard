"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchParamsString = searchParams?.toString() ?? ""
  const hasRedirectedRef = useRef(false)

  useEffect(() => {
    let active = true
    const loadSession = async () => {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" })
        if (!active) return
        setStatus(res.ok ? "authenticated" : "unauthenticated")
      } catch {
        if (!active) return
        setStatus("unauthenticated")
      }
    }
    loadSession()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (status !== "unauthenticated" || hasRedirectedRef.current) return

    hasRedirectedRef.current = true
    const redirectTarget = pathname
      ? `${pathname}${searchParamsString ? `?${searchParamsString}` : ""}`
      : "/dashboard"
    const loginUrl = `/auth/login?return_url=${encodeURIComponent(redirectTarget)}`
    router.push(loginUrl)
  }, [pathname, router, searchParamsString, status])

  if (status === "loading") {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">جاري التحميل...</p>
          </div>
        </div>
      )
    )
  }

  if (status !== "authenticated") {
    return null
  }

  return <>{children}</>
}
