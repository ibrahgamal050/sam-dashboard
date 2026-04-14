'use client'

import type React from "react"

import TenantDashboardLayoutClient from "@/app/dashboard/_components/tenant-dashboard-layout-client"

export default function SupermarketTypedLayout({ children }: { children: React.ReactNode }) {
  return <TenantDashboardLayoutClient routeKind="supermarket">{children}</TenantDashboardLayoutClient>
}
