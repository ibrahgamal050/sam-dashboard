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

export interface IRestaurantMenuItem extends Document {
  restaurantId: mongoose.Types.ObjectId;
  menuType?: "delivery" | "dinein" | "takeaway";
  brandMenuItemId?: mongoose.Types.ObjectId | null;
  name?: LocalizedText;
  description?: LocalizedOptionalText;
  images?: ProductImage[];
  category?: string;
  price?: number;
  oldPrice?: number;
  weight?: string;
  tags?: string[];
  badges?: MenuItemBadge[];
  sizes?: MenuItemOption[];
  addOns?: MenuItemOption[];
  order?: number;
  isHidden?: boolean;
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

const requiredIfNoBrand = function (this: { brandMenuItemId?: mongoose.Types.ObjectId | null }) {
  return !this.brandMenuItemId;
};

const RestaurantMenuItemSchema = new Schema<IRestaurantMenuItem>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    menuType: {
      type: String,
      enum: ["delivery", "dinein", "takeaway"],
      default: "delivery",
      index: true,
    },
    brandMenuItemId: {
      type: Schema.Types.ObjectId,
      ref: "BrandMenuItem",
      default: null,
      index: true,
    },
    name: { type: LocalizedTextSchema, required: requiredIfNoBrand },
    description: { type: LocalizedOptionalTextSchema, default: undefined },
    images: { type: [ProductImageSchema], default: [] },
    category: { type: String, required: requiredIfNoBrand, trim: true, index: true },
    price: { type: Number, required: requiredIfNoBrand, min: 0 },
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
    isHidden: { type: Boolean, default: false, index: true },
    isAvailable: { type: Boolean, default: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

RestaurantMenuItemSchema.index({ restaurantId: 1, menuType: 1, category: 1, isActive: 1, order: 1 });
RestaurantMenuItemSchema.index(
  { restaurantId: 1, brandMenuItemId: 1, menuType: 1 },
  { unique: true, sparse: true }
);

const existingModel = mongoose.models.RestaurantMenuItem as Model<IRestaurantMenuItem> | undefined
if (existingModel && (!existingModel.schema.path("menuType") || !existingModel.schema.path("isHidden"))) {
  delete mongoose.models.RestaurantMenuItem
}

const RestaurantMenuItem: Model<IRestaurantMenuItem> =
  mongoose.models.RestaurantMenuItem ||
  mongoose.model<IRestaurantMenuItem>("RestaurantMenuItem", RestaurantMenuItemSchema);

export default RestaurantMenuItem;
