'use client'

import type { ReactNode } from 'react'

interface ProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: ProvidersProps) {
  return <>{children}</>
}
