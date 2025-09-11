'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PlatformUsersPlaceholder() {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Platform Users</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Global user management placeholder (for platform admins).</p>
        </CardContent>
      </Card>
    </div>
  )
}

