export interface BusinessSettings {
  taxRate: number
  currency: string
  timezone: string
  loyaltyPointsRate: number
  orderNumberPrefix: string
  tableNumberPrefix: string
}

export interface PaymentsSettings {
  cash: boolean
  card: boolean
  wallet: boolean
  onlinePayments: boolean
  tipSuggestions: number[]
}

export interface NotificationsSettings {
  email: boolean
  sms: boolean
  push: boolean
  orderAlerts: boolean
  lowStockAlerts: boolean
  customerFeedback: boolean
}

export interface IntegrationsSettings {
  deliveryPlatforms: string[]
  posSystem: string | null
  inventorySystem: string | null
  googleAnalytics: string
  facebookPixel: string
  mailchimp: string
  twilioSid: string
}

export interface StaffSettings {
  defaultRoles: string[]
  maxActiveSessions: number
}

export interface SettingsState {
  business: BusinessSettings
  payments: PaymentsSettings
  notifications: NotificationsSettings
  integrations: IntegrationsSettings
  staff: StaffSettings
}

export type UpdateSettingsFn = <Section extends keyof SettingsState>(
  section: Section,
  updates: Partial<SettingsState[Section]>,
) => void

export interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  permissions: string[]
  isActive: boolean
  lastLogin: string
  joinDate: string
}

export const roles = [
  {
    value: "Manager",
    label: "Manager",
    permissions: ["all"],
  },
  {
    value: "Supervisor",
    label: "Supervisor",
    permissions: ["orders", "inventory", "reports"],
  },
  {
    value: "Cashier",
    label: "Cashier",
    permissions: ["orders", "payments"],
  },
  {
    value: "Staff",
    label: "Staff",
    permissions: ["orders"],
  },
]
