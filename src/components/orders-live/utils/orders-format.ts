// src/components/dashboard/orders-live/utils/orders-format.ts
"use client"

import type { Locale } from "@/lib/locale"

export const normalizeStatus = (status?: string) => String(status ?? "").toLowerCase().replace(/[\s-]+/g, "_")

export const toTitleCase = (value?: string) => {
  if (!value) return ""
  return String(value)
    .toLowerCase()
    .replace(/[_\s-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export const formatCurrency = (amount: number, currency: string, locale: Locale) => {
  const localeTag = locale === "ar" ? "ar-EG" : "en-US"
  const safeCurrency = currency?.toUpperCase?.() || "USD"
  try {
    return new Intl.NumberFormat(localeTag, { style: "currency", currency: safeCurrency }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${safeCurrency}`
  }
}

export const formatTimeLabel = (value?: string, locale: Locale = "en") => {
  if (!value) return ""
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ""
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed)
}

export const formatDuration = (value?: string) => {
  if (!value) return "00:30:00"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "00:30:00"
  const diff = Math.max(0, Date.now() - parsed.getTime())
  const totalSeconds = Math.floor(diff / 1000)
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0")
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0")
  const seconds = String(totalSeconds % 60).padStart(2, "0")
  return `${hours}:${minutes}:${seconds}`
}
