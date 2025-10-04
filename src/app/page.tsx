import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Order Details Demo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              View a comprehensive order tracking interface for a food delivery application.
            </p>
            <Link href="/order/ORD-123456">
              <Button size="lg" className="w-full">
                View Sample Order Details
              </Button>
            </Link>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Features Included</h3>
              <ul className="text-left space-y-1 text-muted-foreground">
                <li>• Interactive map integration</li>
                <li>• Real-time order tracking</li>
                <li>• Customer & driver profiles</li>
                <li>• Order history timeline</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">UI Components</h3>
              <ul className="text-left space-y-1 text-muted-foreground">
                <li>• Responsive grid layout</li>
                <li>• Status indicators</li>
                <li>• Contact action buttons</li>
                <li>• Itemized pricing</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
