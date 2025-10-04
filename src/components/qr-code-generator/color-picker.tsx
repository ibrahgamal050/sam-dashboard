'use client'

import * as React from 'react'
import { Check, ChevronDown } from 'lucide-react'

import { cn } from "@/lib/utils"

interface ColorPickerProps {
  colors: { value: string; label: string }[]
  selectedColor: string
  onChange: (color: string) => void
}

export function ColorPicker({ colors, selectedColor, onChange }: ColorPickerProps) {
  const customColorInputRef = React.useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-wrap items-center gap-2">
      {colors.map((color) => {
        const isLight = /^#fff(?:fff)?$/i.test(color.value)
        const isSelected = selectedColor.toLowerCase() === color.value.toLowerCase()

        return (
          <button
            key={color.value}
            type="button"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all",
              isSelected ? "border-primary shadow" : "border-transparent shadow-sm hover:border-primary/50"
            )}
            style={{ backgroundColor: color.value }}
            onClick={() => onChange(color.value)}
            title={color.label}
          >
            {isSelected && <Check className={cn("h-4 w-4", isLight ? "text-slate-900" : "text-white") } />}
          </button>
        )
      })}

      <button
        type="button"
        className="flex h-9 items-center gap-1 rounded-full border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
        onClick={() => customColorInputRef.current?.click()}
      >
        Custom
        <ChevronDown className="h-3 w-3" />
      </button>
      <input
        ref={customColorInputRef}
        type="color"
        className="hidden"
        value={selectedColor}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
