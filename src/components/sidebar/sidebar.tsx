'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from "@/lib/utils"
import { AppWindowIcon as Apps, Bell, BookOpen, Calendar, ChevronDown, Home, QrCode, LayoutGrid, MessageSquare, Settings, ShoppingBag, Store, Table, Wallet, X,Layers } from 'lucide-react'
import { Button } from '../ui/button'
import { SidebarItem } from './sidebar-item'
import { SidebarSection } from './sidebar-section'
import { useParams } from 'next/navigation'

export function Sidebar({ subdomain }: { subdomain: string }) {
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(true)

  const params = useParams()
  const subdomainFromParams = params.subdomain as string
  const effectiveSubdomain = subdomain || subdomainFromParams

  return (
    <aside className="w-64 h-screen bg-[#0f1117] text-white flex flex-col" aria-label="Sidebar">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            className="text-white px-3"
            onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
            aria-expanded={isQuickActionsOpen}
          >
            <span>Quick Actions</span>
            <ChevronDown className={cn("ml-2 h-4 w-4 transition-transform", !isQuickActionsOpen && "rotate-180")} />
          </Button>
          <Button variant="ghost" size="icon" className="text-white">
            <X className="h-4 w-4" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>
        {isQuickActionsOpen && (
          <>
            <Link
              href="#"
              className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded bg-blue-600 flex items-center justify-center">
                  <Store className="h-4 w-4" />
                </div>
                <span>Let&apos;s set up your restaurant</span>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Link>
            <div className="text-xs text-gray-400 mt-2">4/8 completed</div>
          </>
        )}
      </div>

      <nav className="flex-1 overflow-auto py-4 px-2 space-y-2">
        <SidebarItem icon={Settings} label="Setup" href="/setup" />
        <SidebarItem icon={Home} label="Home"   href={`/dashboard/${effectiveSubdomain}/`} />
        <SidebarItem icon={Wallet} label="Getting Paid" href="/payments" />
        <SidebarItem icon={Calendar} label="Booking Calendar" href="/calendar" />
        <SidebarItem icon={ShoppingBag} label="Sales" href="/sales" />

        <SidebarSection icon={LayoutGrid} label="Catalog">
          <SidebarItem label="Restaurant Menus (New)" href="/menus" indent />
          <SidebarItem label="Store Products" href="/products" indent />
          <SidebarItem label="Booking Services" href="/services" indent />
          <SidebarItem label="Gift Cards" href="/gift-cards" indent />
          <SidebarItem label="Sales Channels" href="/sales-channels" indent />
          <SidebarItem label="Booking Channels" href="/booking-channels" indent />
        </SidebarSection>

        <SidebarItem 
        icon={Table} 
        label="menu" 
        href={`/dashboard/${effectiveSubdomain}/menu`} />
        <SidebarItem icon={MessageSquare} label="Forum" href="/forum" />
        <SidebarItem icon={Apps} label="Apps" href="/apps" badge="1" />
        <SidebarItem 
          icon={Layers} 
          label="Pages" 
          href={`/dashboard/${effectiveSubdomain}/pages`} 
        />
        <SidebarItem icon={QrCode} label="qr" href={`/dashboard/${effectiveSubdomain}/qr`}  />
      </nav>

      <div className="p-4 border-t border-gray-800">
        <Button variant="ghost" className="w-full justify-start text-white">
          <Bell className="mr-2 h-4 w-4" />
          Order alerts on
        </Button>
      </div>
    </aside>
  )
}

