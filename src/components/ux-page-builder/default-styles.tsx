'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface StyleOption {
  name: string
  preview: React.ReactNode
  styles: Record<string, any>
}

const defaultStyles: StyleOption[] = [
  {
    name: 'Modern',
    preview: <div className="w-full h-20 bg-blue-500 flex items-center justify-center text-white">Modern</div>,
    styles: {
      fontFamily: 'Inter, sans-serif',
      backgroundColor: '#f0f4f8',
      primaryColor: '#3b82f6',
      secondaryColor: '#1e40af',
    }
  },
  {
    name: 'Classic',
    preview: <div className="w-full h-20 bg-gray-200 flex items-center justify-center text-gray-800 border border-gray-400">Classic</div>,
    styles: {
      fontFamily: 'Georgia, serif',
      backgroundColor: '#ffffff',
      primaryColor: '#4a5568',
      secondaryColor: '#718096',
    }
  },
  {
    name: 'Minimalist',
    preview: <div className="w-full h-20 bg-white flex items-center justify-center text-black border border-gray-200">Minimalist</div>,
    styles: {
      fontFamily: 'Helvetica, Arial, sans-serif',
      backgroundColor: '#ffffff',
      primaryColor: '#000000',
      secondaryColor: '#cccccc',
    }
  },
]

interface DefaultStylesProps {
  onClose: () => void
  onApplyStyle: (styles: Record<string, any>) => void
}

export function DefaultStyles({ onClose, onApplyStyle }: DefaultStylesProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-96 rounded-lg shadow-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Choose Default Style</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="h-96 p-4">
          <div className="space-y-4">
            {defaultStyles.map((style) => (
              <div key={style.name} className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">{style.name}</h3>
                {style.preview}
                <Button 
                  className="w-full mt-2" 
                  onClick={() => onApplyStyle(style.styles)}
                >
                  Apply Style
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

