'use client'

import * as React from 'react'
import { QRCodeSVG } from 'qrcode.react'

import { cn } from "@/lib/utils"
import { templates } from './qr-template-styles'

interface TemplateSelectorProps {
  selectedTemplate: string
  backgroundColor: string
  textColor: string
  onSelect: (templateId: string) => void
}

export function TemplateSelector({ selectedTemplate, backgroundColor, textColor, onSelect }: TemplateSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {templates.map((template) => {
        const style = {
          '--qr-accent-color': backgroundColor,
          '--qr-text-color': textColor,
        } as React.CSSProperties

        const isSelected = selectedTemplate === template.id

        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template.id)}
            className={cn(
              "group relative flex h-32 w-full flex-col items-center justify-center rounded-xl border-2 bg-white/80 p-4 text-xs font-medium transition-all",
              "hover:border-primary/70 hover:shadow-lg",
              isSelected ? "border-primary shadow-lg ring-2 ring-primary/30" : "border-border shadow-sm"
            )}
          >
            <div
              className={cn(
                "relative flex h-full w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-lg bg-white",
                template.className,
                'beforeClass' in template ? template.beforeClass ?? '' : '',
                'afterClass' in template ? template.afterClass ?? '' : ''
              )}
              style={style}
            >
              {template.headerClass && (
                <div className={cn("text-[10px] uppercase tracking-wide", template.headerClass)} style={{ color: textColor }}>
                  Table
                </div>
              )}
              <div className={cn("relative z-10 flex flex-col items-center gap-1", template.qrWrapperClass)}>
                <QRCodeSVG
                  value="https://example.com"
                  size={42}
                  level="M"
                  fgColor={textColor}
                  bgColor="transparent"
                />
                <span className="text-[11px]" style={{ color: textColor }}>
                  Scan here
                </span>
              </div>
              {template.footerClass && (
                <div className={cn("text-[10px] uppercase tracking-wide", template.footerClass)} style={{ color: textColor }}>
                  Scan here
                </div>
              )}
            </div>
            {isSelected && <span className="absolute -bottom-2 text-[11px] font-semibold text-primary">Selected</span>}
          </button>
        )
      })}
    </div>
  )
}
