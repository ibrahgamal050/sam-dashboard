'use client'

import * as React from 'react'
import { ChevronRight, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { SidebarElements } from './sidebar-elements'
import { Component } from './types'

interface ComponentTreeProps {
  components: any[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAddComponent: (type: string) => void
}

export function ComponentTree({ components, selectedId, onSelect, onAddComponent }: ComponentTreeProps) {
  const [showElements, setShowElements] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')

  if (showElements) {
    return (
      <div className="w-64 bg-white border-r">
        <div className="flex items-center h-12 px-4 border-b">
          <Button 
            variant="ghost" 
            size="sm"
            className="mr-2"
            onClick={() => setShowElements(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          <span className="font-medium">ADD CONTENT</span>
        </div>
        <div className="p-4">
          <div className="mb-4">
            <h3 className="text-xs font-medium mb-2">Elements</h3>
            <Input
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8"
            />
          </div>

          <div className="space-y-6">
            <section>
              <h3 className="text-xs font-medium text-gray-500 mb-2">LAYOUT</h3>
              <div className="grid grid-cols-2 gap-2">
                {['Row', 'Section', 'Slider', 'Block', 'Grid'].map((type) => (
                  <button
                    key={type}
                    className="flex flex-col items-center p-3 border rounded hover:border-blue-500 transition-colors"
                    onClick={() => {
                      onAddComponent(type.toLowerCase())
                      setShowElements(false)
                    }}
                  >
                    <div className="w-8 h-8 mb-1 bg-gray-100 rounded flex items-center justify-center">
                      {type === 'Row' && <div className="w-4 h-4 bg-gray-400 rounded" />}
                      {type === 'Section' && <div className="w-4 h-4 border-2 border-gray-400 rounded" />}
                      {type === 'Slider' && <div className="w-4 h-1 bg-gray-400 rounded" />}
                      {type === 'Block' && <div className="w-4 h-4 border border-gray-400" />}
                      {type === 'Grid' && (
                        <div className="grid grid-cols-2 gap-0.5">
                          <div className="w-1.5 h-1.5 bg-gray-400" />
                          <div className="w-1.5 h-1.5 bg-gray-400" />
                          <div className="w-1.5 h-1.5 bg-gray-400" />
                          <div className="w-1.5 h-1.5 bg-gray-400" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs">{type}</span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-xs font-medium text-gray-500 mb-2">CONTENT</h3>
              <div className="grid grid-cols-2 gap-2">
                {['Button', 'Text'].map((type) => (
                  <button
                    key={type}
                    className="flex flex-col items-center p-3 border rounded hover:border-blue-500 transition-colors"
                    onClick={() => {
                      onAddComponent(type.toLowerCase())
                      setShowElements(false)
                    }}
                  >
                    <div className="w-8 h-8 mb-1 bg-gray-100 rounded flex items-center justify-center">
                      {type === 'Button' && <div className="w-4 h-3 border border-gray-400 rounded" />}
                      {type === 'Text' && <div className="w-4 h-3 bg-gray-400" />}
                    </div>
                    <span className="text-xs">{type}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 bg-[#1a1a1a] text-white overflow-y-auto">
      <div className="p-2 space-y-1">
        {components.map((component) => (
          <TreeItem
            key={component.id}
            component={component}
            selectedId={selectedId}
            onSelect={onSelect}
            level={0}
          />
        ))}
        <div className="relative group">
          <Button 
            className="w-full bg-blue-500 hover:bg-blue-600 mt-4"
            onClick={() => setShowElements(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add to Content
          </Button>
        </div>
      </div>
    </div>
  )
}

interface TreeItemProps {
  component: any
  selectedId: string | null
  onSelect: (id: string) => void
  level: number
}

function TreeItem({ component, selectedId, onSelect, level }: TreeItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(true)
  const isSelected = component.id === selectedId

  const hasChildren = component.children && component.children.length > 0
  const canAddChildren = ['banner', 'row', 'column'].includes(component.type)

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded cursor-pointer text-sm",
          isSelected ? "bg-blue-500" : "hover:bg-gray-800",
          level > 0 && "ml-4"
        )}
        onClick={() => onSelect(component.id)}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
            className="p-0.5"
          >
            <ChevronRight
              className={cn(
                "h-3 w-3 transition-transform",
                isExpanded && "rotate-90"
              )}
            />
          </button>
        )}
        <span>{component.type}</span>
        {component.type === 'column' && (
          <span className="text-xs text-gray-400">
            {component.props?.width || '6/12'}
          </span>
        )}
      </div>

      {isExpanded && (
        <>
          {hasChildren && (
            <div className="mt-1">
              {component.children.map((child: any) => (
                <TreeItem
                  key={child.id}
                  component={child}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  level={level + 1}
                />
              ))}
            </div>
          )}
          
          {canAddChildren && (
            <button
              className="ml-6 px-2 py-1 text-xs text-gray-400 hover:text-white flex items-center gap-1"
              onClick={() => {/* Add child component */}}
            >
              <Plus className="h-3 w-3" />
              Add to {component.type}
            </button>
          )}
        </>
      )}
    </div>
  )
}

