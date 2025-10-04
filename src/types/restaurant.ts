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

export interface FulfillmentSettings {
  allowDelivery: boolean
  allowPickup: boolean
  allowDineIn: boolean
  autoCompleteAfterMinutes: number
  sendReadyNotification: boolean
}

export interface IRestaurant {
  _id?: string
  name: {
    ar: string
    en: string
  }
  subdomain: string
  logo: string
  coverImage: string
  description: string
  social?: SocialLinks
  branches: IBranch[]
  isPublished: boolean
  phones: string[]
  fulfillmentSettings?: FulfillmentSettings
  createdAt?: string
  updatedAt?: string
}
