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

export type GlobalProductUnit = "piece" | "kg" | "liter" | "pack";
export type GlobalProductStatus = "active" | "archived";
export type GlobalProductCreator = "system" | "merchant" | "ai";

export interface IGlobalProduct extends Document {
  name: LocalizedText;
  slug: string;
  barcode?: string;
  brand?: string;
  category: string;
  subCategory?: string;
  images: ProductImage[];
  unit: GlobalProductUnit;
  baseSize?: string;
  tags?: string[];
  status: GlobalProductStatus;
  createdBy: GlobalProductCreator;
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

const GlobalProductSchema = new Schema<IGlobalProduct>(
  {
    name: { type: LocalizedTextSchema, required: true },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    barcode: { type: String, trim: true },
    brand: { type: String, trim: true },
    category: { type: String, required: true, trim: true },
    subCategory: { type: String, trim: true },
    images: { type: [ProductImageSchema], default: [] },
    unit: { type: String, enum: ["piece", "kg", "liter", "pack"], required: true },
    baseSize: { type: String, trim: true },
    tags: {
      type: [String],
      default: [],
      set: (arr: string[]) => (arr || []).map((tag) => String(tag).trim().toLowerCase()).filter(Boolean),
    },
    status: { type: String, enum: ["active", "archived"], default: "active" },
    createdBy: { type: String, enum: ["system", "merchant", "ai"], default: "system" },
  },
  { timestamps: true }
);

// slug already unique via schema field definition
GlobalProductSchema.index({ barcode: 1 }, { unique: true, sparse: true });
GlobalProductSchema.index({ "name.ar": "text", "name.en": "text", brand: "text" });

const GlobalProduct: Model<IGlobalProduct> =
  mongoose.models.GlobalProduct || mongoose.model<IGlobalProduct>("GlobalProduct", GlobalProductSchema);

export default GlobalProduct;
