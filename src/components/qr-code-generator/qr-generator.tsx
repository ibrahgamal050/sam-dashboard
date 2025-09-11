'use client'

import * as React from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ColorPicker } from "./color-picker"
import { TemplateSelector } from "./template-selector"
import { QRPreview } from "./qr-preview"

const BACKGROUND_COLORS = [
  { value: '#FFD54F', label: 'Yellow' },
  { value: '#4FC3F7', label: 'Blue' },
  { value: '#EF5350', label: 'Red' },
  { value: '#FF8A65', label: 'Coral' },
  { value: '#81C784', label: 'Green' },
]

const TEXT_COLORS = [
  { value: '#000000', label: 'Black' },
  { value: '#FFFFFF', label: 'White' },
]

const TEMPLATES = [
  { id: 'basic', preview: '/placeholder.svg?height=64&width=64' },
  { id: 'rounded', preview: '/placeholder.svg?height=64&width=64' },
  { id: 'branded', preview: '/placeholder.svg?height=64&width=64' },
]
interface MenuManagerProps {
  subdomain: string;
} 
export function QRGenerator({ subdomain }: MenuManagerProps) {
  const [title, setTitle] = React.useState('Our menu')
  const [description, setDescription] = React.useState('Scan me')
  const [backgroundColor, setBackgroundColor] = React.useState(BACKGROUND_COLORS[0].value)
  const [textColor, setTextColor] = React.useState(TEXT_COLORS[0].value)
  const [showLogo, setShowLogo] = React.useState(false)
  const [template, setTemplate] = React.useState(TEMPLATES[0].id)
  const [enableTableside, setEnableTableside] = React.useState(false)
  const [hideWebsite, setHideWebsite] = React.useState(false)

  const menuUrl = `https://${subdomain}.meelza.site/ar/menu/`

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-8">QR Code Menu & Tableside ordering</h1>
      
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold mb-4">QR Code template</h2>
            <TemplateSelector
              templates={TEMPLATES}
              selectedTemplate={template}
              onSelect={setTemplate}
            />
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Background color</h3>
            <ColorPicker
              colors={BACKGROUND_COLORS}
              selectedColor={backgroundColor}
              onChange={setBackgroundColor}
            />
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Text color</h3>
            <ColorPicker
              colors={TEXT_COLORS}
              selectedColor={textColor}
              onChange={setTextColor}
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Content</h2>
            
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-logo">Display brand logo</Label>
              <Switch
                id="show-logo"
                checked={showLogo}
                onCheckedChange={setShowLogo}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="enable-tableside">Enable tableside ordering</Label>
              <Switch
                id="enable-tableside"
                checked={enableTableside}
                onCheckedChange={setEnableTableside}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="hide-website">Hide a link to the brand's website</Label>
              <Switch
                id="hide-website"
                checked={hideWebsite}
                onCheckedChange={setHideWebsite}
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <QRPreview
            url={menuUrl}
            title={title}
            backgroundColor={backgroundColor}
            textColor={textColor}
            showLogo={showLogo}
            template={template}
          />
        </div>
      </div>
    </div>
  )
}

