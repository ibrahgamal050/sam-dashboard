'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PlatformSettingsPlaceholder() {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Platform Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Global platform settings placeholder.</p>
        </CardContent>
      </Card>
    </div>
  )
}

