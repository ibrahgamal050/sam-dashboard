export type DashboardTenantType = "restaurant" | "supermarket" | "brand"

export function buildDashboardTenantBasePath(type: DashboardTenantType, subdomain: string) {
  return `/dashboard/${type}/${subdomain}`.replace(/\/+$/, "")
}

export function buildLegacyDashboardBasePath(subdomain: string) {
  return `/dashboard/${subdomain}`.replace(/\/+$/, "")
}

export function buildDashboardSitePath(site: {
  type: DashboardTenantType
  slug: string
  subdomain?: string
}) {
  const siteKey = site.type === "restaurant" ? site.subdomain || site.slug : site.slug
  return buildDashboardTenantBasePath(site.type, siteKey)
}
