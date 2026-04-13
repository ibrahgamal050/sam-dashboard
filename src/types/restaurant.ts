export interface BranchLocation {
  address: {
    ar: string
    en: string
  }
  latitude?: number
  longitude?: number
}

export interface IBranch {
  _id?: string
  name: {
    ar: string
    en: string
  }
  location: BranchLocation
  phone?: string
  workingHours?: string
  isMainBranch?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface SocialLinks {
  facebook?: string
  instagram?: string
  tiktok?: string
  twitter?: string
}

export interface OpeningHours {
  day: number
  open: string
  close: string
  isClosed?: boolean
}

export interface DeliverySettings {
  etaMin?: number
  etaMax?: number
  fee?: number
  minOrder?: number
  enabled?: boolean
}

export interface OrderAcceptanceSettings {
  mode: "auto" | "manual"
  autoCancelAfterMins?: number
  busyMode?: boolean
}

export interface OrderAvailabilitySettings {
  isOpenNow: boolean
  pauseOrders: boolean
  pauseReason?: string
}

export interface OrderDeliverySettings {
  enabled: boolean
  fee: number
  minOrder: number
  etaMin: number
  etaMax: number
}

export interface OrderPickupSettings {
  enabled: boolean
  preparationMins: number
}

export interface OrderPaymentSettings {
  cashOnDelivery: boolean
  onlinePayment: boolean
  walletEnabled: boolean
}

export interface OrderSettings {
  acceptance: OrderAcceptanceSettings
  availability: OrderAvailabilitySettings
  delivery: OrderDeliverySettings
  pickup: OrderPickupSettings
  payment: OrderPaymentSettings
}

export interface BrandColors {
  primary?: string
  secondary?: string
}

export interface ContactInfo {
  phone?: string
  whatsapp?: string
  website?: string
  email?: string
  googleMapsUrl?: string
}

export interface MenuSettings {
  disabledCategories?: string[]
  categoryOrder?: string[]
  unavailableLabel?: string
  soldOutLabel?: string
  itemsImagesEnabled?: boolean
}

export interface FulfillmentSettings {
  allowDelivery: boolean
  allowPickup: boolean
  allowDineIn: boolean
  autoCompleteAfterMinutes: number
  sendReadyNotification: boolean
}

export interface IRestaurant {
  _id?: string
  brandId?: string | null
  name: {
    ar: string
    en: string
  }
  subdomain: string
  logo: string
  coverImage: string
  description: string
  address?: string
  city?: string
  country?: string
  cuisines?: string[]
  tags?: string[]
  gallery?: string[]
  brandColors?: BrandColors
  delivery?: DeliverySettings
  orderSettings?: OrderSettings
  openingHours?: OpeningHours[]
  contact?: ContactInfo
  menuSettings?: MenuSettings
  status?: "draft" | "published" | "archived"
  featured?: boolean
  isActive?: boolean
  social?: SocialLinks
  branches: IBranch[]
  isPublished: boolean
  phones: string[]
  fulfillmentSettings?: FulfillmentSettings
  createdAt?: string
  updatedAt?: string
}
