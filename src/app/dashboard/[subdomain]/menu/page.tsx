import { notFound, redirect } from "next/navigation";

import dbConnect from "@/lib/dbConnect";
import Brand from "@/models/Brand";
import Restaurant from "@/models/Restaurant";
import SuperMarket from "@/models/SuperMarket";
import { MenuEditor } from "@/components/dashboard/menu/menu-editor";

type MenuPageProps = {
  params: Promise<{
    subdomain?: string | string[];
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

export default async function MenuPage({ params }: MenuPageProps) {
  const { subdomain: rawSubdomain } = await params;
  const subdomain = Array.isArray(rawSubdomain) ? rawSubdomain[0] : rawSubdomain;

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
    if (!brandId) {
      notFound();
    }

    const brand = await Brand.findById(brandId).lean();
    if (!brand) {
      notFound();
    }

    return (
      <MenuEditor
        menuId={brand._id.toString()}
        restaurantslug={subdomain}
        restaurantId={(restaurant as any)._id.toString()}
      />
    );
  } catch (error: unknown) {
    // نفس handling بتاعك
    if (
      error instanceof Error &&
      "digest" in error &&
      typeof (error as { digest?: string }).digest === "string" &&
      (error as { digest?: string }).digest === "NEXT_NOT_FOUND"
    ) {
      throw error;
    }

    console.error("Error loading menu page:", error);
    throw new Error("Failed to load menu page");
  }
}
