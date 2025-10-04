import type { Types } from "mongoose"

export interface ISize {
  _id?: Types.ObjectId
  name: {
    en: string
    ar: string
  }
  price?: number
}

export interface IMenuImage {
  _id?: Types.ObjectId
  url: string
  altText: string
  createdAt?: Date
}

export interface IMenuItem {
  _id?: Types.ObjectId
  name: {
    en?: string
    ar?: string
  }
  description?: {
    en?: string
    ar?: string
  }
  price?: number
  image?: string
  sizes?: ISize[]
  weight?: string
  quantity?: number
  isNew?: boolean 
}

export interface ICategory {
  _id?: Types.ObjectId
  name: {
    en: string
    ar: string
  }
  description?: {
    en?: string
    ar?: string
  }
  image?: string
  menuItems: IMenuItem[]
  createdAt?: Date
  updatedAt?: Date
}

export interface IMenu {
  _id?: Types.ObjectId
  restaurantId: Types.ObjectId
  name: string
  currency: {
    en?: string
    ar?: string
  }
  categories: ICategory[]
  menuImages: IMenuImage[]
  createdAt?: Date
  updatedAt?: Date
}

// Add this type for category refs
export type CategoryRef = HTMLElement | null
