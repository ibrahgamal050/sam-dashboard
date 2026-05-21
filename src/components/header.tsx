'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, HelpCircle, LogOut, Menu, Plus, ScanLine, Search, UserCog } from "lucide-react"

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

type HeaderProps = {
  subdomain: string
  onOpenSidebar?: () => void
}

export function Header({ subdomain, onOpenSidebar }: HeaderProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const displayName = subdomain ? subdomain.replace(/[-_]/g, ' ') : 'Dashboard'



  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      router.push("/auth/logout")
    } catch {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white shadow-sm">
      <div className="relative flex flex-wrap items-center gap-3 px-4 py-4 sm:px-6">
        <div className="flex flex-1 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 shadow-sm lg:hidden"
            onClick={onOpenSidebar}
          >
            <span className="sr-only">Открыть боковую панель</span>
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex w-full max-w-xl items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500 shadow-sm">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Поиск товара или заказа"
              className="h-6 border-0 bg-transparent p-0 text-sm text-slate-700 placeholder:text-slate-400 focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="hidden items-center gap-2 rounded-full border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 sm:inline-flex"
          >
            <HelpCircle className="h-4 w-4" />
            Центр помощи
          </Button>
          <Button className="hidden items-center gap-2 rounded-full bg-[#46b6ff] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#3aa9ef] sm:inline-flex">
            <ScanLine className="h-4 w-4" />
            Сканировать штрихкод
          </Button>
          <Button className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 sm:inline-flex">
            <Plus className="h-4 w-4" />
            Создать счет
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10 rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-emerald-500 shadow" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full border border-slate-200 bg-white p-0 text-slate-600 shadow-sm hover:bg-slate-50"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
                  <AvatarFallback className="bg-slate-100 text-slate-700">
                    {displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">Управление аккаунтом</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserCog className="mr-2 h-4 w-4" />
                <span>Настройки аккаунта</span>
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
                <span>{isLoggingOut ? "Выход..." : "Выйти"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
