import * as React from 'react'
import { useDrop } from 'react-dnd'
import { cn } from '@/lib/utils'

interface CanvasProps {
  components: any[]
  selectedComponent: any
  onSelect: (component: any) => void
  onChange: (components: any[]) => void
}

export function Canvas({ 
  components, 
  selectedComponent, 
  onSelect, 
  onChange 
}: CanvasProps) {
  const dropRef = React.useRef<HTMLDivElement | null>(null)
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'component',
    drop: (item: any) => {
      onChange([...components, {
        id: Date.now().toString(),
        type: item.type,
        props: {
          layout: { height: 450 },
          slide: { effect: 'none' },
          background: { color: '#1e3a8a', overlay: '#00000000' },
          border: { top: 0, right: 0, bottom: 0, left: 0 }
        }
      }])
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  }))

  drop(dropRef)

  const styleComponent = components.find(comp => comp.type === 'style')
  const contentComponents = components.filter(comp => comp.type !== 'style')

  return (
    <div
      ref={dropRef}
      className={cn(
        "flex-1 p-8 bg-[#121212] overflow-auto",
        isOver && "bg-gray-800/50"
      )}
      style={styleComponent?.props}
    >
      {contentComponents.map((component) => (
        <ComponentRenderer
          key={component.id}
          component={component}
          isSelected={selectedComponent?.id === component.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

interface ComponentRendererProps {
  component: any
  isSelected: boolean
  onSelect: (component: any) => void
}

function ComponentRenderer({ 
  component, 
  isSelected, 
  onSelect 
}: ComponentRendererProps) {
  if (component.type === 'banner') {
    const { layout, background, border } = component.props || {}
    
    return (
      <div
        className={cn(
          "relative border-2 border-transparent",
          isSelected && "border-blue-500"
        )}
        onClick={() => onSelect(component)}
        style={{
          height: `${layout?.height || 450}px`,
          backgroundColor: background?.color || '#1e3a8a',
          borderWidth: `${border?.top || 0}px ${border?.right || 0}px ${border?.bottom || 0}px ${border?.left || 0}px`
        }}
      >
        {background?.image && (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${background.image})`,
              backgroundColor: background.color,
            }}
          />
        )}
        {background?.overlay && (
          <div 
            className="absolute inset-0"
            style={{ 
              backgroundColor: background.overlay 
            }}
          />
        )}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-white p-8">
          <h1 className="text-4xl font-bold mb-4">THIS IS A SIMPLE BANNER</h1>
          <p className="text-center max-w-2xl">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
            magna aliquam erat volutpat.
          </p>
        </div>
      </div>
    )
  }

  return null
}
