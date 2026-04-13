'use client'

import * as React from "react"
import { Download } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

import { cn } from "@/lib/utils"
import { templates } from "./qr-template-styles"

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

    const qrSvg = previewRef.current.querySelector("svg")
    if (!qrSvg) return

    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(qrSvg)
    const qrDataUrl = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgString)))

    const qrImg = new Image()
    qrImg.onload = () => {
      const scale = 2
      const width = 760 * scale
      const height = 980 * scale

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const cardX = 60 * scale
      const cardY = 60 * scale
      const cardW = width - cardX * 2
      const cardH = height - cardY * 2
      const radiusBase = template === "rounded" ? 44 * scale : 32 * scale

      // Helpers
      const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath()
        ctx.moveTo(x + r, y)
        ctx.lineTo(x + w - r, y)
        ctx.quadraticCurveTo(x + w, y, x + w, y + r)
        ctx.lineTo(x + w, y + h - r)
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
        ctx.lineTo(x + r, y + h)
        ctx.quadraticCurveTo(x, y + h, x, y + h - r)
        ctx.lineTo(x, y + r)
        ctx.quadraticCurveTo(x, y, x + r, y)
        ctx.closePath()
      }

      // Background subtle gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, "#f7fbff")
      gradient.addColorStop(1, "#e5f4e8")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      // Card shadow + body
      ctx.shadowColor = "rgba(15, 118, 110, 0.18)"
      ctx.shadowBlur = 28 * scale
      ctx.shadowOffsetY = 12 * scale
      ctx.fillStyle = "#ffffff"
      roundRect(cardX, cardY, cardW, cardH, radiusBase)
      ctx.fill()
      ctx.shadowColor = "transparent"

      // Template-specific accents
      const drawTemplateAccents = () => {
        switch (template) {
          case "banner": {
            ctx.fillStyle = backgroundColor
            roundRect(cardX, cardY, cardW, 130 * scale, radiusBase)
            ctx.fill()
            break
          }
          case "frame": {
            ctx.lineWidth = 12 * scale
            ctx.strokeStyle = backgroundColor
            roundRect(cardX + 10 * scale, cardY + 10 * scale, cardW - 20 * scale, cardH - 20 * scale, radiusBase - 8 * scale)
            ctx.stroke()
            break
          }
          case "pocket": {
            ctx.fillStyle = backgroundColor
            ctx.fillRect(cardX - 4 * scale, cardY + cardH / 2 - 110 * scale, 28 * scale, 220 * scale)
            ctx.fillRect(cardX + cardW - 24 * scale, cardY + cardH / 2 - 110 * scale, 28 * scale, 220 * scale)
            break
          }
          case "wave": {
            ctx.fillStyle = backgroundColor + "90"
            ctx.beginPath()
            ctx.moveTo(cardX + cardW * 0.1, cardY + cardH * 0.35)
            ctx.bezierCurveTo(cardX + cardW * 0.3, cardY + cardH * 0.15, cardX + cardW * 0.7, cardY + cardH * 0.55, cardX + cardW * 0.9, cardY + cardH * 0.3)
            ctx.lineTo(cardX + cardW * 0.9, cardY + cardH * 0.8)
            ctx.lineTo(cardX + cardW * 0.1, cardY + cardH * 0.8)
            ctx.closePath()
            ctx.fill()
            break
          }
          case "arc": {
            const g = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH * 0.6)
            g.addColorStop(0, backgroundColor)
            g.addColorStop(1, backgroundColor + "00")
            ctx.fillStyle = g
            roundRect(cardX, cardY, cardW, cardH * 0.55, radiusBase)
            ctx.fill()
            break
          }
          case "rounded": {
            ctx.lineWidth = 6 * scale
            ctx.strokeStyle = backgroundColor
            roundRect(cardX + 8 * scale, cardY + 8 * scale, cardW - 16 * scale, cardH - 16 * scale, radiusBase - 6 * scale)
            ctx.stroke()
            break
          }
          default: {
            ctx.lineWidth = 6 * scale
            ctx.strokeStyle = backgroundColor
            roundRect(cardX + 8 * scale, cardY + 8 * scale, cardW - 16 * scale, cardH - 16 * scale, radiusBase - 10 * scale)
            ctx.stroke()
          }
        }
      }
      drawTemplateAccents()

      // Top label
      ctx.fillStyle = textColor
      ctx.font = `${26 * scale}px "Inter", system-ui, sans-serif`
      ctx.textAlign = "center"
      const labelY = template === "banner" ? cardY + 90 * scale : cardY + 70 * scale
      ctx.fillText(description || "Scan me", width / 2, labelY)

      // QR block centered
      const qrSize = 360 * scale
      const qrX = width / 2 - qrSize / 2
      const qrY = labelY + 30 * scale
      ctx.fillStyle = "#ffffff"
      roundRect(qrX - 14 * scale, qrY - 14 * scale, qrSize + 28 * scale, qrSize + 28 * scale, 22 * scale)
      ctx.fill()
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)

      // Title
      ctx.fillStyle = textColor
      ctx.font = `${28 * scale}px "Inter", system-ui, sans-serif`
      ctx.fillText(title || "Our menu", width / 2, qrY + qrSize + 70 * scale)

      // Powered by pill
      if (!hideWebsite) {
        const pillText = "Powered by meelza.com"
        ctx.font = `${18 * scale}px "Inter", system-ui, sans-serif`
        const pillWidth = ctx.measureText(pillText).width + 32 * scale
        const pillX = width / 2 - pillWidth / 2
        const pillY = qrY + qrSize + 105 * scale
        ctx.fillStyle = "#e8ecef"
        roundRect(pillX, pillY - 22 * scale, pillWidth, 44 * scale, 20 * scale)
        ctx.fill()
        ctx.fillStyle = "#0f172a"
        ctx.fillText(pillText, width / 2, pillY + 6 * scale)
      }

      // Download
      const pngFile = canvas.toDataURL("image/png")
      const downloadLink = document.createElement("a")
      downloadLink.download = `${title || "qr-code"}-poster.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }

    qrImg.src = qrDataUrl
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
              <div className="flex items-center gap-2 text-xs font-medium  tracking-wide text-muted-foreground">
                <span className="font-semibold">Powered by</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">meelza.com</span>
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
