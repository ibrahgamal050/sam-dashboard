import { notFound } from "next/navigation"

import TenantDeliveryZonesPage from "@/app/dashboard/_components/tenant-delivery-zones-page"
import dbConnect from "@/lib/dbConnect"
import Restaurant from "@/models/Restaurant"
import SuperMarket from "@/models/SuperMarket"

type PageProps = {
  params: Promise<{ subdomain: string }>
}

export default async function LegacyTenantDeliveryZonesPage({ params }: PageProps) {
  const { subdomain } = await params

  await dbConnect()

  const restaurant = await Restaurant.findOne({ subdomain }).select("_id")
  if (restaurant) {
    return <TenantDeliveryZonesPage slug={subdomain} entityType="restaurant" />
  }

  const supermarket = await SuperMarket.findOne({ slug: subdomain }).select("_id")
  if (supermarket) {
    return <TenantDeliveryZonesPage slug={subdomain} entityType="supermarket" />
  }

  notFound()
}
