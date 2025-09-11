'use client'

import * as React from 'react'
import { ComponentTree } from './component-tree'
import { PropertyPanel } from './property-panel'
import { Canvas } from './canvas'
import { Header } from './header'
import { Component } from './types'
import { DefaultStyles } from './default-styles'

// Mock pages data
const MOCK_PAGES = {
  'Home': { id: 'home', title: 'Home' },
  'Menu': { id: 'menu', title: 'Menu' },
  'Contact': { id: 'contact', title: 'Contact' },
}

export function UXPageBuilder() {
  const [components, setComponents] = React.useState<Component[]>([
    {
      id: '1',
      type: 'banner',
      children: [
        {
          id: '2',
          type: 'text-box',
        }
      ]
    },
    {
      id: '3',
      type: 'row',
      children: [
        {
          id: '4',
          type: 'column',
          props: { width: '6/12' },
          children: [
            {
              id: '5',
              type: 'text',
            },
            {
              id: '6',
              type: 'button',
            }
          ]
        },
        {
          id: '7',
          type: 'column',
          props: { width: '6/12' },
          children: [
            {
              id: '8',
              type: 'image',
            }
          ]
        }
      ]
    }
  ])
  
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [selectedPage, setSelectedPage] = React.useState<string>(Object.keys(MOCK_PAGES)[0] || 'no-pages')
  const [history, setHistory] = React.useState<Component[][]>([components])
  const [historyIndex, setHistoryIndex] = React.useState(0)
  const [previewMode, setPreviewMode] = React.useState(false)
  const [responsiveMode, setResponsiveMode] = React.useState<'desktop' | 'mobile'>('desktop')
  const [isSaving, setIsSaving] = React.useState(false)
  const [showDefaultStyles, setShowDefaultStyles] = React.useState(false)

  const selectedComponent = React.useMemo(() => {
    if (!selectedId) return null
    const findComponent = (comps: Component[]): Component | null => {
      for (const comp of comps) {
        if (comp.id === selectedId) return comp
        if (comp.children) {
          const found = findComponent(comp.children)
          if (found) return found
        }
      }
      return null
    }
    return findComponent(components)
  }, [components, selectedId])

  const handleAddComponent = (type: string) => {
    const newComponent = {
      id: Date.now().toString(),
      type,
      props: {},
      children: type === 'row' ? [
        {
          id: `${Date.now()}-1`,
          type: 'column',
          props: { width: '6/12' },
          children: []
        },
        {
          id: `${Date.now()}-2`,
          type: 'column',
          props: { width: '6/12' },
          children: []
        }
      ] : []
    }
    
    const newComponents = [...components, newComponent]
    setComponents(newComponents)
    addToHistory(newComponents)
  }

  const addToHistory = (newComponents: Component[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newComponents)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setComponents(history[historyIndex - 1])
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setComponents(history[historyIndex + 1])
    }
  }

  const handlePublish = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
  }

  const handlePageChange = (value: string) => {
    if (value !== 'no-pages') {
      setSelectedPage(value)
    }
  }

  const applyDefaultStyle = (styles: Record<string, any>) => {
    // Apply the styles to the root component or create a new style component
    const newStyleComponent = {
      id: Date.now().toString(),
      type: 'style',
      props: styles,
    }
    const newComponents = [newStyleComponent, ...components]
    setComponents(newComponents)
    addToHistory(newComponents)
    setShowDefaultStyles(false)
  }

  return (
    <div className="flex flex-col h-screen bg-[#1a1a1a]">
      <Header
        selectedPage={selectedPage}
        pages={MOCK_PAGES}
        onPageChange={handlePageChange}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        previewMode={previewMode}
        onTogglePreview={() => setPreviewMode(!previewMode)}
        responsiveMode={responsiveMode}
        onToggleResponsive={() => setResponsiveMode(responsiveMode === 'desktop' ? 'mobile' : 'desktop')}
        onPublish={handlePublish}
        isSaving={isSaving}
        onOpenDefaultStyles={() => setShowDefaultStyles(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        {!previewMode && (
          <ComponentTree
            components={components}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAddComponent={handleAddComponent}
          />
        )}
        <Canvas
          components={components}
          selectedComponent={selectedComponent}
          onSelect={(component) => setSelectedId(component.id)}
          onChange={(newComponents) => {
            setComponents(newComponents)
            addToHistory(newComponents)
          }}
        />
        {!previewMode && (
          <PropertyPanel
            component={selectedComponent}
            onChange={(updated) => {
              const updateComponent = (comps: Component[]): Component[] => {
                return comps.map(comp => {
                  if (comp.id === updated.id) return updated
                  if (comp.children) {
                    return {
                      ...comp,
                      children: updateComponent(comp.children)
                    }
                  }
                  return comp
                })
              }
              const newComponents = updateComponent(components)
              setComponents(newComponents)
              addToHistory(newComponents)
            }}
          />
        )}
        {showDefaultStyles && (
          <DefaultStyles
            onClose={() => setShowDefaultStyles(false)}
            onApplyStyle={applyDefaultStyle}
          />
        )}
      </div>
    </div>
  )
}

