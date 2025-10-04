"use client"

import { Globe } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

import type { SettingsState, UpdateSettingsFn } from "../settings-data"

interface BusinessSectionProps {
  settings: SettingsState["business"]
  updateSettings: UpdateSettingsFn
}

export function BusinessSection({ settings, updateSettings }: BusinessSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Globe className="mr-2 h-5 w-5" />
          Business Configuration
        </CardTitle>
        <CardDescription>Configure business rules and operational settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="taxRate">Tax Rate (%)</Label>
            <Input
              id="taxRate"
              type="number"
              step="0.1"
              value={settings.taxRate}
              onChange={(event) =>
                updateSettings("business", {
                  taxRate: Number.parseFloat(event.target.value),
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={settings.currency}
              onValueChange={(value) =>
                updateSettings("business", {
                  currency: value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={settings.timezone}
              onValueChange={(value) =>
                updateSettings("business", {
                  timezone: value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                <SelectItem value="America/Chicago">Central Time</SelectItem>
                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="loyaltyRate">Loyalty Points Rate</Label>
            <Input
              id="loyaltyRate"
              type="number"
              value={settings.loyaltyPointsRate}
              onChange={(event) =>
                updateSettings("business", {
                  loyaltyPointsRate: Number.parseInt(event.target.value),
                })
              }
            />
            <p className="text-xs text-muted-foreground">Points earned per $1 spent</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="orderPrefix">Order Number Prefix</Label>
            <Input
              id="orderPrefix"
              value={settings.orderNumberPrefix}
              onChange={(event) =>
                updateSettings("business", {
                  orderNumberPrefix: event.target.value,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tablePrefix">Table Number Prefix</Label>
            <Input
              id="tablePrefix"
              value={settings.tableNumberPrefix}
              onChange={(event) =>
                updateSettings("business", {
                  tableNumberPrefix: event.target.value,
                })
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
