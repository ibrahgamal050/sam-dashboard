"use client"

import * as React from "react"
import { Palette, Sparkles, Table2 } from "lucide-react"

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

  const menuUrl = `https://${subdomain}.meelza.com/ar/menu/`

  const handleSave = () => {
    toast({
      title: "QR design saved",
      description: "Your QR poster is ready to download and print.",
    })
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100/70 py-10">
      <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
        <header className="space-y-3 rounded-3xl border border-emerald-100/80 bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-600 p-6 text-white shadow-2xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/80">Brand assets</p>
              <h1 className="text-2xl font-semibold sm:text-3xl">QR Code Menu & Tableside ordering</h1>
              <p className="text-sm text-emerald-50/90">
                صمّم لوحة QR جاهزة للطباعة بألوان وشعار علامتك. اختر القالب، وعدّل النصوص قبل التنزيل.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-emerald-50/90">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                <Sparkles className="h-4 w-4" /> Live preview
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                <Table2 className="h-4 w-4" /> Tableside ready
              </span>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <Card className="border-emerald-100/80 bg-white/85 shadow-xl backdrop-blur">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-emerald-900">
                  <Palette className="h-4 w-4 text-emerald-600" />
                  QR Code template
                </CardTitle>
                <p className="text-sm text-emerald-700/90">
                  اختر القالب والألوان، ويُحدّث المعاينة مباشرة.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <TemplateSelector
                  selectedTemplate={selectedTemplate}
                  backgroundColor={backgroundColor}
                  textColor={textColor}
                  onSelect={(id) => setSelectedTemplate(id as TemplateId)}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-emerald-900">Background color</h3>
                    <ColorPicker
                      colors={BACKGROUND_COLORS}
                      selectedColor={backgroundColor}
                      onChange={setBackgroundColor}
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-emerald-900">Text color</h3>
                    <ColorPicker colors={TEXT_COLORS} selectedColor={textColor} onChange={setTextColor} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-100/80 bg-white/85 shadow-xl backdrop-blur">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-emerald-900">Content</CardTitle>
                <p className="text-sm text-emerald-700/90">حدّد النص الذي يراه العميل عند مسح الكود.</p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="qr-title" className="text-sm font-semibold text-emerald-900">
                    Title
                  </Label>
                  <Input
                    id="qr-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Our menu"
                    className="border-emerald-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qr-description" className="text-sm font-semibold text-emerald-900">
                    Description
                  </Label>
                  <Input
                    id="qr-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Scan me"
                    className="border-emerald-200"
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

                <div className="flex flex-wrap justify-end gap-2">
                  <Button variant="outline" className="rounded-full border-emerald-200 text-emerald-800 hover:bg-emerald-50">
                    Preview PDF
                  </Button>
                  <Button onClick={handleSave} className="rounded-full bg-emerald-600 px-6 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/30">
                    Save design
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "menu" | "table")}>
              <TabsList className="grid w-full grid-cols-2 rounded-full bg-white shadow-lg shadow-emerald-200/60">
                <TabsTrigger value="menu" className="rounded-full data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
                  Menu
                </TabsTrigger>
                <TabsTrigger value="table" className="rounded-full data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
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
