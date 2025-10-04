'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar/sidebar"
import { cn } from "@/lib/utils"

export default function RestaurantAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { subdomain } = useParams() as { subdomain: string }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Sidebar
        subdomain={subdomain}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    

      <div className="flex min-h-screen flex-col lg:pl-64">
        <Header subdomain={subdomain} onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
