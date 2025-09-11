import * as React from 'react'
import { useDrag } from 'react-dnd'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ComponentType } from './types'

const availableComponents: ComponentType[] = [
  { type: 'heading', props: { text: 'New Heading', level: 'h2' } },
  { type: 'paragraph', props: { text: 'New paragraph text' } },
  { type: 'image', props: { src: '/placeholder.svg', alt: 'Placeholder image' } },
  { type: 'button', props: { text: 'Click me', variant: 'default' } },
]

interface ComponentPaletteProps {
  onAddComponent: (component: ComponentType) => void
}

export function ComponentPalette({ onAddComponent }: ComponentPaletteProps) {
  return (
    <div className="w-64 bg-secondary p-4">
      <h2 className="text-lg font-semibold mb-4">Components</h2>
      <ScrollArea className="h-[calc(100vh-8rem)]">
        {availableComponents.map((component) => (
          <DraggableComponent key={component.type} component={component} onAddComponent={onAddComponent} />
        ))}
      </ScrollArea>
    </div>
  )
}

interface DraggableComponentProps {
  component: ComponentType
  onAddComponent: (component: ComponentType) => void
}

function DraggableComponent({ component, onAddComponent }: DraggableComponentProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'component',
    item: component,
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult()
      if (item && dropResult) {
        onAddComponent(item)
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }))

  return (
    <div
      ref={drag}
      className={`mb-2 cursor-move ${isDragging ? 'opacity-50' : ''}`}
    >
      <Button variant="outline" className="w-full justify-start">
        {component.type}
      </Button>
    </div>
  )
}

