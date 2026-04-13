// src/app/dashboard/[restaurant]/orders/page.tsx
"use client"

import { useParams } from "next/navigation"
import OrdersLayout from "@/components/orders-live/OrdersLayout"

export default function OrdersPage() {
  const params = useParams<{ restaurant?: string | string[] }>()
  const rawSlug = Array.isArray(params?.restaurant) ? params.restaurant?.[0] : params?.restaurant
  const slug = (rawSlug ?? "").trim().toLowerCase()
  const restaurantSlug = !slug || slug === "undefined" || slug === "null" ? "pizzamaster" : slug

  return <OrdersLayout restaurantSlug={restaurantSlug} />
}
