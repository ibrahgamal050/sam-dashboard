"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

interface MenuItemCreateButtonProps {
  restaurantId: string
  categoryId: string
}

export function MenuItemCreateButton({ restaurantId, categoryId }: MenuItemCreateButtonProps) {
  return (
    <Button asChild>
      <Link href={`/dashboard/restaurants/${restaurantId}/menu/items/new?categoryId=${categoryId}`}>
        <Plus className="mr-2 h-4 w-4" />
        Add Menu Item
      </Link>
    </Button>
  )
}
