import mongoose, { Schema, type Document } from "mongoose"
import type { Types } from "mongoose"

/* --- أنواع البلوكات داخل content --- */
export type BlockType =
  | "text"
  | "image"
  | "button"
  | "video"
  | "quote"
  | "gallery"
  | "menuSection" // 👈 لعرض جزء من المنيو داخل المقال

export interface IBlock {
  id: string
  type: BlockType
  heading?: string
  text?: string
  image?: string
  videoUrl?: string
  quote?: {
    text: string
    author?: string
  }
  button?: {
    label: string
    url: string
    style?: "primary" | "secondary"
  }
  gallery?: string[]
  menuSection?: {
    sectionId: string // مثلاً "shawarma"
    title?: string    // ممكن تضيف عنوان مخصص يظهر بدل اسم القسم
    limit?: number    // عدد العناصر المعروضة من القسم
  }
  order?: number
}

/* --- بيانات السيو --- */
export interface ISEO {
  title: string
  description?: string
  keywords?: string[]
  slug: string
}

/* --- موديل المقال (Post) --- */
export interface IPost extends Document {
  restaurantId: Types.ObjectId
  title: string
  subtitle?: string
  description?: string
  coverImage?: string
  year?: number
  content?: IBlock[] // 👈 المكون الأساسي للمقال
  menuPageUrl?: string
  seo?: ISEO
  image: string
  layoutType?: "classic" | "split" | "cards" | "minimal"
  createdAt: Date
  updatedAt: Date
}

/* --- سكيمات فرعية --- */
const BlockSchema = new Schema<IBlock>(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ["text", "image", "button", "video", "quote", "gallery", "menuSection"],
      required: true
    },
    heading: String,
    text: String,
    image: String,
    videoUrl: String,
    quote: {
      text: String,
      author: String
    },
    button: {
      label: String,
      url: String,
      style: { type: String, enum: ["primary", "secondary"], default: "primary" }
    },
    gallery: [String],
    menuSection: {
      sectionId: String,
      title: String,
      limit: Number
    },
    order: { type: Number, default: 0 }
  },
  { _id: false }
)

const PostSchema = new Schema<IPost>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    title: { type: String, required: true },
    subtitle: String,
    description: String,
    coverImage: String,
    year: Number,
    content: [BlockSchema],
    menuPageUrl: String,
    seo: {
      title: { type: String },
      description: String,
      keywords: [String],
      slug: String
    },
    image: { type: String, required: true },
    layoutType: { type: String, enum: ["classic", "split", "cards", "minimal"], default: "classic" }
  },
  { timestamps: true }
)

export default mongoose.models.Post || mongoose.model<IPost>("Post", PostSchema)
