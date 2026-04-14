import { notFound } from "next/navigation";

import dbConnect from "@/lib/dbConnect";
import SuperMarket from "@/models/SuperMarket";
import CatalogProduct from "@/models/CatalogProduct";
import MerchantProduct from "@/models/MerchantProduct";
import GlobalProduct from "@/models/GlobalProduct";
import SupermarketCategories from "@/models/Category";
import RetailCatalogManager from "@/components/retail/retail-catalog-manager";
import RetailSidebarSheet from "@/components/retail/retail-sidebar-sheet";
import type { CategoryNode } from "@/components/retail/retail-catalog-types";

type RetailPageProps = {
  params: Promise<{ subdomain: string }>;
};

type Localized = { ar?: string; en?: string } | null | undefined;

const pickLocalized = (value: Localized) => value?.ar || value?.en || "";

const sortNodes = (nodes: CategoryNode[]) =>
  nodes.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

const mapNodeToTop = (nodes: CategoryNode[], topId?: string, acc = new Map<string, string>()) => {
  sortNodes(nodes).forEach((node) => {
    const currentTop = topId || node.id;
    acc.set(node.id, currentTop);
    if (node.subCategories?.length) {
      mapNodeToTop(node.subCategories, currentTop, acc);
    }
  });
  return acc;
};

export default async function RetailDashboardPage({ params }: RetailPageProps) {
  const { subdomain } = await params;
  const decodedSlug = decodeURIComponent(subdomain || "").toLowerCase();
  if (!decodedSlug) notFound();

  await dbConnect();

  const supermarket = await SuperMarket.findOne({ slug: decodedSlug }).lean();
  if (!supermarket) notFound();
  const supermarketName = pickLocalized(supermarket.name as Localized) || supermarket.slug;

  const catalogProducts = await CatalogProduct.find({
    supermarketId: supermarket._id,
  })
    .sort({ order: 1, createdAt: -1 })
    .lean();

  const merchantProductIds = Array.from(
    new Set(catalogProducts.map((item) => item.merchantProductId?.toString()).filter(Boolean))
  );

  const merchantProductsFromCatalog = merchantProductIds.length
    ? await MerchantProduct.find({ _id: { $in: merchantProductIds } }).lean()
    : [];

  const merchantProductsAll = await MerchantProduct.find({
    merchantId: supermarket._id,
  }).lean();

  const merchantProductMap = new Map<string, typeof merchantProductsAll[number]>();
  merchantProductsAll.forEach((item) => merchantProductMap.set(item._id.toString(), item));
  merchantProductsFromCatalog.forEach((item) => merchantProductMap.set(item._id.toString(), item));
  const merchantProducts = Array.from(merchantProductMap.values());

  const merchantProductsMap = new Map(
    merchantProducts.map((item) => [item._id.toString(), item])
  );

  const globalProductIds = Array.from(
    new Set(
      merchantProducts
        .map((item) => item.globalProductId?.toString())
        .filter(Boolean)
    )
  );

  const globalProducts = globalProductIds.length
    ? await GlobalProduct.find({ _id: { $in: globalProductIds } }).lean()
    : [];

  const globalProductsMap = new Map(
    globalProducts.map((item) => [item._id.toString(), item])
  );

  const categoriesDoc = await SupermarketCategories.findOne({
    supermarketId: supermarket._id,
    isActive: true,
  })
    .select({ categories: 1 })
    .lean();

  const rawCategories: CategoryNode[] = categoriesDoc ? ((categoriesDoc as any).categories || []) : [];
  const nodeTopMap = rawCategories.length ? mapNodeToTop(rawCategories) : new Map<string, string>();
  const catalogId = categoriesDoc?._id?.toString() || null;

  const productsRows = catalogProducts.map((entry) => {
    const merchantProduct = merchantProductsMap.get(entry.merchantProductId.toString());
    const globalProduct = merchantProduct
      ? globalProductsMap.get(merchantProduct.globalProductId.toString())
      : null;
    const name =
      pickLocalized(merchantProduct?.customName) ||
      pickLocalized(globalProduct?.name) ||
      "منتج بدون اسم";
    const image =
      merchantProduct?.customImages?.[0]?.url ||
      globalProduct?.images?.[0]?.url ||
      "";
    const nodeId = entry.nodeId?.toString?.() || entry.nodeId;
    const mappedSectionId = nodeTopMap.get(nodeId) || entry.sectionId;
    return {
      id: entry._id.toString(),
      name,
      price: merchantProduct?.offerPrice ?? merchantProduct?.price ?? null,
      available: merchantProduct?.available ?? false,
      productActive: merchantProduct?.isActive ?? false,
      catalogActive: entry.isActive ?? true,
      stock: merchantProduct?.stock ?? null,
      image,
      merchantProductId: entry.merchantProductId.toString(),
      sectionId: mappedSectionId,
      itemId: nodeId || entry.itemId,
      nodeId: nodeId || entry.nodeId,
      order: entry.order ?? 0,
    };
  });

  const merchantOptions = merchantProducts.map((merchant) => {
    const global = merchant.globalProductId
      ? globalProductsMap.get(merchant.globalProductId.toString())
      : null;
    const name =
      pickLocalized(merchant.customName) ||
      pickLocalized(global?.name) ||
      "منتج بدون اسم";
    const image =
      merchant.customImages?.[0]?.url || global?.images?.[0]?.url || "";
    return {
      id: merchant._id.toString(),
      globalProductId: merchant.globalProductId?.toString(),
      name,
      price: merchant.offerPrice ?? merchant.price ?? null,
      image,
      available: merchant.available ?? true,
      isActive: merchant.isActive ?? true,
      stock: merchant.stock ?? null,
    };
  });

  return (
  

        <main className="flex-1 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white px-5 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
            <div className="flex flex-1 items-center gap-3">
              <RetailSidebarSheet name={supermarketName} slug={supermarket.slug} />
              <div className="flex flex-1 items-center gap-2 rounded-2xl bg-slate-50 px-4 py-2 text-sm text-slate-500">
                <span className="text-slate-400">🔍</span>
                ابحث عن منتج أو طلب...
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <button className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-slate-600">
                مسح باركود
              </button>
              <button className="rounded-2xl bg-[#2e6fe6] px-4 py-2 text-white">
                إنشاء فاتورة
              </button>
            </div>
          </div>

          <RetailCatalogManager
            supermarket={{
              id: supermarket._id.toString(),
              name: supermarketName,
              slug: supermarket.slug,
              isActive: supermarket.isActive,
            }}
            catalogId={catalogId}
            rows={productsRows}
            merchantOptions={merchantOptions}
            categoriesTree={rawCategories}
            layout="split"
          />
        </main>
    
  );
}
