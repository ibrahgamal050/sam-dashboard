import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from "@/lib/utils"
import { TypeIcon as type, LucideIcon } from 'lucide-react'

interface SidebarItemProps {
  icon?: LucideIcon
  label: string
  href: string
  badge?: string
  indent?: boolean
}

export function SidebarItem({ icon: Icon, label, href, badge, indent = false }: SidebarItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-between px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors",
        isActive && "text-white bg-gray-800/50",
        indent && "pl-8"
      )}
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        <span className="truncate">{label}</span>
      </div>
      {badge && (
        <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </Link>
  )
}

