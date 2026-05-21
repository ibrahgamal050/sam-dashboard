import { redirect } from "next/navigation"

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function BrandDashboardPage({ params }: PageProps) {
  const { slug } = await params
  redirect(`/dashboard/brand/${encodeURIComponent(slug)}/catalog`)
}
