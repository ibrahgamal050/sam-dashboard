import mongoose, { Schema, type Document, type Model } from "mongoose";

type LocalizedString = {
  ar?: string;
  en?: string;
};

type MediaItem = {
  url: string;
  alt?: LocalizedString;
};

type Menu = {
  images?: MediaItem[];
  externalUrl?: string | null;
  updatedAt?: Date | null;
};

type Stats = {
  ratingAvg?: number;
  reviewCount?: number;
  branchCount?: number;
};

export interface IBrand extends Document {
  name: LocalizedString;
  slug: string;
  category: "food" | "shopping" | "museum" | "park" | "city" | "beach" | "mountain" | "desert";
  description?: LocalizedString;
  logo?: MediaItem;
  cover?: MediaItem;
  menu?: Menu;
  tags: string[];
  contacts?: {
    phone?: string;
    whatsapp?: string;
    email?: string;
    website?: string;
  };
  social?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    googleMapsUrl?: string;
  };
  stats?: Stats;
  isFeatured: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LocalizedStringSchema = new Schema<LocalizedString>(
  {
    ar: { type: String, trim: true },
    en: { type: String, trim: true },
  },
  { _id: false }
);

const MediaItemSchema = new Schema<MediaItem>(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: LocalizedStringSchema, default: () => ({}) },
  },
  { _id: false }
);

const MenuSchema = new Schema<Menu>(
  {
    images: { type: [MediaItemSchema], default: [] },
    externalUrl: { type: String, default: null, trim: true },
    updatedAt: { type: Date, default: null },
  },
  { _id: false }
);

const StatsSchema = new Schema<Stats>(
  {
    ratingAvg: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, min: 0, default: 0 },
    branchCount: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const BrandSchema = new Schema<IBrand>(
  {
    name: { type: LocalizedStringSchema, required: true },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["food", "shopping", "museum", "park", "city", "beach", "mountain", "desert"],
      required: true,
      index: true,
    },
    description: { type: LocalizedStringSchema, default: () => ({}) },
    logo: { type: MediaItemSchema, default: undefined },
    cover: { type: MediaItemSchema, default: undefined },
    menu: { type: MenuSchema, default: undefined },
    tags: {
      type: [String],
      default: [],
      set: (arr: string[]) => (arr || []).map((t) => String(t).trim()).filter(Boolean),
    },
    contacts: {
      phone: { type: String, trim: true },
      whatsapp: { type: String, trim: true },
      email: { type: String, trim: true },
      website: { type: String, trim: true },
    },
    social: {
      facebook: { type: String, trim: true },
      instagram: { type: String, trim: true },
      tiktok: { type: String, trim: true },
      googleMapsUrl: { type: String, trim: true },
    },
    stats: { type: StatsSchema, default: () => ({}) },
    isFeatured: { type: Boolean, default: false, index: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

BrandSchema.index({ category: 1, isFeatured: -1, active: 1 });

const Brand: Model<IBrand> =
  mongoose.models.Brand || mongoose.model<IBrand>("Brand", BrandSchema);

export default Brand;
