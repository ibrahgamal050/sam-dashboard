import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ICatalogProduct extends Document {
  supermarketId: mongoose.Types.ObjectId;
  catalogId: mongoose.Types.ObjectId;
  sectionId: string;
  itemId: string;
  nodeId: string;
  merchantProductId: mongoose.Types.ObjectId;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CatalogProductSchema = new Schema<ICatalogProduct>(
  {
    supermarketId: { type: Schema.Types.ObjectId, ref: "SuperMarket", required: true },
    catalogId: { type: Schema.Types.ObjectId, ref: "SupermarketCategories", required: true },
    sectionId: { type: String, required: true, trim: true },
    itemId: { type: String, required: true, trim: true },
    nodeId: { type: String, required: true, trim: true },
    merchantProductId: { type: Schema.Types.ObjectId, ref: "MerchantProduct", required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CatalogProductSchema.index(
  { catalogId: 1, sectionId: 1, itemId: 1, merchantProductId: 1 },
  { unique: true }
);
CatalogProductSchema.index({ supermarketId: 1, catalogId: 1, sectionId: 1, itemId: 1, isActive: 1, order: 1 });

const CatalogProduct: Model<ICatalogProduct> =
  mongoose.models.CatalogProduct || mongoose.model<ICatalogProduct>("CatalogProduct", CatalogProductSchema);

export default CatalogProduct;
