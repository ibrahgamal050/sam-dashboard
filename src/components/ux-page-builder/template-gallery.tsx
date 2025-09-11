'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'

const templates = [
  {
    id: 'classic-shop',
    name: 'Classic Shop',
    image: '/placeholder.svg?height=200&width=300',
  },
  {
    id: 'simple-slider',
    name: 'Simple Slider',
    image: '/placeholder.svg?height=200&width=300',
  },
  {
    id: 'grid-style-1',
    name: 'Grid Style 1',
    image: '/placeholder.svg?height=200&width=300',
  },
  {
    id: 'grid-style-2',
    name: 'Grid Style 2',
    image: '/placeholder.svg?height=200&width=300',
  },
  {
    id: 'simple-corporate',
    name: 'Simple Corporate',
    image: '/placeholder.svg?height=200&width=300',
  },
  {
    id: 'fullscreen-fashion',
    name: 'Fullscreen Fashion',
    image: '/placeholder.svg?height=200&width=300',
  },
  {
    id: 'big-sale-countdown',
    name: 'Big Sale Countdown',
    image: '/placeholder.svg?height=200&width=300',
  },
  {
    id: 'big-sale',
    name: 'Big Sale',
    image: '/placeholder.svg?height=200&width=300',
  },
]

export function TemplateGallery() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-8 text-center">Insert a template</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="group relative">
            <div className="relative aspect-[3/2] overflow-hidden rounded-lg border">
              <Image
                src={template.image}
                alt={template.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <h3 className="text-sm font-medium">{template.name}</h3>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                Use
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
