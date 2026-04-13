import { NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import SuperMarket from "@/models/SuperMarket";

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = (url.searchParams.get("key") || "").trim();

  if (!key) {
    return NextResponse.json({ error: "Missing key." }, { status: 400 });
  }

  await dbConnect();

  const normalized = key.toLowerCase();

  const bySlug = await SuperMarket.findOne({ slug: normalized }).lean();
  if (bySlug) {
    return NextResponse.json({ slug: bySlug.slug });
  }

  const byName = await SuperMarket.findOne({
    name: { $regex: new RegExp(`^${escapeRegExp(key)}$`, "i") },
  }).lean();

  if (byName) {
    return NextResponse.json({ slug: byName.slug });
  }

  return NextResponse.json({ error: "Supermarket not found." }, { status: 404 });
}
