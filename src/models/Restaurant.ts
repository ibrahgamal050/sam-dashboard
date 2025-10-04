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
    subdomain: { type: String, required: true, unique: true },
    logo: { type: String, required: true },
    coverImage: { type: String, required: true },
    description: { type: String, required: true },

    social: {
      facebook: { type: String },
      instagram: { type: String },
      tiktok: { type: String },
      twitter: { type: String },
    },
    branches: [BranchSchema],
    isPublished: { type: Boolean, default: false },
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
