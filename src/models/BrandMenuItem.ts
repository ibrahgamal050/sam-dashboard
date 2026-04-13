import mongoose, { Schema, type Document, type Model } from "mongoose";

export type LocalizedText = {
  ar: string;
  en?: string;
};

export type LocalizedOptionalText = {
  ar?: string;
  en?: string;
};

export type ProductImage = {
  url: string;
  alt?: LocalizedOptionalText;
};

export type MenuItemBadge = {
  label: string;
  tone?: string;
};

export type MenuItemOption = {
  label: string;
  price?: number;
};

export interface IBrandMenuItem extends Document {
  brandId: mongoose.Types.ObjectId;
  name: LocalizedText;
  description?: LocalizedOptionalText;
  images: ProductImage[];
  category: string;
  price: number;
  oldPrice?: number;
  weight?: string;
  tags: string[];
  badges?: MenuItemBadge[];
  sizes?: MenuItemOption[];
  addOns?: MenuItemOption[];
  order: number;
  isAvailable: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LocalizedTextSchema = new Schema<LocalizedText>(
  {
    ar: { type: String, required: true, trim: true },
    en: { type: String, trim: true },
  },
  { _id: false }
);

const LocalizedOptionalTextSchema = new Schema<LocalizedOptionalText>(
  {
    ar: { type: String, trim: true },
    en: { type: String, trim: true },
  },
  { _id: false }
);

const ProductImageSchema = new Schema<ProductImage>(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: LocalizedOptionalTextSchema, default: undefined },
  },
  { _id: false }
);

const MenuItemBadgeSchema = new Schema<MenuItemBadge>(
  {
    label: { type: String, required: true, trim: true },
    tone: { type: String, trim: true },
  },
  { _id: false }
);

const MenuItemOptionSchema = new Schema<MenuItemOption>(
  {
    label: { type: String, required: true, trim: true },
    price: { type: Number, min: 0 },
  },
  { _id: false }
);

const BrandMenuItemSchema = new Schema<IBrandMenuItem>(
  {
    brandId: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
      index: true,
    },
    name: { type: LocalizedTextSchema, required: true },
    description: { type: LocalizedOptionalTextSchema, default: undefined },
    images: { type: [ProductImageSchema], default: [] },
    category: { type: String, required: true, trim: true, index: true },
    price: { type: Number, required: true, min: 0 },
    oldPrice: { type: Number, min: 0 },
    weight: { type: String, trim: true },
    tags: {
      type: [String],
      default: [],
      set: (arr: string[]) => (arr || []).map((item) => String(item).trim().toLowerCase()).filter(Boolean),
    },
    badges: { type: [MenuItemBadgeSchema], default: [] },
    sizes: { type: [MenuItemOptionSchema], default: [] },
    addOns: { type: [MenuItemOptionSchema], default: [] },
    order: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

BrandMenuItemSchema.index({ brandId: 1, category: 1, isActive: 1, order: 1 });
BrandMenuItemSchema.index({ brandId: 1, isActive: 1 });

const BrandMenuItem: Model<IBrandMenuItem> =
  mongoose.models.BrandMenuItem ||
  mongoose.model<IBrandMenuItem>("BrandMenuItem", BrandMenuItemSchema);

export default BrandMenuItem;
