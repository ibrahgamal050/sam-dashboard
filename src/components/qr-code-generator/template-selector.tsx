'use client'

import * as React from 'react'
import { cn } from "@/lib/utils"
import { templates } from './qr-template-styles'
import { QRCodeSVG } from 'qrcode.react'

interface TemplateSelectorProps {
  selectedTemplate: string
  backgroundColor: string
  textColor: string
  onSelect: (templateId: string) => void
}

export function TemplateSelector({ 
  selectedTemplate, 
  backgroundColor,
  textColor,
  onSelect 
}: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {templates.map((template) => {
        const style = {
          '--qr-accent-color': backgroundColor,
          '--qr-text-color': textColor,
        } as React.CSSProperties

        return (
          <button
            key={template.id}
            className={cn(
              "p-2 rounded-lg border-2 hover:border-primary transition-colors",
              selectedTemplate === template.id ? "border-primary" : "border-border"
            )}
            onClick={() => onSelect(template.id)}
          >
            <div 
              className={cn(
                "aspect-square w-full bg-white rounded-md flex flex-col items-center justify-center",
                template.className,
                template.beforeClass,
                template.afterClass
              )}
              style={style}
            >
              {template.headerClass && (
                <div className={template.headerClass} style={{ color: textColor }}>
                  Table
                </div>
              )}
              <div className={template.qrWrapperClass}>
                <QRCodeSVG
                  value="https://example.com"
                  size={48}
                  level="M"
                  fgColor={textColor}
                  bgColor="transparent"
                />
              </div>
              {template.footerClass && (
                <div className={template.footerClass} style={{ color: textColor }}>
                  Scan here
                </div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

