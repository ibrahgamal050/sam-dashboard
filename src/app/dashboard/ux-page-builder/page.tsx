'use client'

import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { UXPageBuilder } from '@/components/ux-page-builder/ux-page-builder'

export default function UXPageBuilderPage() {
  return (
    <DndProvider backend={HTML5Backend}>
      <UXPageBuilder />
    </DndProvider>
  )
}

