import { notFound } from "next/navigation"

import { MenuEditor } from "@/components/dashboard/menu/menu-editor"
import dbConnect from "@/lib/dbConnect"
import Restaurant from "@/models/Restaurant"
import RestaurantMenu from "@/models/RestaurantMenu"
import type { IMenu } from "@/types/menu"

type MenuPageProps = {
  params: Promise<{
    subdomain?: string | string[]
  }>
}

export default async function MenuPage({ params }: MenuPageProps) {
  const { subdomain: rawSubdomain } = await params
  const subdomain = Array.isArray(rawSubdomain) ? rawSubdomain[0] : rawSubdomain

  if (!subdomain) {
    notFound()
  }

  try {
    await dbConnect()

    const escapedSubdomain = escapeRegExp(subdomain)
    const restaurant = await Restaurant.findOne({
      subdomain: { $regex: new RegExp(`^${escapedSubdomain}$`, "i") },
    })

    if (!restaurant) {
      notFound()
    }

    let menu = await RestaurantMenu.findOne({ restaurantId: restaurant._id })

    if (!menu) {
      const restName = restaurant.name?.ar || restaurant.name?.en || restaurant.subdomain
      menu = await RestaurantMenu.create({
        restaurantId: restaurant._id,
        name: restName,
        categories: [],
        menuImages: [],
      })
    }

    const menuId = menu._id.toString()
    const serializedMenu = JSON.parse(JSON.stringify(menu)) as IMenu

    return <MenuEditor menuId={menuId} initialMenu={serializedMenu} />
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "digest" in error &&
      typeof (error as { digest?: string }).digest === "string" &&
      (error as { digest?: string }).digest === "NEXT_NOT_FOUND"
    ) {
      throw error
    }

    console.error("Error loading menu page:", error)
    throw new Error("Failed to load menu page")
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
