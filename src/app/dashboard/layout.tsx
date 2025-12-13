import type { ReactNode } from 'react'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const headerList = await headers()
  const headerPath =
    headerList.get('x-pathname') ||
    headerList.get('x-invoke-path') ||
    headerList.get('x-matched-path') ||
    undefined
  const referer = headerList.get('referer')
  let currentPath = headerPath || '/dashboard'
  if (!headerPath && referer) {
    try {
      const url = new URL(referer)
      currentPath = url.pathname || currentPath
    } catch {
      currentPath = '/dashboard'
    }
  }

  // حذف التحقق من الـ session والـ provider
  return <>{children}</>
}
