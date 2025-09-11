'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar/sidebar"
import { Button } from "@/components/ui/button"
import { MenuIcon } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function RestaurantAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const { subdomain } = useParams() as { subdomain: string }

  return (
    <div className="relative flex min-h-screen">
      {/* Sidebar for desktop */}
      <aside
        className={`fixed left-0 z-30 hidden h-full w-64 transform border-r bg-background transition-transform duration-200 ease-in-out md:block ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="absolute left-4 top-4 z-40 md:hidden"
            size="icon"
          >
            <MenuIcon className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex min-h-screen flex-1 flex-col md:pl-64">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-100">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

