import * as React from 'react'
import { Component } from './types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface PropertyEditorProps {
  component: Component | null
  onUpdateComponent: (component: Component) => void
}

export function PropertyEditor({ component, onUpdateComponent }: PropertyEditorProps) {
  if (!component) {
    return <div className="w-64 bg-muted p-4">Select a component to edit its properties</div>
  }

  const handleChange = (key: string, value: unknown) => {
    onUpdateComponent({
      ...component,
      props: {
        ...(component.props ?? {}),
        [key]: value,
      },
    })
  }

  const renderFields = () => {
    switch (component.type) {
      case 'text': {
        const variant = component.props?.variant as 'heading' | 'paragraph' | undefined

        if (variant === 'heading') {
          return (
            <>
              <div className="mb-4">
                <Label htmlFor="text">Heading Text</Label>
                <Input
                  id="text"
                  value={(component.props?.text as string) ?? ''}
                  onChange={(e) => handleChange('text', e.target.value)}
                />
              </div>
              <div className="mb-4">
                <Label htmlFor="level">Heading Level</Label>
                <Select
                  value={(component.props?.level as string) ?? 'h2'}
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
        }

        return (
          <div className="mb-4">
            <Label htmlFor="text">Text</Label>
            <Input
              id="text"
              value={(component.props?.text as string) ?? ''}
              onChange={(e) => handleChange('text', e.target.value)}
            />
          </div>
        )
      }
      case 'image':
        return (
          <>
            <div className="mb-4">
              <Label htmlFor="src">Image URL</Label>
              <Input
                id="src"
                value={(component.props?.src as string) ?? ''}
                onChange={(e) => handleChange('src', e.target.value)}
              />
            </div>
            <div className="mb-4">
              <Label htmlFor="alt">Alt Text</Label>
              <Input
                id="alt"
                value={(component.props?.alt as string) ?? ''}
                onChange={(e) => handleChange('alt', e.target.value)}
              />
            </div>
          </>
        )
      case 'button':
        return (
          <>
            <div className="mb-4">
              <Label htmlFor="text">Button Text</Label>
              <Input
                id="text"
                value={(component.props?.text as string) ?? ''}
                onChange={(e) => handleChange('text', e.target.value)}
              />
            </div>
            <div className="mb-4">
              <Label htmlFor="variant">Variant</Label>
              <Select
                value={(component.props?.variant as string) ?? 'default'}
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
      case 'banner':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="banner-text">Banner Text</Label>
              <Input
                id="banner-text"
                value={(component.props?.text as string) ?? 'Banner heading'}
                onChange={(e) => handleChange('text', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="banner-bg">Background Color</Label>
              <Input
                id="banner-bg"
                type="color"
                value={(component.props?.backgroundColor as string) ?? '#1e3a8a'}
                onChange={(e) => handleChange('backgroundColor', e.target.value)}
              />
            </div>
          </div>
        )
      case 'row':
        return (
          <div className="space-y-2">
            <Label>Row Layout</Label>
            <p className="text-xs text-muted-foreground">Row components can contain columns. Drag components into each column.</p>
          </div>
        )
      case 'column':
        return (
          <div className="mb-4">
            <Label htmlFor="column-width">Column Width</Label>
            <Select
              value={(component.props?.width as string) ?? '6/12'}
              onValueChange={(value) => handleChange('width', value)}
            >
              <SelectTrigger id="column-width">
                <SelectValue placeholder="Select width" />
              </SelectTrigger>
              <SelectContent>
                {['12/12', '10/12', '8/12', '6/12', '4/12', '3/12'].map((width) => (
                  <SelectItem key={width} value={width}>
                    {width}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      case 'text-box':
        return (
          <div className="space-y-2">
            <Label htmlFor="textbox-text">Box Text</Label>
            <Input
              id="textbox-text"
              value={(component.props?.text as string) ?? 'Text box content'}
              onChange={(e) => handleChange('text', e.target.value)}
            />
          </div>
        )
      default:
        return <p className="text-sm text-muted-foreground">This component has no editable properties yet.</p>
    }
  }

  return (
    <div className="w-64 bg-muted p-4">
      <h2 className="text-lg font-semibold mb-4">Properties</h2>
      {renderFields()}
    </div>
  )
}
