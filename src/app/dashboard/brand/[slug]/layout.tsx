'use client'

import type React from "react"

import TenantDashboardLayoutClient from "@/app/dashboard/_components/tenant-dashboard-layout-client"

export default function BrandTypedLayout({ children }: { children: React.ReactNode }) {
  return <TenantDashboardLayoutClient routeKind="brand">{children}</TenantDashboardLayoutClient>
}
