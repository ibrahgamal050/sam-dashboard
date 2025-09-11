'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, ArrowRight, Eye, EyeOff, Smartphone, Monitor, Rocket } from 'lucide-react'

interface HeaderProps {
  selectedPage: string
  pages: Record<string, any>
  onPageChange: (value: string) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  previewMode: boolean
  onTogglePreview: () => void
  responsiveMode: 'desktop' | 'mobile'
  onToggleResponsive: () => void
  onPublish: () => void
  isSaving?: boolean
  onOpenDefaultStyles: () => void
}

export function Header({
  selectedPage,
  pages,
  onPageChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  previewMode,
  onTogglePreview,
  responsiveMode,
  onToggleResponsive,
  onPublish,
  isSaving = false,
  onOpenDefaultStyles
}: HeaderProps) {
  return (
    <div className="bg-background border-b p-2 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <Select value={selectedPage} onValueChange={onPageChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select a page" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(pages).length === 0 ? (
              <SelectItem value="no-pages">No pages available</SelectItem>
            ) : (
              Object.keys(pages).map((page) => (
                <SelectItem key={page} value={page}>
                  {page}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={onUndo} disabled={!canUndo}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onRedo} disabled={!canRedo}>
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button variant="outline" size="sm" onClick={onTogglePreview}>
          {previewMode ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
          {previewMode ? 'Edit' : 'Preview'}
        </Button>
        <Button variant="outline" size="sm" onClick={onToggleResponsive}>
          {responsiveMode === 'desktop' ? (
            <Smartphone className="h-4 w-4" />
          ) : (
            <Monitor className="h-4 w-4" />
          )}
        </Button>
        <Button variant="outline" size="sm" onClick={onOpenDefaultStyles}>
          Default Styles
        </Button>
        <Button size="sm" onClick={onPublish} disabled={isSaving}>
          <Rocket className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving...' : 'Publish'}
        </Button>
      </div>
    </div>
  )
}

