'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Filter, HelpCircle, LogOut, Plus, Search, Settings, UserCog } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useDashboardAuth } from "@/components/dashboard/auth-context"
import { logout } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

type HeaderProps = {
  subdomain: string
  onOpenSidebar?: () => void
}

export function Header({ subdomain, onOpenSidebar }: HeaderProps) {
  const router = useRouter()
  const { user } = useDashboardAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const displayName = subdomain ? subdomain.replace(/[-_]/g, ' ') : 'Dashboard'

  const userFullName = [user?.name?.first, user?.name?.last].filter(Boolean).join(' ') || user.email
  const userEmail = user.email
  const userInitials = [user?.name?.first?.[0], user?.name?.last?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || user.email.charAt(0).toUpperCase()

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await logout()
      router.push('/auth/signin')
      router.refresh()
    } catch (error) {
      console.error('Logout failed', error)
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="flex flex-col gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className={cn("rounded-full border border-slate-200 bg-white shadow-sm lg:hidden")}
              onClick={onOpenSidebar}
            >
              <span className="sr-only">Open sidebar</span>
              <Settings className="h-4 w-4" />
            </Button>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Orders</p>
              <h1 className="text-lg font-semibold text-slate-900 sm:text-2xl">{displayName}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" className="hidden items-center gap-2 text-slate-600 sm:inline-flex">
              <HelpCircle className="h-4 w-4" />
              Orders Help Center
            </Button>
            <Button variant="ghost" size="icon" className="relative h-9 w-9 border border-slate-200">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-green-500" />
            </Button>
            <Button className="hidden items-center gap-2 rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8] sm:inline-flex">
              <Plus className="h-4 w-4" />
              Create Order
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full border border-slate-200">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="/placeholder.svg?height=36&width=36" alt="User" />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userFullName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <UserCog className="mr-2 h-4 w-4" />
                  <span>Account settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex items-center gap-2 text-red-600"
                  disabled={isLoggingOut}
                  onSelect={(event) => {
                    event.preventDefault()
                    void handleLogout()
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  <span>{isLoggingOut ? 'Signing out…' : 'Sign out'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <Button variant="outline" className="gap-2 rounded-full border-slate-200">
              Branches: All
            </Button>
            <Button variant="outline" className="gap-2 rounded-full border-slate-200">
              Set as busy
            </Button>
            <Button variant="outline" size="icon" className="rounded-full border-slate-200">
              <Filter className="h-4 w-4" />
            </Button>
            <div className="hidden flex-1 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 sm:flex">
              <Search className="h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search in the orders list"
                className="h-7 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" className="rounded-full px-3 text-sm font-medium text-slate-600">
              All (211)
            </Button>
            <Button variant="ghost" className="rounded-full px-3 text-sm text-slate-500">
              Pending (46)
            </Button>
            <Button variant="ghost" className="rounded-full px-3 text-sm text-slate-500">
              Ready (15)
            </Button>
            <Button variant="ghost" className="rounded-full px-3 text-sm text-slate-500">
              Dispatched (5)
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
