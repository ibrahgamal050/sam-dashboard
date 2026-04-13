"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Search, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { ZonesAPI } from "@/lib/api/zones"
import type { DeliveryZone } from "@/types/delivery-zones"

interface DeliveryCheckResult {
  isDeliveryAvailable: boolean
  zones: DeliveryZone[]
  lowestDeliveryFee: number | null
  location: { lat: number; lng: number }
}

interface DeliveryCheckWidgetProps {
  restaurantId: string
}

export default function DeliveryCheckWidget({ restaurantId }: DeliveryCheckWidgetProps) {
  const [address, setAddress] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [result, setResult] = useState<DeliveryCheckResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCheck = async () => {
    if (!restaurantId) {
      setError("لم يتم تحديد المطعم")
      return
    }
    if (!address.trim()) return

    setIsChecking(true)
    setError(null)
    setResult(null)

    try {
      // For demo purposes, we'll use Amsterdam coordinates
      // In a real app, you'd geocode the address first
      const lat = 52.3676 + (Math.random() - 0.5) * 0.1
      const lng = 4.9041 + (Math.random() - 0.5) * 0.1

      const checkResult = await ZonesAPI.checkDelivery(restaurantId, lat, lng)
      setResult(checkResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر فحص التوصيل")
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          فحص التوصيل
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="أدخل العنوان..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleCheck()}
          />
          <Button onClick={handleCheck} disabled={isChecking || !address.trim()}>
            {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
            <XCircle className="h-4 w-4" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div
              className={`flex items-center gap-2 p-3 rounded-lg ${
                result.isDeliveryAvailable
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {result.isDeliveryAvailable ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <p className="text-sm font-medium">
                {result.isDeliveryAvailable ? "التوصيل متاح" : "لا يوجد توصيل لهذا الموقع"}
              </p>
            </div>

            {result.isDeliveryAvailable && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">أقل رسوم توصيل:</span>
                  <Badge variant="secondary">{result.lowestDeliveryFee?.toFixed(2)} ج</Badge>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">المناطق المتاحة:</p>
                  {result.zones.map((zone) => (
                    <div key={zone.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }} />
                        <span className="text-sm">{zone.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {zone.delivery_fee} ج
                      </Badge>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
