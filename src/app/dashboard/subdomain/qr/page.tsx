'use client'

import type React from "react"
import { QRGenerator } from "@/components/qr-code-generator/qr-generator"
import { useParams } from "next/navigation"

export default function QRPage() {
  const params = useParams() as { subdomain?: string; slug?: string }
  const subdomain = params.subdomain ?? params.slug ?? ""

  return (
    <div className="relative space-y-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-10 top-8 h-64 w-64 rounded-full bg-emerald-200/60 blur-3xl" />
        <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-lime-200/50 blur-3xl" />
      </div>
      <div className="relative">
        <QRGenerator subdomain={subdomain} />
      </div>
    </div>
  )
}
