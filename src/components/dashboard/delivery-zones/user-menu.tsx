"use client"

import { LogOut, Settings, User } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function UserMenu() {
  const [user, setUser] = useState<any | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" })
        if (!active) return
        if (!res.ok) {
          setUser(null)
          return
        }
        const data = await res.json()
        setUser(data?.user ?? null)
      } catch {
        if (active) setUser(null)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const label = useMemo(() => {
    if (!user) return ""
    const fullName = [user.given_name, user.family_name].filter(Boolean).join(" ").trim()
    return fullName || user.name || user.email || "حسابي"
  }, [user])

  const initials = useMemo(() => {
    const source = label || "U"
    return source.trim().charAt(0).toUpperCase()
  }, [label])

  if (!user) {
    return null
  }

  const handleSignOut = () => {
    window.location.href = "/auth/logout"
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Account</p>
            <p className="text-xs leading-none text-muted-foreground">{label}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
