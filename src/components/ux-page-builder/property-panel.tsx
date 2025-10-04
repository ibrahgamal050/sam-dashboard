'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Component } from './types'

interface PropertyPanelProps {
  component: Component | null
  onChange: (updated: Component) => void
}

export function PropertyPanel({ component, onChange }: PropertyPanelProps) {
  if (!component) {
    return (
      <div className="w-64 bg-[#1a1a1a] border-l border-gray-800">
        <p className="p-4 text-gray-400 text-sm">Select a component to edit its properties</p>
      </div>
    )
  }

  const handleChange = (section: string, key: string, value: unknown) => {
    const currentProps = component.props ?? {}
    const sectionProps = (currentProps as Record<string, any>)[section] ?? {}

    onChange({
      ...component,
      props: {
        ...currentProps,
        [section]: {
          ...sectionProps,
          [key]: value,
        },
      },
    })
  }

  return (
    <div className="w-64 bg-[#1a1a1a] border-l border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center h-12 px-4 border-b border-gray-800">
        <Button variant="ghost" size="sm" className="text-white">
          <ChevronDown className="h-4 w-4 mr-2" />
          {component.type}
        </Button>
      </div>

      {/* Settings */}
      <div className="flex-1 overflow-y-auto">
        {component.type === 'banner' && (
          <div className="divide-y divide-gray-800">
            {/* Layout Section */}
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center w-full px-4 h-10 hover:bg-gray-800/50">
                <ChevronDown className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-sm font-medium">Layout</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 py-2 space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="height" className="text-xs text-gray-400">HEIGHT</Label>
                  <Input
                    id="height"
                    type="number"
                    value={component.props?.layout?.height || 450}
                    onChange={(e) => handleChange('layout', 'height', parseInt(e.target.value))}
                    className="h-8 bg-gray-800 border-gray-700 text-sm"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Slide Section */}
            <Collapsible>
              <CollapsibleTrigger className="flex items-center w-full px-4 h-10 hover:bg-gray-800/50">
                <ChevronDown className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-sm font-medium">Slide</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 py-2 space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="effect" className="text-xs text-gray-400">SLIDE EFFECT</Label>
                  <Select
                    value={component.props?.slide?.effect || 'none'}
                    onValueChange={(value) => handleChange('slide', 'effect', value)}
                  >
                    <SelectTrigger id="effect" className="h-8 bg-gray-800 border-gray-700 text-sm">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="fade">Fade</SelectItem>
                      <SelectItem value="slide">Slide</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Background Section */}
            <Collapsible>
              <CollapsibleTrigger className="flex items-center w-full px-4 h-10 hover:bg-gray-800/50">
                <ChevronDown className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-sm font-medium">Background</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 py-2 space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="image" className="text-xs text-gray-400">IMAGE</Label>
                  <div className="flex gap-2">
                    <Input
                      id="image"
                      placeholder="Select media"
                      value={component.props?.background?.image || ''}
                      onChange={(e) => handleChange('background', 'image', e.target.value)}
                      className="h-8 bg-gray-800 border-gray-700 text-sm"
                    />
                    <Button variant="secondary" size="sm" className="h-8">
                      Select
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="color" className="text-xs text-gray-400">COLOUR</Label>
                  <div className="h-8 bg-gray-800 border border-gray-700 rounded-md overflow-hidden">
                    <Input
                      id="color"
                      type="color"
                      value={component.props?.background?.color || '#000000'}
                      onChange={(e) => handleChange('background', 'color', e.target.value)}
                      className="w-full h-full border-0"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="overlay" className="text-xs text-gray-400">OVERLAY</Label>
                  <div className="h-8 bg-gray-800 border border-gray-700 rounded-md overflow-hidden">
                    <Input
                      id="overlay"
                      type="color"
                      value={component.props?.background?.overlay || '#000000'}
                      onChange={(e) => handleChange('background', 'overlay', e.target.value)}
                      className="w-full h-full border-0"
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Border Section */}
            <Collapsible>
              <CollapsibleTrigger className="flex items-center w-full px-4 h-10 hover:bg-gray-800/50">
                <ChevronDown className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-sm font-medium">Border</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4">
                <Label className="text-xs text-gray-400 mb-2">WIDTH</Label>
                <div className="grid grid-cols-4 gap-2">
                  {['top', 'right', 'bottom', 'left'].map((side) => (
                    <Input
                      key={side}
                      type="number"
                      value={component.props?.border?.[side] || 0}
                      onChange={(e) => handleChange('border', side, parseInt(e.target.value))}
                      className="h-8 bg-gray-800 border-gray-700 text-sm text-center"
                      placeholder="0px"
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </div>
    </div>
  )
}
