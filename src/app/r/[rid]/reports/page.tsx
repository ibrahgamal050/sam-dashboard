'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ReportsPlaceholder({ params }: { params: { rid: string } }) {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Reports • {params.rid}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Reports dashboard placeholder. Use /r/{params.rid}/reports.</p>
        </CardContent>
      </Card>
    </div>
  )
}

