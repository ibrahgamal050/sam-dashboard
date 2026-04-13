export type SectionItem = { id: string; title: string };

export type CatalogSection = {
  id: string;
  title: string;
  items: SectionItem[];
};

export type MerchantOption = {
  id: string;
  name: string;
  globalProductId?: string;
  price?: number | null;
  image?: string;
  available: boolean;
  isActive: boolean;
  stock?: number | null;
};

export type CatalogRow = {
  id: string;
  merchantProductId: string;
  sectionId: string;
  itemId: string;
  nodeId: string;
  order: number;
  name: string;
  price?: number | null;
  available: boolean;
  productActive: boolean;
  catalogActive: boolean;
  stock?: number | null;
  image?: string;
};

export type CategoryNode = {
  id: string;
  name: string;
  slug?: string;
  imageUrl?: string | null;
  order?: number;
  isActive?: boolean;
  subCategories?: CategoryNode[];
};

export type StatusKey = "published" | "draft" | "inactive" | "stockout";

export type EditForm = {
  name: string;
  category: string;
  size: string;
  stock: string;
  price: string;
  supplierName: string;
  supplierLocation: string;
  status: StatusKey;
};
