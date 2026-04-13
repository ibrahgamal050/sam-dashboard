'use client'

import * as React from "react"
import { QRCodeSVG } from "qrcode.react"

import { cn } from "@/lib/utils"
import { templates } from "./qr-template-styles"

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
          "--qr-accent-color": backgroundColor,
          "--qr-text-color": textColor,
        } as React.CSSProperties

        const isSelected = selectedTemplate === template.id

        return (
          <div
            key={template.id}
            className={cn(
              "relative rounded-2xl border border-emerald-100 bg-white/85 p-4 text-left shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-lg",
              isSelected && "ring-2 ring-emerald-200 shadow-xl",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-emerald-900">{template.name}</p>
               
              </div>
              {template.tag && (
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800">
                  {template.tag}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => onSelect(template.id)}
              className={cn(
                "group relative mt-3 flex h-36 w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-emerald-100 bg-white transition",
                "hover:border-emerald-200",
                isSelected && "border-emerald-200 ring-1 ring-emerald-200",
              )}
            >
              <div
                className={cn(
                  "relative flex h-full w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-lg bg-white",
                  template.className,
                  "beforeClass" in template ? template.beforeClass ?? "" : "",
                  "afterClass" in template ? template.afterClass ?? "" : "",
                )}
                style={style}
              >
                {template.headerClass && (
                  <div
                    className={cn("text-[10px] uppercase tracking-wide", template.headerClass)}
                    style={{ color: textColor }}
                  >
                    Table
                  </div>
                )}
                <div className={cn("relative z-10 flex flex-col items-center gap-1", template.qrWrapperClass)}>
                  <QRCodeSVG value="https://example.com" size={48} level="M" fgColor={textColor} bgColor="transparent" />
                  <span className="text-[11px]" style={{ color: textColor }}>
                    Scan here
                  </span>
                </div>
                {template.footerClass && (
                  <div
                    className={cn("text-[10px] uppercase tracking-wide", template.footerClass)}
                    style={{ color: textColor }}
                  >
                    Scan here
                  </div>
                )}
              </div>
              <span
                className={cn(
                  "absolute right-2 top-2 rounded-full px-2 py-1 text-[10px] font-semibold",
                  isSelected ? "bg-emerald-600 text-white" : "bg-white/80 text-emerald-700 shadow",
                )}
              >
                {isSelected ? "Selected" : "Use template"}
              </span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
