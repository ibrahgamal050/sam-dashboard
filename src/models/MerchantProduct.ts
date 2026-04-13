import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { LocalizedOptionalText, ProductImage } from "./GlobalProduct";

export interface IMerchantProduct extends Document {
  merchantId: mongoose.Types.ObjectId;
  globalProductId: mongoose.Types.ObjectId;
  price: number;
  offerPrice?: number;
  available: boolean;
  stock?: number;
  minQty?: number;
  maxQty?: number;
  isActive: boolean;
  customName?: LocalizedOptionalText;
  customImages?: ProductImage[];
  createdAt: Date;
  updatedAt: Date;
}

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

const MerchantProductSchema = new Schema<IMerchantProduct>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: "Merchant", required: true },
    globalProductId: { type: Schema.Types.ObjectId, ref: "GlobalProduct", required: true },
    price: { type: Number, required: true, min: 0 },
    offerPrice: { type: Number, min: 0 },
    available: { type: Boolean, default: true },
    stock: { type: Number, min: 0 },
    minQty: { type: Number, min: 1 },
    maxQty: { type: Number, min: 1 },
    isActive: { type: Boolean, default: true },
    customName: { type: LocalizedOptionalTextSchema, default: undefined },
    customImages: { type: [ProductImageSchema], default: undefined },
  },
  { timestamps: true }
);

MerchantProductSchema.index({ merchantId: 1, globalProductId: 1 }, { unique: true });
MerchantProductSchema.index({ merchantId: 1, isActive: 1 });

const MerchantProduct: Model<IMerchantProduct> =
  mongoose.models.MerchantProduct || mongoose.model<IMerchantProduct>("MerchantProduct", MerchantProductSchema);

export default MerchantProduct;
