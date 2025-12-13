import { NextResponse } from "next/server"
import mongoose from "mongoose"
import dbConnect from '@/lib/dbConnect'
import Post from "@/models/post"
import { z } from "zod"

const BlockSchema = z.object({
  id: z.string(),
  type: z.enum(["text","image","button","video","quote","gallery","menuSection"]),
  heading: z.string().optional(),
  text: z.string().optional(),
  image: z.string().optional(),
  videoUrl: z.string().optional(),
  quote: z.object({ text: z.string(), author: z.string().optional() }).optional(),
  button: z.object({
    label: z.string(),
    url: z.string(),
    style: z.enum(["primary","secondary"]).optional()
  }).optional(),
  gallery: z.array(z.string()).optional(),
  menuSection: z.object({
    title: z.string().optional(),
    sectionId: z.string().optional(),
    itemsLimit: z.number().optional(),
  }).optional(),
  order: z.number().optional()
})

const BodySchema = z.object({
  restaurantId: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  image: z.string().optional(),
  layoutType: z.enum(["classic","split","cards","minimal"]).optional(),
  content: z.array(BlockSchema).default([]),
  menuPageUrl: z.string().optional(),
  seo: z.object({
    title: z.string(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    slug: z.string()
  }).optional()
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = BodySchema.parse(body)

    await dbConnect()
    const doc = await Post.create({
      ...parsed,
      restaurantId: new mongoose.Types.ObjectId(parsed.restaurantId)
    })

    return NextResponse.json({ id: String(doc._id) }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Invalid body" }, { status: 400 })
  }
}
