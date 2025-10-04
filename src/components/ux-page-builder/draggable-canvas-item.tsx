import * as React from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { Component } from './types'
import { cn } from '@/lib/utils'

interface DraggableCanvasItemProps {
  component: Component
  index: number
  onSelectComponent: (component: Component | null) => void
  onMoveComponent: (dragIndex: number, hoverIndex: number) => void
}

export function DraggableCanvasItem({
  component,
  index,
  onSelectComponent,
  onMoveComponent,
}: DraggableCanvasItemProps) {
  const ref = React.useRef<HTMLDivElement>(null)

  const [{ handlerId }, drop] = useDrop({
    accept: 'canvasItem',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      }
    },
    hover(item: any, monitor) {
      if (!ref.current) {
        return
      }
      const dragIndex = item.index
      const hoverIndex = index

      if (dragIndex === hoverIndex) {
        return
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect()
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
      const clientOffset = monitor.getClientOffset()
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }

      onMoveComponent(dragIndex, hoverIndex)
      item.index = hoverIndex
    },
  })

  const [{ isDragging }, drag] = useDrag({
    type: 'canvasItem',
    item: () => {
      return { id: component.id, index }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  drag(drop(ref))

  const opacity = isDragging ? 0 : 1
  const renderComponent = () => {
    switch (component.type) {
      case 'text': {
        const variant = component.props?.variant as 'heading' | 'paragraph' | undefined

        if (variant === 'heading') {
          const headingLevel = (component.props?.level as keyof JSX.IntrinsicElements) ?? 'h2'
          const HeadingTag = headingLevel
          return <HeadingTag>{component.props?.text ?? 'Heading'}</HeadingTag>
        }

        return <p>{component.props?.text ?? 'Paragraph text'}</p>
      }
      case 'image':
        return (
          <img
            src={(component.props?.src as string) || '/placeholder.svg'}
            alt={(component.props?.alt as string) || 'Image'}
            className="max-w-full h-auto"
          />
        )
      case 'button':
        return (
          <button
            className={cn("px-4 py-2 rounded", {
              'bg-primary text-primary-foreground': component.props?.variant === 'default',
              'bg-secondary text-secondary-foreground': component.props?.variant === 'secondary',
              'bg-destructive text-destructive-foreground': component.props?.variant === 'destructive',
            })}
          >
            {component.props?.text ?? 'Button'}
          </button>
        )
      case 'banner':
        return <div className="p-6 text-center text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">Banner</div>
      case 'row':
        return <div className="grid grid-cols-2 gap-4 p-4 border border-dashed">Row Layout</div>
      case 'column':
        return <div className="p-4 border border-dashed">Column</div>
      case 'text-box':
        return <div className="p-4 border rounded">Text Box</div>
      default:
        return null
    }
  }

  return (
    <div
      ref={ref}
      style={{ opacity }}
      onClick={() => onSelectComponent(component)}
      className="p-2 mb-2 border border-gray-200 rounded cursor-move hover:border-primary"
      data-handler-id={handlerId}
    >
      {renderComponent()}
    </div>
  )
}
