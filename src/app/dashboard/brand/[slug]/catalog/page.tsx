import { notFound } from "next/navigation";
import Link from "next/link";
import { Boxes, Building2, GitBranch, ShoppingBag } from "lucide-react";

import dbConnect from "@/lib/dbConnect";
import Brand from "@/models/Brand";
import SuperMarket from "@/models/SuperMarket";
import CatalogProduct from "@/models/CatalogProduct";
import MerchantProduct from "@/models/MerchantProduct";
import GlobalProduct from "@/models/GlobalProduct";
import SupermarketCategories from "@/models/Category";
import RetailCatalogManager from "@/components/retail/retail-catalog-manager";
import type { CategoryNode } from "@/components/retail/retail-catalog-types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type PageProps = {
  params: Promise<{ slug: string }>;
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

const countNodes = (nodes: CategoryNode[] = []): number =>
  nodes.reduce((sum, node) => sum + 1 + countNodes(node.subCategories || []), 0);

export default async function BrandCatalogPage({ params }: PageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug || "").trim().toLowerCase();
  if (!decodedSlug) notFound();

  await dbConnect();

  const brand = await Brand.findOne({ slug: decodedSlug }).lean();
  if (!brand) notFound();

  const branches = await SuperMarket.find({ brandId: brand._id, isActive: true })
    .sort({ createdAt: 1 })
    .select({ _id: 1, slug: 1, name: 1, isActive: 1 })
    .lean();

  const primaryBranch = branches[0] || null;

  const categoriesDoc = await SupermarketCategories.findOne({
    brandId: brand._id,
    isActive: true,
  })
    .select({ categories: 1, brandId: 1 })
    .lean();

  const rawCategories: CategoryNode[] = categoriesDoc ? ((categoriesDoc as any).categories || []) : [];
  const nodeTopMap = rawCategories.length ? mapNodeToTop(rawCategories) : new Map<string, string>();
  const catalogId = categoriesDoc?._id?.toString() || null;
  const categoriesCount = countNodes(rawCategories);

  let productsRows: any[] = [];
  let merchantOptions: any[] = [];

  if (primaryBranch) {
    const [catalogProducts, merchantProductsAll] = await Promise.all([
      CatalogProduct.find({ supermarketId: primaryBranch._id })
        .sort({ order: 1, createdAt: -1 })
        .lean(),
      MerchantProduct.find({ merchantId: primaryBranch._id }).lean(),
    ]);

    const merchantProductsMap = new Map(
      merchantProductsAll.map((item) => [item._id.toString(), item])
    );

    const globalProductIds = Array.from(
      new Set(
        merchantProductsAll
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

    productsRows = catalogProducts.map((entry) => {
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

    merchantOptions = merchantProductsAll.map((merchant) => {
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
  }

  const brandName = pickLocalized((brand as any).name) || brand.slug;
  const brandDescription = pickLocalized((brand as any).description);
  const brandLogo = (brand as any)?.logo?.url || "";

  return (
    <section className="space-y-6">
      <Card className="overflow-hidden rounded-3xl border-[#d9ecff] bg-white/95 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-4 text-right">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-[#eef6ff] px-3 py-1 text-[#2f7fb2] hover:bg-[#eef6ff]">
                كاتلوج البراند
              </Badge>
              <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                أي تعديل هنا ينعكس على كل الفروع
              </Badge>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-900">{brandName}</h1>
              <p className="text-sm text-slate-500">{brand.slug}</p>
              <p className="max-w-3xl text-sm leading-7 text-slate-600">
                {brandDescription || "إدارة شجرة الكاتلوج والإضافة على مستوى البراند، مع ربط الفروع بنفس الأقسام والتصنيفات."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <GitBranch className="h-4 w-4" />
                  <span className="text-xs">الفروع المرتبطة</span>
                </div>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{branches.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Boxes className="h-4 w-4" />
                  <span className="text-xs">أقسام الكاتلوج</span>
                </div>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{categoriesCount}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <ShoppingBag className="h-4 w-4" />
                  <span className="text-xs">منتجات الفرع المرجعي</span>
                </div>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{productsRows.length}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-white shadow-sm">
                  {brandLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={brandLogo} alt={brandName} className="h-16 w-16 object-contain" />
                  ) : (
                    <Building2 className="h-8 w-8 text-slate-300" />
                  )}
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-xs text-slate-500">فرع مرجعي لعرض المنتجات الحالية</p>
                  <p className="text-base font-semibold text-slate-900">
                    {primaryBranch ? pickLocalized((primaryBranch as any).name) || primaryBranch.slug : "لا يوجد فرع مرجعي"}
                  </p>
                  {primaryBranch ? (
                    <Link
                      href={`/dashboard/supermarket/${primaryBranch.slug}`}
                      className="text-xs font-semibold text-[#2e6fe6] hover:underline"
                    >
                      فتح الفرع المرجعي
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-900">الفروع المتأثرة بهذا الكاتلوج</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {branches.length ? (
                  branches.map((branch, index) => (
                    <span
                      key={branch._id.toString()}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        index === 0 ? "bg-[#e8f2ff] text-[#1f6fb2]" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {pickLocalized((branch as any).name) || branch.slug}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">لا توجد فروع مرتبطة بهذا البراند بعد.</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        الأقسام هنا مشتركة بين كل الفروع. عند إضافة منتج، استخدم خيار <span className="font-semibold">إضافة إلى جميع فروع البراند</span> حتى يتم ربطه بكل الفروع مرة واحدة.
      </div>

      <RetailCatalogManager
        supermarket={{
          id: primaryBranch?._id?.toString?.() || String(brand._id),
          name: brandName,
          slug: brand.slug,
          isActive: true,
          brandId: brand._id.toString(),
        }}
        categorySaveUrl={`/api/retail/brands/${brand._id.toString()}/categories`}
        catalogId={catalogId}
        rows={productsRows}
        merchantOptions={merchantOptions}
        categoriesTree={rawCategories}
        layout="split"
        showWorkspaceHeader={false}
        showWorkspaceStats={false}
        appearance="brand"
      />
    </section>
  );
}
