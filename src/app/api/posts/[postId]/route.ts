import { NextResponse } from "next/server"
import mongoose from "mongoose"
import dbConnect from '@/lib/dbConnect'
import Post from "@/models/post"
import { z } from "zod"

const IdSchema = z.object({ postId: z.string().refine((v)=>mongoose.Types.ObjectId.isValid(v),"Invalid id") })

export async function GET(
  _: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const resolvedParams = await params
    const { postId } = IdSchema.parse(resolvedParams)
    await dbConnect()
    const doc = await Post.findById(postId).lean()
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(doc)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const resolvedParams = await params
    const { postId } = IdSchema.parse(resolvedParams)
    const body = await req.json()
    await dbConnect()
    const updated = await Post.findByIdAndUpdate(postId, body, { new: true, runValidators: false })
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ id: String(updated._id) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
