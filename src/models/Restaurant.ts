import mongoose, { Schema, type Document } from "mongoose"

import type { IRestaurant } from "@/types/restaurant"

const FulfillmentSettingsSchema = new Schema(
  {
    allowDelivery: { type: Boolean, default: true },
    allowPickup: { type: Boolean, default: true },
    allowDineIn: { type: Boolean, default: true },
    autoCompleteAfterMinutes: { type: Number, default: 0, min: 0, max: 240 },
    sendReadyNotification: { type: Boolean, default: true },
  },
  { _id: false },
)

const OrderSettingsSchema = new Schema(
  {
    acceptance: {
      mode: { type: String, enum: ["auto", "manual"], default: "auto" },
      autoCancelAfterMins: { type: Number, min: 0, default: 2 },
      busyMode: { type: Boolean, default: false },
    },
    availability: {
      isOpenNow: { type: Boolean, default: true },
      pauseOrders: { type: Boolean, default: false },
      pauseReason: { type: String, trim: true },
    },
    delivery: {
      enabled: { type: Boolean, default: true },
      fee: { type: Number, min: 0, default: 0 },
      minOrder: { type: Number, min: 0, default: 0 },
      etaMin: { type: Number, min: 0, default: 0 },
      etaMax: { type: Number, min: 0, default: 0 },
    },
    pickup: {
      enabled: { type: Boolean, default: true },
      preparationMins: { type: Number, min: 0, default: 0 },
    },
    payment: {
      cashOnDelivery: { type: Boolean, default: true },
      onlinePayment: { type: Boolean, default: false },
      walletEnabled: { type: Boolean, default: true },
    },
  },
  { _id: false },
)

const BranchSchema = new Schema(
  {
    name: {
      ar: { type: String, required: true },
      en: { type: String, required: true },
    },
    location: {
      address: {
        ar: { type: String, required: true },
        en: { type: String, required: true },
      },
      latitude: { type: Number },
      longitude: { type: Number },
    },
    phone: { type: String },
    workingHours: { type: String },
    isMainBranch: { type: Boolean, default: false },
  },
  { timestamps: true },
)

const RestaurantSchema: Schema = new Schema(
  {
    name: {
      ar: { type: String, required: true },
      en: { type: String, required: true },
    },
    brandId: { type: Schema.Types.ObjectId, ref: "Brand", index: true, default: null },
    subdomain: { type: String, required: true, unique: true },
    logo: { type: String, required: true },
    coverImage: { type: String, required: true },
    description: { type: String, required: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    cuisines: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    gallery: { type: [String], default: [] },
    brandColors: {
      primary: { type: String, trim: true },
      secondary: { type: String, trim: true },
    },
    delivery: {
      etaMin: { type: Number, min: 0 },
      etaMax: { type: Number, min: 0 },
      fee: { type: Number, min: 0 },
      minOrder: { type: Number, min: 0 },
      enabled: { type: Boolean, default: true },
    },
    openingHours: {
      type: [
        {
          day: { type: Number, min: 0, max: 6, required: true },
          open: { type: String, required: true },
          close: { type: String, required: true },
          isClosed: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
    contact: {
      phone: { type: String, trim: true },
      whatsapp: { type: String, trim: true },
      website: { type: String, trim: true },
      email: { type: String, trim: true },
      googleMapsUrl: { type: String, trim: true },
    },

    social: {
      facebook: { type: String },
      instagram: { type: String },
      tiktok: { type: String },
      twitter: { type: String },
    },
    menuSettings: {
      disabledCategories: { type: [String], default: [] },
      categoryOrder: { type: [String], default: [] },
      unavailableLabel: { type: String, trim: true },
      soldOutLabel: { type: String, trim: true },
      itemsImagesEnabled: { type: Boolean, default: true },
    },
    orderSettings: {
      type: OrderSettingsSchema,
      default: () => ({}),
    },
    branches: [BranchSchema],
    isPublished: { type: Boolean, default: false },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    featured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    phones: [{ type: String, required: true }],
    fulfillmentSettings: {
      type: FulfillmentSettingsSchema,
      default: () => ({}),
    },
  },
  { timestamps: true },
)

RestaurantSchema.index({ name: "text", description: "text" })

RestaurantSchema.methods.getPageMeta = function (pageSlug: string) {
  if (!this.pages) return null
  return this.pages.find((page: any) => page.slug === pageSlug)
}

export default mongoose.models.Restaurant || mongoose.model<IRestaurant & Document>("Restaurant", RestaurantSchema)
