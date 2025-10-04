"use client"

import { Bell } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

import type { SettingsState, UpdateSettingsFn } from "../settings-data"

interface NotificationsSectionProps {
  settings: SettingsState["notifications"]
  updateSettings: UpdateSettingsFn
}

export function NotificationsSection({ settings, updateSettings }: NotificationsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="mr-2 h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>Configure how you receive notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch
              checked={settings.email}
              onCheckedChange={(checked) => updateSettings("notifications", { email: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
            </div>
            <Switch
              checked={settings.sms}
              onCheckedChange={(checked) => updateSettings("notifications", { sms: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
            </div>
            <Switch
              checked={settings.push}
              onCheckedChange={(checked) => updateSettings("notifications", { push: checked })}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="font-medium">Notification Types</h4>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Order Alerts</Label>
              <p className="text-sm text-muted-foreground">New orders and status changes</p>
            </div>
            <Switch
              checked={settings.orderAlerts}
              onCheckedChange={(checked) => updateSettings("notifications", { orderAlerts: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Low Stock Alerts</Label>
              <p className="text-sm text-muted-foreground">When inventory is running low</p>
            </div>
            <Switch
              checked={settings.lowStockAlerts}
              onCheckedChange={(checked) => updateSettings("notifications", { lowStockAlerts: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Customer Feedback</Label>
              <p className="text-sm text-muted-foreground">New reviews and ratings</p>
            </div>
            <Switch
              checked={settings.customerFeedback}
              onCheckedChange={(checked) => updateSettings("notifications", { customerFeedback: checked })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
