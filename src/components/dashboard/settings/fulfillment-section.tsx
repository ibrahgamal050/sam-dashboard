"use client"

import { useMemo } from "react"
import { Clock, PackageCheck } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import type { IRestaurant, FulfillmentSettings } from "@/types/restaurant"

const DEFAULT_SETTINGS: FulfillmentSettings = {
  allowDelivery: true,
  allowPickup: true,
  allowDineIn: true,
  autoCompleteAfterMinutes: 0,
  sendReadyNotification: true,
}

interface FulfillmentSectionProps {
  restaurant: IRestaurant | null
  onChange: (updates: Partial<IRestaurant>) => void
}

export function FulfillmentSection({ restaurant, onChange }: FulfillmentSectionProps) {
  const fulfillment = useMemo(() => {
    if (!restaurant?.fulfillmentSettings) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...restaurant.fulfillmentSettings }
  }, [restaurant?.fulfillmentSettings])

  if (!restaurant) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5" />
            Order Fulfillment
          </CardTitle>
          <CardDescription>Loading fulfillment preferences…</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-24 w-full animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    )
  }

  const updateSettings = (updates: Partial<FulfillmentSettings>) => {
    onChange({ fulfillmentSettings: { ...fulfillment, ...updates } })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PackageCheck className="h-5 w-5" />
          Order Fulfillment
        </CardTitle>
        <CardDescription>Configure how your team prepares orders and communicates with guests.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Label className="text-base">Enable delivery</Label>
              <p className="text-sm text-muted-foreground">
                Allow customers to place delivery orders that will appear in your kitchen display.
              </p>
            </div>
            <Switch
              checked={fulfillment.allowDelivery}
              onCheckedChange={(checked) => updateSettings({ allowDelivery: checked })}
              aria-label="Toggle delivery orders"
            />
          </div>

          <Separator />

          <div className="flex items-start justify-between gap-4">
            <div>
              <Label className="text-base">Enable pickup</Label>
              <p className="text-sm text-muted-foreground">
                Customers can pick up their orders at the counter when this option is enabled.
              </p>
            </div>
            <Switch
              checked={fulfillment.allowPickup}
              onCheckedChange={(checked) => updateSettings({ allowPickup: checked })}
              aria-label="Toggle pickup orders"
            />
          </div>

          <Separator />

          <div className="flex items-start justify-between gap-4">
            <div>
              <Label className="text-base">Enable dine-in</Label>
              <p className="text-sm text-muted-foreground">
                Keep this on to show eat-in tickets on the kitchen display.
              </p>
            </div>
            <Switch
              checked={fulfillment.allowDineIn}
              onCheckedChange={(checked) => updateSettings({ allowDineIn: checked })}
              aria-label="Toggle dine-in orders"
            />
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">Automation</h3>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="autoCompleteAfterMinutes">Auto-complete ready orders</Label>
            <div className="flex items-center gap-3">
              <Input
                id="autoCompleteAfterMinutes"
                type="number"
                min={0}
                max={240}
                value={fulfillment.autoCompleteAfterMinutes}
                onChange={(event) => {
                  const nextValue = Number.parseInt(event.target.value, 10)
                  if (Number.isNaN(nextValue)) {
                    updateSettings({ autoCompleteAfterMinutes: 0 })
                    return
                  }
                  updateSettings({ autoCompleteAfterMinutes: Math.min(Math.max(nextValue, 0), 240) })
                }}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">minutes after marking an order as ready (0 to disable)</span>
            </div>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <Label className="text-base">Send notification when order is ready</Label>
              <p className="text-sm text-muted-foreground">
                We will notify the customer as soon as the kitchen marks the order as ready for pickup or delivery.
              </p>
            </div>
            <Switch
              checked={fulfillment.sendReadyNotification}
              onCheckedChange={(checked) => updateSettings({ sendReadyNotification: checked })}
              aria-label="Toggle ready notifications"
            />
          </div>
        </section>
      </CardContent>
    </Card>
  )
}
