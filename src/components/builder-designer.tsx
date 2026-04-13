import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd'
import { GripVertical, Plus, Trash2, Columns as ColumnsIcon, Type as TypeIcon, Image as ImageIcon, MousePointerSquareDashed } from 'lucide-react'
import { memo, useCallback } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type BuilderElement = {
  id?: string
  type?: string
  position?: number
  role?: string
  children?: BuilderElement[]
  columns?: BuilderColumn[]
  [key: string]: any
}

type BuilderColumn = {
  id?: string
  position?: number
  width?: string
  align?: string
  justify?: string
  children?: BuilderElement[]
  [key: string]: any
}

export type BuilderSectionState = {
  id?: string
  key?: string
  type?: string
  position?: number
  layout?: Record<string, any>
  elements?: BuilderElement[]
  columns?: BuilderColumn[]
  [key: string]: any
}

type BuilderDesignerProps = {
  sections: BuilderSectionState[]
  onSectionsChange: (updater: (prev: BuilderSectionState[]) => BuilderSectionState[]) => void
}

const randomId = () =>
  typeof globalThis !== 'undefined' &&
  typeof (globalThis as any).crypto !== 'undefined' &&
  typeof (globalThis as any).crypto.randomUUID === 'function'
    ? (globalThis as any).crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

const cloneSections = (sections: BuilderSectionState[]) => {
  const globalStructuredClone = (globalThis as any)?.structuredClone as (<T>(value: T) => T) | undefined
  if (typeof globalStructuredClone === 'function') {
    return globalStructuredClone(sections)
  }
  return JSON.parse(JSON.stringify(sections)) as BuilderSectionState[]
}

const getSectionKey = (section: BuilderSectionState, index: number) => section.id ?? section.key ?? `section-${index}`

const getColumnsElement = (section: BuilderSectionState) =>
  section.elements?.find((element) => element?.type === 'columns')

const ensureArray = <T,>(value?: T[]) => (Array.isArray(value) ? value : [])

const createDefaultWidget = (type: string): BuilderElement => {
  const base = {
    id: randomId(),
    type,
    position: 0,
  }
  switch (type) {
    case 'text':
      return {
        ...base,
        text: {
          type: 'text',
          value: 'Edit me...',
          settings: { variant: 'body' },
        },
      }
    case 'button':
      return {
        ...base,
        href: '#',
        text: {
          type: 'text',
          value: 'Click me',
          settings: { variant: 'button' },
        },
      }
    case 'image':
      return {
        ...base,
        src: '/placeholder.svg?height=320&width=640',
        alt: 'New image',
        objectFit: 'cover',
      }
    default:
      return base
  }
}

const createDefaultColumn = (): BuilderColumn => ({
  id: randomId(),
  width: '50%',
  position: 0,
  children: [],
})

const BuilderDesignerComponent = ({ sections, onSectionsChange }: BuilderDesignerProps) => {
  const applyChange = useCallback(
    (producer: (draft: BuilderSectionState[]) => void) => {
      onSectionsChange((prev) => {
        const draft = cloneSections(prev)
        producer(draft)
        return draft
      })
    },
    [onSectionsChange],
  )

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, type } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    if (type === 'section') {
      applyChange((draft) => {
        const [moved] = draft.splice(source.index, 1)
        draft.splice(destination.index, 0, moved)
      })
      return
    }

    if (type === 'column') {
      const sourceSectionId = source.droppableId.replace('columns-', '')
      const destSectionId = destination.droppableId.replace('columns-', '')
      applyChange((draft) => {
        const sourceSection = draft.find((section, idx) => getSectionKey(section, idx) === sourceSectionId)
        const destSection = draft.find((section, idx) => getSectionKey(section, idx) === destSectionId)
        if (!sourceSection || !destSection) return
        const sourceColumnsElement = getColumnsElement(sourceSection)
        const destColumnsElement = getColumnsElement(destSection)
        if (!sourceColumnsElement || !destColumnsElement) return
        const sourceColumns = ensureArray(sourceColumnsElement.columns)
        const destColumns = sourceSection === destSection ? sourceColumns : ensureArray(destColumnsElement.columns)
        const [moved] = sourceColumns.splice(source.index, 1)
        destColumns.splice(destination.index, 0, moved)
        sourceColumnsElement.columns = sourceColumns.map((column, idx) => ({ ...column, position: idx + 1 }))
        if (sourceSection !== destSection) {
          destColumnsElement.columns = destColumns.map((column, idx) => ({ ...column, position: idx + 1 }))
        }
      })
      return
    }

    if (type === 'widget') {
      applyChange((draft) => {
        const parseWidgetDroppable = (droppableId: string) => {
          if (droppableId.startsWith('widgets-section-')) {
            return { sectionId: droppableId.replace('widgets-section-', ''), columnId: null }
          }
          if (droppableId.startsWith('widgets-column-')) {
            const rest = droppableId.replace('widgets-column-', '')
            const [sectionId, columnId] = rest.split('::')
            return { sectionId, columnId: columnId ?? null }
          }
          return { sectionId: droppableId, columnId: null }
        }

        const sourceInfo = parseWidgetDroppable(source.droppableId)
        const destInfo = parseWidgetDroppable(destination.droppableId)

        const sourceSection = draft.find((section, idx) => getSectionKey(section, idx) === sourceInfo.sectionId)
        const destSection = draft.find((section, idx) => getSectionKey(section, idx) === destInfo.sectionId)
        if (!sourceSection || !destSection) return

        const resolveWidgetList = (section: BuilderSectionState, columnId: string | null) => {
          if (columnId) {
            const columnsElement = getColumnsElement(section)
            const column = ensureArray(columnsElement?.columns).find((col) => (col.id ?? '') === columnId)
            return column?.children
          }
          if (getColumnsElement(section)) {
            // if columns element exists but droppable refers to section root, fall back to elements list
            return section.elements
          }
          return section.elements
        }

        const sourceList = resolveWidgetList(sourceSection, sourceInfo.columnId)
        const destList = resolveWidgetList(destSection, destInfo.columnId)
        if (!sourceList || !destList) return
        const [moved] = sourceList.splice(source.index, 1)
        destList.splice(destination.index, 0, moved)
        sourceList.forEach((widget, idx) => {
          if (widget) widget.position = idx + 1
        })
        if (sourceList !== destList) {
          destList.forEach((widget, idx) => {
            if (widget) widget.position = idx + 1
          })
        }
      })
      return
    }
  }

  const addSection = () => {
    applyChange((draft) => {
      draft.push({
        id: randomId(),
        type: 'hero',
        position: draft.length + 1,
        layout: {
          container: 'xl',
          paddingY: '4rem',
          paddingX: '1.5rem',
        },
        elements: [],
      })
    })
  }

  const addWidget = (sectionIndex: number, columnId: string | null, kind: string = 'text') => {
    applyChange((draft) => {
      const section = draft[sectionIndex]
      if (!section) return
      const widget = createDefaultWidget(kind)
      if (columnId) {
        const columnsElement = getColumnsElement(section)
        const column = ensureArray(columnsElement?.columns).find((col) => (col.id ?? '') === columnId)
        if (column) {
          column.children = ensureArray(column.children)
          column.children.push(widget)
        }
      } else {
        section.elements = ensureArray(section.elements)
        section.elements.push(widget)
      }
    })
  }

  const addColumn = (sectionIndex: number) => {
    applyChange((draft) => {
      const section = draft[sectionIndex]
      if (!section) return
      const columnsElement = getColumnsElement(section)
      if (!columnsElement) {
        section.elements = ensureArray(section.elements)
        section.elements.push({
          id: randomId(),
          type: 'columns',
          position: 1,
          layout: { width: '100%' },
          columns: [createDefaultColumn(), createDefaultColumn()],
        })
        return
      }
      columnsElement.columns = ensureArray(columnsElement.columns)
      columnsElement.columns.push(createDefaultColumn())
    })
  }

  const removeWidget = (sectionIndex: number, columnId: string | null, widgetIndex: number) => {
    applyChange((draft) => {
      const section = draft[sectionIndex]
      if (!section) return
      if (columnId) {
        const columnsElement = getColumnsElement(section)
        const column = ensureArray(columnsElement?.columns).find((col) => (col.id ?? '') === columnId)
        if (column?.children) {
          column.children.splice(widgetIndex, 1)
        }
        return
      }
      section.elements = ensureArray(section.elements)
      section.elements.splice(widgetIndex, 1)
    })
  }

  const removeSection = (index: number) => {
    applyChange((draft) => {
      draft.splice(index, 1)
    })
  }

  const removeColumn = (sectionIndex: number, columnId: string) => {
    applyChange((draft) => {
      const section = draft[sectionIndex]
      if (!section) return
      const columnsElement = getColumnsElement(section)
      if (!columnsElement?.columns) return
      columnsElement.columns = columnsElement.columns.filter((column) => (column.id ?? '') !== columnId)
    })
  }

  const renderWidgets = (
    sectionIndex: number,
    droppableId: string,
    widgets: BuilderElement[] | undefined,
    columnId: string | null,
  ) => (
    <Droppable droppableId={droppableId} type="widget">
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white/60 p-2"
        >
          {ensureArray(widgets).map((widget, index) => {
            const widgetId = widget.id ?? `${widget.type}-${index}`
            return (
              <Draggable key={widgetId} draggableId={`widget-${widgetId}`} index={index}>
                {(dragProvided) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-slate-400" />
                      <Badge variant="outline" className="rounded-full px-2 text-xs uppercase tracking-wide text-slate-500">
                        {widget.type ?? 'widget'}
                      </Badge>
                      <span className="text-slate-700">
                        {widget.text?.value
                          ? widget.text.value.replace(/<[^>]+>/g, '').slice(0, 30)
                          : widget.role ?? widget.id ?? 'Widget'}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                      onClick={() => removeWidget(sectionIndex, columnId, index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </Draggable>
            )
          })}
          {provided.placeholder}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full px-3 text-xs"
              onClick={() => addWidget(sectionIndex, columnId, 'text')}
            >
              <TypeIcon className="mr-1 h-3.5 w-3.5" />
              Text
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full px-3 text-xs"
              onClick={() => addWidget(sectionIndex, columnId, 'image')}
            >
              <ImageIcon className="mr-1 h-3.5 w-3.5" />
              Image
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full px-3 text-xs"
              onClick={() => addWidget(sectionIndex, columnId, 'button')}
            >
              <MousePointerSquareDashed className="mr-1 h-3.5 w-3.5" />
              Button
            </Button>
          </div>
        </div>
      )}
    </Droppable>
  )

  return (
    <div className="space-y-4">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sections-root" type="section">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
              {sections.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
                  No sections yet. Click “Add section” to start building.
                </div>
              )}
              {sections.map((section, index) => {
                const sectionKey = getSectionKey(section, index)
                const columnsElement = getColumnsElement(section)
                const columns = ensureArray(columnsElement?.columns)
                const droppableId = `widgets-section-${sectionKey}`

                return (
                  <Draggable key={sectionKey} draggableId={`section-${sectionKey}`} index={index}>
                    {(dragProvided) => (
                      <Card
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        className="border border-slate-200 shadow-sm"
                      >
                        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <div {...dragProvided.dragHandleProps}>
                              <GripVertical className="h-4 w-4 text-slate-400" />
                            </div>
                            Section {index + 1}
                            <Badge variant="outline" className="rounded-full border-slate-200 text-xs uppercase tracking-wide text-violet-600">
                              {section.type ?? 'custom'}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            {columnsElement ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="rounded-full px-3 text-xs"
                                onClick={() => addColumn(index)}
                              >
                                <ColumnsIcon className="mr-1 h-3.5 w-3.5" />
                                Add column
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="rounded-full px-3 text-xs"
                                onClick={() => addColumn(index)}
                              >
                                <ColumnsIcon className="mr-1 h-3.5 w-3.5" />
                                Insert columns
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="rounded-full text-red-500 hover:text-red-700"
                              onClick={() => removeSection(index)}
                            >
                              <Trash2 className="mr-1 h-3.5 w-3.5" />
                              Remove
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {columnsElement ? (
                            <Droppable droppableId={`columns-${sectionKey}`} type="column" direction="horizontal">
                              {(columnsProvided) => (
                                <div
                                  ref={columnsProvided.innerRef}
                                  {...columnsProvided.droppableProps}
                                  className="grid gap-4 md:grid-cols-2"
                                >
                                  {columns.map((column, columnIndex) => {
                                    const columnId = column.id ?? `${sectionKey}-column-${columnIndex}`
                                    return (
                                      <Draggable
                                        key={columnId}
                                        draggableId={`column-${sectionKey}-${columnId}`}
                                        index={columnIndex}
                                      >
                                        {(columnDragProvided) => (
                                          <Card
                                            ref={columnDragProvided.innerRef}
                                            {...columnDragProvided.draggableProps}
                                            className="border border-slate-200 bg-slate-50/60"
                                          >
                                            <CardHeader className="flex flex-row items-center justify-between py-3">
                                              <CardTitle className="text-sm font-semibold text-slate-800">
                                                Column {columnIndex + 1}
                                              </CardTitle>
                                              <div className="flex items-center gap-2">
                                                <div {...columnDragProvided.dragHandleProps}>
                                                  <GripVertical className="h-4 w-4 text-slate-400" />
                                                </div>
                                                <Button
                                                  type="button"
                                                  size="icon"
                                                  variant="ghost"
                                                  className="h-8 w-8 text-red-500 hover:text-red-700"
                                                  onClick={() => removeColumn(index, columnId)}
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            </CardHeader>
                                            <CardContent>
                                              {renderWidgets(
                                                index,
                                                `widgets-column-${sectionKey}::${columnId}`,
                                                column.children,
                                                columnId,
                                              )}
                                            </CardContent>
                                          </Card>
                                        )}
                                      </Draggable>
                                    )
                                  })}
                                  {columnsProvided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          ) : (
                            renderWidgets(index, droppableId, section.elements, null)
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                )
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="flex justify-center">
        <Button type="button" onClick={addSection} className="rounded-full px-6">
          <Plus className="mr-2 h-4 w-4" />
          Add section
        </Button>
      </div>
    </div>
  )
}

export const BuilderDesigner = memo(BuilderDesignerComponent)
