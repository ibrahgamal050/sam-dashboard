'use client'

import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from "@/lib/utils"

interface ColorPickerProps {
  colors: { value: string; label: string }[]
  selectedColor: string
  onChange: (color: string) => void
}

export function ColorPicker({ colors, selectedColor, onChange }: ColorPickerProps) {
  return (
    <div className="flex gap-2">
      {colors.map((color) => (
        <button
          key={color.value}
          className={cn(
            "h-8 w-8 rounded-full border-2 flex items-center justify-center",
            selectedColor === color.value ? "border-black" : "border-transparent"
          )}
          style={{ backgroundColor: color.value }}
          onClick={() => onChange(color.value)}
          title={color.label}
        >
          {selectedColor === color.value && (
            <Check className={cn(
              "h-4 w-4",
              /^#fff|#ffffff|white$/i.test(color.value) ? "text-black" : "text-white"
            )} />
          )}
        </button>
      ))}
    </div>
  )
}

