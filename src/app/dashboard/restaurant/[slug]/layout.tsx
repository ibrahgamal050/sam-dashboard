'use client'

import type React from "react"

import TenantDashboardLayoutClient from "@/app/dashboard/_components/tenant-dashboard-layout-client"

export default function RestaurantTypedLayout({ children }: { children: React.ReactNode }) {
  return <TenantDashboardLayoutClient routeKind="restaurant">{children}</TenantDashboardLayoutClient>
}
