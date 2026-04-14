import mongoose, { Schema, type Document, type Model } from "mongoose";

export type MarketType = "supermarket" | "pharmacy" | "bakery" | "dark_store";

export interface ISuperMarket extends Document {
  brandId?: mongoose.Types.ObjectId;
  name: string;
  nameAr?: string;
  nameEn?: string;
  slug: string;
  brandType: MarketType;
  logoUrl?: string;
  coverImage?: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  cuisines?: string[];
  tags?: string[];
  gallery?: string[];
  brandColors?: { primary?: string; secondary?: string };
  delivery?: { etaMin?: number; etaMax?: number; fee?: number; minOrder?: number; enabled?: boolean };
  orderSettings?: {
    acceptance?: { mode?: "auto" | "manual"; autoCancelAfterMins?: number; busyMode?: boolean };
    availability?: { isOpenNow?: boolean; pauseOrders?: boolean; pauseReason?: string };
    delivery?: { enabled?: boolean; fee?: number; minOrder?: number; etaMin?: number; etaMax?: number };
    pickup?: { enabled?: boolean; preparationMins?: number };
    payment?: { cashOnDelivery?: boolean; onlinePayment?: boolean; walletEnabled?: boolean };
  };
  openingHours?: Array<{ day: number; open: string; close: string; isClosed?: boolean }>;
  contact?: { phone?: string; whatsapp?: string; website?: string; email?: string; googleMapsUrl?: string };
  social?: { facebook?: string; instagram?: string; tiktok?: string; twitter?: string };
  menuSettings?: {
    disabledCategories?: string[];
    categoryOrder?: string[];
    unavailableLabel?: string;
    soldOutLabel?: string;
    itemsImagesEnabled?: boolean;
  };
  status?: "draft" | "published" | "archived";
  featured?: boolean;
  isActive: boolean;
  defaultCommissionRate: number;
  createdAt: Date;
  updatedAt: Date;
}

const SuperMarketSchema = new Schema<ISuperMarket>(
  {
    brandId: {
  type: Schema.Types.ObjectId,
  ref: "Brand",
  index: true
},
    name: { type: String, required: true, trim: true },
    nameAr: { type: String, trim: true },
    nameEn: { type: String, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true, unique: true },
    brandType: {
      type: String,
      enum: ["supermarket", "pharmacy", "bakery", "dark_store"],
      required: true,
    },
    logoUrl: { type: String, trim: true },
    coverImage: { type: String, trim: true },
    description: { type: String, trim: true },
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
    orderSettings: {
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
      facebook: { type: String, trim: true },
      instagram: { type: String, trim: true },
      tiktok: { type: String, trim: true },
      twitter: { type: String, trim: true },
    },
    menuSettings: {
      disabledCategories: { type: [String], default: [] },
      categoryOrder: { type: [String], default: [] },
      unavailableLabel: { type: String, trim: true },
      soldOutLabel: { type: String, trim: true },
      itemsImagesEnabled: { type: Boolean, default: true },
    },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    featured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    defaultCommissionRate: { type: Number, default: 0.12, min: 0, max: 0.5 },
  },
  { timestamps: true }
);

// slug already unique via schema field definition

const SuperMarket: Model<ISuperMarket> =
  mongoose.models.SuperMarket || mongoose.model<ISuperMarket>("SuperMarket", SuperMarketSchema);

export default SuperMarket;
