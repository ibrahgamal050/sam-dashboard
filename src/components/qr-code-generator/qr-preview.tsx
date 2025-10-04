'use client'

import * as React from 'react'
import { Download } from "lucide-react"
import { QRCodeSVG } from 'qrcode.react'

import { cn } from "@/lib/utils"
import { templates } from './qr-template-styles'

interface QRPreviewProps {
  url: string
  title: string
  description: string
  backgroundColor: string
  textColor: string
  showLogo: boolean
  template: string
  hideWebsite?: boolean
}

export function QRPreview({ url, title, description, backgroundColor, textColor, showLogo, template, hideWebsite }: QRPreviewProps) {
  const previewRef = React.useRef<HTMLDivElement>(null)
  const selectedTemplate = templates.find(t => t.id === template) || templates[0]
  
  const style = {
    '--qr-accent-color': backgroundColor,
    '--qr-text-color': textColor,
  } as React.CSSProperties

  const downloadQR = () => {
    if (!previewRef.current) return

    const element = previewRef.current
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    // Set canvas size to match the element size
    const rect = element.getBoundingClientRect()
    canvas.width = rect.width * 2 // For better quality
    canvas.height = rect.height * 2
    
    // Convert the element to an image
    const data = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">
          ${element.outerHTML}
        </div>
      </foreignObject>
    </svg>`

    const img = new Image()
    img.onload = () => {
      if (!ctx) return
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const pngFile = canvas.toDataURL('image/png')
      
      const downloadLink = document.createElement('a')
      downloadLink.download = `${title}-qr-code.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(data)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full rounded-3xl bg-white p-6 shadow-xl">
        <div
          ref={previewRef}
          className={cn(
            "relative mx-auto flex max-w-sm flex-col items-center rounded-[32px] bg-white px-10 py-12 text-center shadow-[0_12px_40px_-20px_rgba(15,23,42,0.35)]",
            selectedTemplate.className,
            'beforeClass' in selectedTemplate ? selectedTemplate.beforeClass : "",
            'afterClass' in selectedTemplate ? selectedTemplate.afterClass ?? "" : ""
          )}
          style={style}
        >
          <div className="absolute inset-3 rounded-[28px] border-[3px]" style={{ borderColor: backgroundColor }} />
          <div className="relative z-10 flex flex-col items-center gap-6">
            <span className="text-lg font-semibold" style={{ color: textColor }}>
              {description || "Scan me"}
            </span>
            <div className={cn("flex flex-col items-center", selectedTemplate.qrWrapperClass)}>
              <QRCodeSVG
                value={url}
                size={220}
                level="H"
                includeMargin
                fgColor={textColor}
                bgColor="transparent"
              />
            </div>
            <p className="text-lg font-medium" style={{ color: textColor }}>
              {title}
            </p>
            {!hideWebsite && (
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <span className="font-semibold">Powered by</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">upmenu</span>
              </div>
            )}
            {showLogo && (
              <div className="text-[11px] text-muted-foreground">
                Brand logo appears here
              </div>
            )}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={downloadQR}
        className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-5 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        <Download className="h-4 w-4" />
        Download
      </button>
    </div>
  )
}
