import * as React from 'react'
import { ComponentType } from './types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface PropertyEditorProps {
  component: ComponentType | null
  onUpdateComponent: (component: ComponentType) => void
}

export function PropertyEditor({ component, onUpdateComponent }: PropertyEditorProps) {
  if (!component) {
    return <div className="w-64 bg-muted p-4">Select a component to edit its properties</div>
  }

  const handleChange = (key: string, value: string) => {
    onUpdateComponent({
      ...component,
      props: {
        ...component.props,
        [key]: value,
      },
    })
  }

  const renderFields = () => {
    switch (component.type) {
      case 'heading':
        return (
          <>
            <div className="mb-4">
              <Label htmlFor="text">Text</Label>
              <Input
                id="text"
                value={component.props.text}
                onChange={(e) => handleChange('text', e.target.value)}
              />
            </div>
            <div className="mb-4">
              <Label htmlFor="level">Level</Label>
              <Select
                value={component.props.level}
                onValueChange={(value) => handleChange('level', value)}
              >
                <SelectTrigger id="level">
                  <SelectValue placeholder="Select heading level" />
                </SelectTrigger>
                <SelectContent>
                  {['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((level) => (
                    <SelectItem key={level} value={level}>
                      {level.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )
      case 'paragraph':
        return (
          <div className="mb-4">
            <Label htmlFor="text">Text</Label>
            <Input
              id="text"
              value={component.props.text}
              onChange={(e) => handleChange('text', e.target.value)}
            />
          </div>
        )
      case 'image':
        return (
          <>
            <div className="mb-4">
              <Label htmlFor="src">Image URL</Label>
              <Input
                id="src"
                value={component.props.src}
                onChange={(e) => handleChange('src', e.target.value)}
              />
            </div>
            <div className="mb-4">
              <Label htmlFor="alt">Alt Text</Label>
              <Input
                id="alt"
                value={component.props.alt}
                onChange={(e) => handleChange('alt', e.target.value)}
              />
            </div>
          </>
        )
      case 'button':
        return (
          <>
            <div className="mb-4">
              <Label htmlFor="text">Text</Label>
              <Input
                id="text"
                value={component.props.text}
                onChange={(e) => handleChange('text', e.target.value)}
              />
            </div>
            <div className="mb-4">
              <Label htmlFor="variant">Variant</Label>
              <Select
                value={component.props.variant}
                onValueChange={(value) => handleChange('variant', value)}
              >
                <SelectTrigger id="variant">
                  <SelectValue placeholder="Select button variant" />
                </SelectTrigger>
                <SelectContent>
                  {['default', 'secondary', 'destructive'].map((variant) => (
                    <SelectItem key={variant} value={variant}>
                      {variant}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className="w-64 bg-muted p-4">
      <h2 className="text-lg font-semibold mb-4">Properties</h2>
      {renderFields()}
    </div>
  )
}

