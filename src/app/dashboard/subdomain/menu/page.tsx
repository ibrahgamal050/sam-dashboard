import { notFound, redirect } from "next/navigation";

import dbConnect from "@/lib/dbConnect";
import Brand from "@/models/Brand";
import Restaurant from "@/models/Restaurant";
import SuperMarket from "@/models/SuperMarket";
import { MenuEditor } from "@/components/dashboard/menu/menu-editor";

type MenuPageProps = {
  params: Promise<{
    subdomain?: string | string[];
    slug?: string | string[];
  }>;
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const normalizeBrandId = (value: unknown) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const record = value as { _id?: unknown; $oid?: unknown };
    if (record.$oid) return String(record.$oid);
    if (record._id) return String(record._id);
  }
  return String(value);
};

const isNextNavigationError = (error: unknown) => {
  if (!(error instanceof Error) || !("digest" in error)) return false;
  const digest = (error as { digest?: unknown }).digest;
  return (
    typeof digest === "string" &&
    (digest === "NEXT_NOT_FOUND" ||
      digest.startsWith("NEXT_HTTP_ERROR_FALLBACK;") ||
      digest.startsWith("NEXT_REDIRECT"))
  );
};

export default async function MenuPage({ params }: MenuPageProps) {
  const { subdomain: rawSubdomain, slug: rawSlug } = await params;
  const rawTenant = rawSubdomain ?? rawSlug;
  const subdomain = Array.isArray(rawTenant) ? rawTenant[0] : rawTenant;

  if (!subdomain) notFound();

  try {
    await dbConnect();

    const escapedSubdomain = escapeRegExp(subdomain);

    const restaurant = await Restaurant.findOne({
      $or: [
        { subdomain: { $regex: new RegExp(`^${escapedSubdomain}$`, "i") } },
        { slug: { $regex: new RegExp(`^${escapedSubdomain}$`, "i") } },
      ],
    }).lean();

    if (!restaurant) {
      const market = await SuperMarket.findOne({
        slug: { $regex: new RegExp(`^${escapedSubdomain}$`, "i") },
      }).lean();
      if (market) {
        redirect(`/dashboard/${encodeURIComponent(subdomain)}/retail`);
      }
      notFound();
    }

    const brandId = normalizeBrandId((restaurant as any).brandId);
    const brand = brandId ? await Brand.findById(brandId).lean() : null;
    const menuId = brand?._id?.toString() || (restaurant as any)._id.toString();

    return (
      <MenuEditor
        menuId={menuId}
        restaurantslug={subdomain}
        restaurantId={(restaurant as any)._id.toString()}
      />
    );
  } catch (error: unknown) {
    if (isNextNavigationError(error)) {
      throw error;
    }

    console.error("Error loading menu page:", error);
    throw new Error("Не удалось загрузить страницу меню");
  }
}
