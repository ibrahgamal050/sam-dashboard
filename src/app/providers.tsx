'use client'

import type { ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'

interface ProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: ProvidersProps) {
  return <SessionProvider>{children}</SessionProvider>
}
