"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchParamsString = searchParams?.toString() ?? ""
  const hasRedirectedRef = useRef(false)

  useEffect(() => {
    if (status !== "unauthenticated" || hasRedirectedRef.current) return

    hasRedirectedRef.current = true
    const redirectTarget = pathname
      ? `${pathname}${searchParamsString ? `?${searchParamsString}` : ""}`
      : "/dashboard"
    const loginUrl = `/auth/signin?callbackUrl=${encodeURIComponent(redirectTarget)}`
    router.push(loginUrl)
  }, [pathname, router, searchParamsString, status])

  if (status === "loading") {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Loading...</p>
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
