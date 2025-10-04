"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"

import { ColorPicker } from "./color-picker"
import { QRPreview } from "./qr-preview"
import { TemplateSelector } from "./template-selector"

const BACKGROUND_COLORS = [
  { value: "#FACC15", label: "Sun" },
  { value: "#38BDF8", label: "Sky" },
  { value: "#FB7185", label: "Rose" },
  { value: "#FB923C", label: "Coral" },
  { value: "#6EE7B7", label: "Mint" },
]

const TEXT_COLORS = [
  { value: "#111827", label: "Ink" },
  { value: "#0F172A", label: "Slate" },
  { value: "#0B0B0B", label: "Black" },
  { value: "#FFFFFF", label: "White" },
]

type TemplateId = "minimal" | "rounded" | "banner" | "pocket" | "wave" | "arc" | "frame"

interface QRGeneratorProps {
  subdomain: string
}

export function QRGenerator({ subdomain }: QRGeneratorProps) {
  const { toast } = useToast()

  const [title, setTitle] = React.useState("Our menu")
  const [description, setDescription] = React.useState("Scan me")
  const [backgroundColor, setBackgroundColor] = React.useState(BACKGROUND_COLORS[0].value)
  const [textColor, setTextColor] = React.useState(TEXT_COLORS[0].value)
  const [showLogo, setShowLogo] = React.useState(false)
  const [selectedTemplate, setSelectedTemplate] = React.useState<TemplateId>("minimal")
  const [enableTableside, setEnableTableside] = React.useState(false)
  const [hideWebsite, setHideWebsite] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<"menu" | "table">("menu")

  const menuUrl = `https://${subdomain}.meelza.site/ar/menu/`

  const handleSave = () => {
    toast({
      title: "QR design saved",
      description: "Your QR poster is ready to download and print.",
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-slate-900">QR Code Menu & Tableside ordering</h1>
          <p className="text-sm text-slate-500">
            Customize a branded QR sign for your tables. Update colors, copy, and layout before downloading the ready-to-print poster.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <Card className="border-none bg-white shadow-xl shadow-slate-200/70">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-slate-900">QR Code template</CardTitle>
                <p className="text-sm text-slate-500">Pick a layout that fits your brand. Colors and text adapt instantly.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <TemplateSelector
                  selectedTemplate={selectedTemplate}
                  backgroundColor={backgroundColor}
                  textColor={textColor}
                  onSelect={(id) => setSelectedTemplate(id as TemplateId)}
                />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-slate-700">Background color</h3>
                    <ColorPicker
                      colors={BACKGROUND_COLORS}
                      selectedColor={backgroundColor}
                      onChange={setBackgroundColor}
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-slate-700">Text color</h3>
                    <ColorPicker colors={TEXT_COLORS} selectedColor={textColor} onChange={setTextColor} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-white shadow-xl shadow-slate-200/70">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-slate-900">Content</CardTitle>
                <p className="text-sm text-slate-500">Give guests a friendly prompt so they know what they will scan.</p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="qr-title" className="text-sm font-semibold text-slate-700">
                    Title
                  </Label>
                  <Input id="qr-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Our menu" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qr-description" className="text-sm font-semibold text-slate-700">
                    Description
                  </Label>
                  <Input
                    id="qr-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Scan me"
                  />
                </div>

                <div className="space-y-3">
                  <Checkbox
                    checked={enableTableside}
                    onChange={(event) => setEnableTableside(event.target.checked)}
                    label="Enable tableside ordering"
                  />
                  <Checkbox
                    checked={showLogo}
                    onChange={(event) => setShowLogo(event.target.checked)}
                    label="Display brand logo"
                  />
                  <Checkbox
                    checked={hideWebsite}
                    onChange={(event) => setHideWebsite(event.target.checked)}
                    label="Hide a link to the brand’s website"
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} className="rounded-full px-6">
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "menu" | "table")}>
              <TabsList className="grid w-full grid-cols-2 rounded-full bg-white shadow-lg shadow-slate-200/60">
                <TabsTrigger value="menu" className="rounded-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  Menu
                </TabsTrigger>
                <TabsTrigger value="table" className="rounded-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  Table-specific
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <QRPreview
              url={menuUrl}
              title={title}
              description={description}
              backgroundColor={backgroundColor}
              textColor={textColor}
              showLogo={showLogo}
              template={selectedTemplate}
              hideWebsite={hideWebsite}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
