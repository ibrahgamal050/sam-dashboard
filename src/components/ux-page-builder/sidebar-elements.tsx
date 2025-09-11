'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Grid2x2, LayoutGrid, Rows, Columns, SlidersHorizontal, Link2, Square, Type } from 'lucide-react'

const layoutElements = [
  { id: 'row', icon: Rows, label: 'Row' },
  { id: 'section', icon: Columns, label: 'Section' },
  { id: 'slider', icon: SlidersHorizontal, label: 'Slider' },
  { id: 'block', icon: Link2, label: 'Block' },
  { id: 'grid', icon: Grid2x2, label: 'Grid' },
]

const contentElements = [
  { id: 'button', icon: Square, label: 'Button' },
  { id: 'text', icon: Type, label: 'Text' },
]

interface SidebarElementsProps {
  onSelectElement: (elementType: string) => void
  onClose: () => void
}

export function SidebarElements({ onSelectElement, onClose }: SidebarElementsProps) {
  const [searchQuery, setSearchQuery] = React.useState('')

  const filteredLayoutElements = layoutElements.filter(element =>
    element.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredContentElements = contentElements.filter(element =>
    element.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="absolute left-64 top-0 bottom-0 w-64 bg-[#1a1a1a] border-l border-gray-800 z-10">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-white">ADD CONTENT</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-4">
        <Input 
          type="search" 
          placeholder="Search..." 
          className="mb-4 bg-gray-800 border-gray-700"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="space-y-4">
            <section>
              <h3 className="text-xs font-semibold text-gray-400 mb-2">LAYOUT</h3>
              <div className="grid grid-cols-2 gap-2">
                {filteredLayoutElements.map((element) => (
                  <ElementButton
                    key={element.id}
                    {...element}
                    onClick={() => onSelectElement(element.id)}
                  />
                ))}
              </div>
            </section>
            <section>
              <h3 className="text-xs font-semibold text-gray-400 mb-2">CONTENT</h3>
              <div className="grid grid-cols-2 gap-2">
                {filteredContentElements.map((element) => (
                  <ElementButton
                    key={element.id}
                    {...element}
                    onClick={() => onSelectElement(element.id)}
                  />
                ))}
              </div>
            </section>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

interface ElementButtonProps {
  id: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
}

function ElementButton({ id, icon: Icon, label, onClick }: ElementButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 p-2 border border-gray-700 rounded hover:border-blue-500 transition-colors bg-gray-800 text-white"
    >
      <Icon className="h-4 w-4" />
      <span className="text-xs">{label}</span>
    </button>
  )
}

