'use client'

import { useSearchParams } from 'next/navigation'

import { MenuManager } from '@/components/menu/menu-manager'

export default function MenuManagerPage() {
  const searchParams = useSearchParams()
  const subdomain = searchParams.get('subdomain') ?? 'default'

  return (
    <main className="min-h-screen bg-background">
      <MenuManager subdomain={subdomain} />
    </main>
  )
}
