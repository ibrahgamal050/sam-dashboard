import BranchesPageClient from "./branches-page-client"

type BranchesPageProps = {
  params: Promise<{ subdomain: string }>
}

export default async function BranchesPage({ params }: BranchesPageProps) {
  const { subdomain } = await params

  return <BranchesPageClient subdomain={subdomain} />
}
