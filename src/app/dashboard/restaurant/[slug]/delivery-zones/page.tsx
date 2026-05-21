import TenantDeliveryZonesPage from "@/app/dashboard/_components/tenant-delivery-zones-page"

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function RestaurantDeliveryZonesPage({ params }: PageProps) {
  const { slug } = await params
  return <TenantDeliveryZonesPage slug={slug} entityType="restaurant" />
}
