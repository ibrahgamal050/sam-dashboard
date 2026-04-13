import mongoose, { Schema, type Document, type Model } from "mongoose";

export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  order?: number;
  isActive?: boolean;
  subCategories: CategoryNode[];
};

export interface ISupermarketCategories extends Document {
  supermarketId: mongoose.Types.ObjectId;
  isActive: boolean;
  categories: CategoryNode[];
  createdAt: Date;
  updatedAt: Date;
}

const CategoryNodeSchema = new Schema<CategoryNode>(
  {
    id: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: null, trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    subCategories: { type: [], default: [] } as any,
  },
  { _id: false }
);

CategoryNodeSchema.remove("subCategories");
CategoryNodeSchema.add({
  subCategories: { type: [CategoryNodeSchema], default: [] },
});

const SupermarketCategoriesSchema = new Schema<ISupermarketCategories>(
  {
    supermarketId: { type: Schema.Types.ObjectId, ref: "SuperMarket", required: true, unique: true },
    isActive: { type: Boolean, default: true },
    categories: { type: [CategoryNodeSchema], default: [] },
  },
  { timestamps: true }
);

SupermarketCategoriesSchema.index({ supermarketId: 1 }, { unique: true });

const SupermarketCategories: Model<ISupermarketCategories> =
  mongoose.models.SupermarketCategories ||
  mongoose.model<ISupermarketCategories>("SupermarketCategories", SupermarketCategoriesSchema);

export default SupermarketCategories;
