"use client"



import React from "react"
import Link from "next/link"

// 👇 لو عندك API حقيقي بيجيب المنيو استخدمه بدل الـ mock
const mockMenuData = {
  shawarma: [
    { id: "1", name: "شاورما فراخ رول", price: 60 },
    { id: "2", name: "شاورما لحم رول", price: 75 },
    { id: "3", name: "وجبة شاورما دجاج", price: 95 },
    { id: "4", name: "وجبة شاورما لحم", price: 105 },
    { id: "5", name: "صحن شاورما ميكس", price: 120 }
  ]
}

type Block = {
  id: string
  type: string
  heading?: string
  text?: string
  image?: string
  button?: { label: string; url: string; style?: "primary" | "secondary" }
  menuSection?: { sectionId?: string; title?: string; limit?: number }
}

interface PostProps {
  title: string
  subtitle?: string
  image?: string
  layoutType?: "classic" | "split" | "cards" | "minimal"
  content: Block[]
}

/* ---------------------- Component ---------------------- */

export default function PostRenderer({ title, subtitle, image, layoutType = "classic", content }: PostProps) {
  return (
    <article
      className={`max-w-4xl mx-auto p-6 space-y-10 ${
        layoutType === "split" ? "grid lg:grid-cols-2 gap-10 items-start" : ""
      }`}
    >
      {/* ---------- الصورة + الهيدر ---------- */}
      <div className={`${layoutType === "split" ? "order-2" : ""}`}>
        {image && (
          <img
            src={image}
            alt={title}
            className="rounded-2xl w-full object-cover shadow-md max-h-[400px]"
          />
        )}
      </div>

      <div className="space-y-4">
        <header>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          {subtitle && <p className="text-gray-600 text-lg">{subtitle}</p>}
        </header>

        {/* ---------- محتوى المقال ---------- */}
        <div className="space-y-8">
          {content.map((block) => (
            <RenderBlock key={block.id} block={block} />
          ))}
        </div>
      </div>
    </article>
  )
}

/* ---------------------- Block Renderer ---------------------- */

function RenderBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "text":
      return (
        <section className="space-y-2">
          {block.heading && <h2 className="text-2xl font-semibold text-gray-800">{block.heading}</h2>}
          {block.text && <p className="text-gray-700 leading-relaxed">{block.text}</p>}
        </section>
      )

    case "image":
      return (
        <div className="w-full">
          <img src={block.image!} alt={block.heading || ""} className="rounded-xl shadow-md w-full" />
          {block.heading && <p className="text-center text-gray-600 mt-2">{block.heading}</p>}
        </div>
      )

    case "button":
      return (
        <div className="pt-2">
          <Link
            href={block.button?.url || "#"}
            className={`px-6 py-3 rounded-lg font-medium ${
              block.button?.style === "secondary"
                ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                : "bg-violet-600 text-white hover:bg-violet-700"
            }`}
          >
            {block.button?.label || "اضغط هنا"}
          </Link>
        </div>
      )

    case "menuSection": {
      const sectionId = block.menuSection?.sectionId || "shawarma"
      const sectionData = mockMenuData[sectionId] || []
      const limit = block.menuSection?.limit || sectionData.length
      const items = sectionData.slice(0, limit)
      return (
        <section>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            {block.menuSection?.title || "قسم المنيو"}
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">{item.name}</span>
                  <span className="text-violet-600 font-semibold">{item.price} ج.م</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )
    }

    default:
      return null
  }
}
