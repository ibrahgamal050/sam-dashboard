"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { getStoredSession, onSessionChange } from "@/lib/auth/client"

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchParamsString = searchParams?.toString() ?? ""
  const hasRedirectedRef = useRef(false)
  const previousTokenRef = useRef<string | null>(null)

  useEffect(() => {
    const evaluateSession = () => {
      const { token } = getStoredSession()

      if (previousTokenRef.current !== token) {
        previousTokenRef.current = token
        hasRedirectedRef.current = false
      }

      const authenticated = Boolean(token)
      setIsAuthenticated(authenticated)
      setIsChecking(false)

      if (!authenticated && !hasRedirectedRef.current) {
        hasRedirectedRef.current = true
        const redirectTarget = pathname
          ? `${pathname}${searchParamsString ? `?${searchParamsString}` : ""}`
          : "/dashboard"
        const loginUrl = `/auth/login?redirect=${encodeURIComponent(redirectTarget)}`
        router.push(loginUrl)
      }
    }

    evaluateSession()

    const unsubscribe = onSessionChange(() => {
      evaluateSession()
    })

    return () => {
      unsubscribe()
    }
  }, [pathname, router, searchParamsString])

  if (isChecking) {
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

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
