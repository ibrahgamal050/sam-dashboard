"use client"

import { CreditCard } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

import type { SettingsState, UpdateSettingsFn } from "../settings-data"

interface PaymentsSectionProps {
  settings: SettingsState["payments"]
  updateSettings: UpdateSettingsFn
}

export function PaymentsSection({ settings, updateSettings }: PaymentsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="mr-2 h-5 w-5" />
          Payment Methods
        </CardTitle>
        <CardDescription>Configure accepted payment methods and settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Cash Payments</Label>
              <p className="text-sm text-muted-foreground">Accept cash payments</p>
            </div>
            <Switch
              checked={settings.cash}
              onCheckedChange={(checked) => updateSettings("payments", { cash: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Card Payments</Label>
              <p className="text-sm text-muted-foreground">Accept credit/debit card payments</p>
            </div>
            <Switch
              checked={settings.card}
              onCheckedChange={(checked) => updateSettings("payments", { card: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Digital Wallet</Label>
              <p className="text-sm text-muted-foreground">Accept Apple Pay, Google Pay, etc.</p>
            </div>
            <Switch
              checked={settings.wallet}
              onCheckedChange={(checked) => updateSettings("payments", { wallet: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Online Payments</Label>
              <p className="text-sm text-muted-foreground">Accept online payments for delivery/pickup</p>
            </div>
            <Switch
              checked={settings.onlinePayments}
              onCheckedChange={(checked) => updateSettings("payments", { onlinePayments: checked })}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>Tip Suggestions (%)</Label>
          <div className="flex space-x-2">
            {settings.tipSuggestions.map((tip, index) => (
              <Input
                key={index}
                type="number"
                value={tip}
                onChange={(event) => {
                  const newTips = [...settings.tipSuggestions]
                  newTips[index] = Number.parseInt(event.target.value)
                  updateSettings("payments", { tipSuggestions: newTips })
                }}
                className="w-20"
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
