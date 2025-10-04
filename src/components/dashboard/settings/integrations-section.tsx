"use client"

import { Database } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

import type { SettingsState, UpdateSettingsFn } from "../settings-data"

interface IntegrationsSectionProps {
  settings: SettingsState["integrations"]
  updateSettings: UpdateSettingsFn
}

export function IntegrationsSection({ settings, updateSettings }: IntegrationsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="mr-2 h-5 w-5" />
          Third-Party Integrations
        </CardTitle>
        <CardDescription>Connect with external services and tools</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="googleAnalytics">Google Analytics ID</Label>
            <Input
              id="googleAnalytics"
              value={settings.googleAnalytics}
              onChange={(event) => updateSettings("integrations", { googleAnalytics: event.target.value })}
              placeholder="GA-XXXXXXXXX-X"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebookPixel">Facebook Pixel ID</Label>
            <Input
              id="facebookPixel"
              value={settings.facebookPixel}
              onChange={(event) => updateSettings("integrations", { facebookPixel: event.target.value })}
              placeholder="XXXXXXXXXXXXXXX"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="mailchimp">Mailchimp API Key</Label>
            <Input
              id="mailchimp"
              value={settings.mailchimp}
              onChange={(event) => updateSettings("integrations", { mailchimp: event.target.value })}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-us1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="twilioSid">Twilio Account SID</Label>
            <Input
              id="twilioSid"
              value={settings.twilioSid}
              onChange={(event) => updateSettings("integrations", { twilioSid: event.target.value })}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="font-medium">Available Integrations</h4>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">Stripe</h5>
                    <p className="text-sm text-muted-foreground">Payment processing</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Connect
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">QuickBooks</h5>
                    <p className="text-sm text-muted-foreground">Accounting integration</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Connect
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">DoorDash</h5>
                    <p className="text-sm text-muted-foreground">Delivery platform</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Connect
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">Uber Eats</h5>
                    <p className="text-sm text-muted-foreground">Delivery platform</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Connect
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
