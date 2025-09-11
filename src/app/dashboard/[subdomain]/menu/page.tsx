'use client'

import { useParams } from 'next/navigation'

import { ChevronRight, Link2, MoreHorizontal, Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/sidebar/sidebar"
import { MenuManager } from '@/components/menu/menu-manager'

const menuItems = [
  {
    name: "Hand-made ravioli",
    description: "Artisanal hand-made ravioli, filled with a blend of cheeses",
    price: "6.50",
    image: "/placeholder.svg?height=80&width=80"
  },
  {
    name: "Tofu skewers",
    description: "Grilled tofu skewers, marinated in a blend of soy and sesame",
    price: "7.50",
    dietary: ["🌱"],
    image: "/placeholder.svg?height=80&width=80"
  },
  {
    name: "Peanut crusted steak",
    description: "Juicy, tender steak cooked to your liking, served with seasonal vegetables",
    price: "8.00",
    image: "/placeholder.svg?height=80&width=80"
  },
  {
    name: "Fish of the day",
    description: "Fresh catch of the day paired with asparagus & crispy potatoes",
    price: "8.00",
    dietary: ["🐟"],
    image: "/placeholder.svg?height=80&width=80"
  },
  {
    name: "Classic burger",
    description: "Our classic burger with lettuce, pickles, heirloom tomatoes",
    price: { min: "7.00", max: "9.00", variants: 3 },
    image: "/placeholder.svg?height=80&width=80"
  },
  {
    name: "Schnitzel",
    description: "Crisp and golden on the outside, in a herb and parmesan crust",
    price: "4.00",
    image: "/placeholder.svg?height=80&width=80"
  }
]

export default function MenuPage() {
  const { subdomain } = useParams() as { subdomain: string }
  return (
    <div className="flex min-h-screen bg-background">
      
      <div className="flex-1">
        <div className="h-full">
          

       < MenuManager subdomain={subdomain} />
        </div>
      </div>
    </div>
  )
}

