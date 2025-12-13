import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ReportsPlaceholder({ params }: { params: Promise<{ rid: string }> }) {
  const { rid } = await params
  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Reports • {rid}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Reports dashboard placeholder. Use /r/{rid}/reports.</p>
        </CardContent>
      </Card>
    </div>
  )
}
