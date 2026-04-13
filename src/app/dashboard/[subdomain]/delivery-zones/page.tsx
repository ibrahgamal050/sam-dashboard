import DeliveryZonesManager from "@/components/dashboard/delivery-zones/delivery-zones-manager"
import AuthGuard from "@/components/dashboard/delivery-zones/auth-guard"
import UserMenu from "@/components/dashboard/delivery-zones/user-menu"
import dbConnect from "@/lib/dbConnect"
import Restaurant from "@/models/Restaurant"
import SuperMarket from "@/models/SuperMarket"
import { notFound } from "next/navigation"

interface DeliveryZonesPageProps {
  params: Promise<{ subdomain: string }>
}

export default async function DeliveryZonesPage({ params }: DeliveryZonesPageProps) {
  const { subdomain } = await params

  await dbConnect()
  const restaurant = await Restaurant.findOne({ subdomain }).select("_id")
  if (restaurant) {
    const restaurantId = restaurant._id.toString()
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <svg className="h-4 w-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-foreground">إدارة مناطق التوصيل</h1>
            </div>
            <UserMenu />
          </div>
        </header>

        <div className="h-[calc(100vh-4rem)] p-6">
          <DeliveryZonesManager className="h-full" entityId={restaurantId} entityType="restaurant" />
        </div>
      </div>
    )
  }

  const supermarket = await SuperMarket.findOne({ slug: subdomain }).select("_id")
  if (!supermarket) {
    notFound()
  }

  const supermarketId = supermarket._id.toString()

  return (
    
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <svg className="h-4 w-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-foreground">إدارة مناطق التوصيل</h1>
            </div>
            <UserMenu />
          </div>
        </header>

        <div className="h-[calc(100vh-4rem)] p-6">
          <DeliveryZonesManager className="h-full" entityId={supermarketId} entityType="supermarket" />
        </div>
      </div>
  
  )
}
