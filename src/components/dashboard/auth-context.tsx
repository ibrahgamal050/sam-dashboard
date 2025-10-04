"use client"

import { createContext, useContext } from "react"
import type { AuthUser } from "@/lib/auth-client"

interface DashboardAuthValue {
  user: AuthUser
  sessionId: string
}

const DashboardAuthContext = createContext<DashboardAuthValue | null>(null)

interface DashboardAuthProviderProps {
  value: DashboardAuthValue
  children: React.ReactNode
}

export function DashboardAuthProvider({ value, children }: DashboardAuthProviderProps) {
  return <DashboardAuthContext.Provider value={value}>{children}</DashboardAuthContext.Provider>
}

export function useDashboardAuth() {
  const context = useContext(DashboardAuthContext)
  if (!context) {
    throw new Error("useDashboardAuth must be used within a DashboardAuthProvider")
  }
  return context
}
