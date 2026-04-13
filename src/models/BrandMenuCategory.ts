import mongoose, { Schema, type Document, type Model } from "mongoose";

export type LocalizedText = {
  ar: string;
  en?: string;
};

export interface IBrandMenuCategory extends Document {
  brandId: mongoose.Types.ObjectId;
  name: LocalizedText;
  order: number;
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

const BrandMenuCategorySchema = new Schema<IBrandMenuCategory>(
  {
    brandId: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
      index: true,
    },
    name: { type: LocalizedTextSchema, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

BrandMenuCategorySchema.index({ brandId: 1, "name.ar": 1 }, { unique: true, sparse: true });

const BrandMenuCategory: Model<IBrandMenuCategory> =
  mongoose.models.BrandMenuCategory ||
  mongoose.model<IBrandMenuCategory>("BrandMenuCategory", BrandMenuCategorySchema);

export default BrandMenuCategory;
