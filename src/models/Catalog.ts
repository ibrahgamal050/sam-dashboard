import mongoose, { Schema, type Document, type Model } from "mongoose";

export type CatalogItem = {
  id: string;
  title: string;
  image: string;
  order: number;
};

export type CatalogSection = {
  id: string;
  title: string;
  order: number;
  items: CatalogItem[];
  isActive?: boolean;
};

export interface ICatalog extends Document {
  supermarketId: mongoose.Types.ObjectId;
  isActive: boolean;
  sections: CatalogSection[];
  createdAt: Date;
  updatedAt: Date;
}

const CatalogItemSchema = new Schema<CatalogItem>(
  {
    id: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const CatalogSectionSchema = new Schema<CatalogSection>(
  {
    id: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    items: { type: [CatalogItemSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const CatalogSchema = new Schema<ICatalog>(
  {
    supermarketId: { type: Schema.Types.ObjectId, ref: "SuperMarket", required: true, unique: true },
    isActive: { type: Boolean, default: true },
    sections: { type: [CatalogSectionSchema], default: [] },
  },
  { timestamps: true }
);

CatalogSchema.index({ supermarketId: 1 }, { unique: true });
CatalogSchema.index({ isActive: 1 });

const Catalog: Model<ICatalog> = mongoose.models.Catalog || mongoose.model<ICatalog>("Catalog", CatalogSchema);

export default Catalog;
