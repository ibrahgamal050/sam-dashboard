'use client'

import * as React from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { cn } from "@/lib/utils"
import { templates } from './qr-template-styles'

interface QRPreviewProps {
  url: string
  title: string
  backgroundColor: string
  textColor: string
  showLogo: boolean
  template: string
}

export function QRPreview({
  url,
  title,
  backgroundColor,
  textColor,
  showLogo,
  template
}: QRPreviewProps) {
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
    <div className="flex flex-col items-center gap-4">
      <div
        ref={previewRef}
        className={cn(
          "bg-white",
          selectedTemplate.className,
          selectedTemplate.beforeClass,
          selectedTemplate.afterClass
        )}
        style={style}
      >
        {selectedTemplate.headerClass && (
          <div className={selectedTemplate.headerClass} style={{ color: textColor }}>
            Table
          </div>
        )}
        <div className={cn("flex flex-col items-center gap-4", selectedTemplate.qrWrapperClass)}>
          <h2 className="text-xl font-semibold" style={{ color: textColor }}>
            Scan me
          </h2>
          <QRCodeSVG
            value={url}
            size={200}
            level="H"
            includeMargin
            fgColor={textColor}
            bgColor="transparent"
          />
          <p className="text-lg" style={{ color: textColor }}>
            {title}
          </p>
          {showLogo && (
            <div className="flex items-center gap-2 text-sm" style={{ color: textColor }}>
              Powered by
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path
                  fill={textColor}
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                />
              </svg>
              upmenu
            </div>
          )}
        </div>
      </div>
      <button
        onClick={downloadQR}
        className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
      >
        Download QR Code
      </button>
    </div>
  )
}

