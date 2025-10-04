import { useState } from 'react'
import { ChevronDown, type LucideIcon } from 'lucide-react'
import { cn } from "@/lib/utils"

interface SidebarSectionProps {
  icon: LucideIcon
  label: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export function SidebarSection({ icon: Icon, label, children, defaultOpen = false }: SidebarSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-gray-400 hover:text-white transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-4 w-4 shrink-0" />
          <span>{label}</span>
        </div>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </button>
      {isOpen && <div className="mt-1 space-y-1">{children}</div>}
    </div>
  )
}

