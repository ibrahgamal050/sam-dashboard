"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

interface MenuCreateCategoryButtonProps {
  restaurantId: string
}

export function MenuCreateCategoryButton({ restaurantId }: MenuCreateCategoryButtonProps) {
  return (
    <Button asChild>
      <Link href={`/dashboard/restaurants/${restaurantId}/menu/categories/new`}>
        <Plus className="mr-2 h-4 w-4" />
        Add Category
      </Link>
    </Button>
  )
}
