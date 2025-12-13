"use client"

import { useEffect, useMemo, useState } from "react"
import { z } from "zod"
import { useSearchParams } from "next/navigation"
import { Check, Save, Loader2 } from "lucide-react"
import PostRenderer from "@/components/PostRenderer"

const BlockSchema = z.object({
  id: z.string(),
  type: z.enum(["text", "image", "button", "video", "quote", "gallery", "menuSection"]),
  heading: z.string().optional(),
  text: z.string().optional(),
  image: z.string().optional(),
  button: z
    .object({
      label: z.string(),
      url: z.string(),
      style: z.enum(["primary", "secondary"]).optional(),
    })
    .optional(),
  menuSection: z
    .object({
      title: z.string().optional(),
      sectionId: z.string().optional(),
      itemsLimit: z.number().optional(),
    })
    .optional(),
})

const PostJsonSchema = z.object({
  restaurantId: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  image: z.string().optional(),
  layoutType: z.enum(["classic", "split", "cards", "minimal"]).optional(),
  content: z.array(BlockSchema).default([]),
  seo: z
    .object({
      title: z.string(),
      description: z.string().optional(),
      keywords: z.array(z.string()).optional(),
      slug: z.string(),
    })
    .optional(),
})

type PostJson = z.infer<typeof PostJsonSchema>

export default function PostJsonEditor() {
  const params = useSearchParams()
  const postId = params.get("postId")
  const [jsonInput, setJsonInput] = useState("")
  const [parsed, setParsed] = useState<PostJson | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // تحميل المقال في حالة التعديل
  useEffect(() => {
    if (!postId) return
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/posts/${postId}`)
        const data = await res.json()
        if (res.ok) setJsonInput(JSON.stringify(data, null, 2))
      } catch (e) {
        setMessage("تعذر تحميل المقال")
      }
    })()
  }, [postId])

  // التحقق من صحة الـ JSON
  useEffect(() => {
    if (!jsonInput.trim()) return setParsed(null)
    try {
      const raw = JSON.parse(jsonInput)
      const valid = PostJsonSchema.parse(raw)
      setParsed(valid)
      setError(null)
    } catch (e: any) {
      setParsed(null)
      setError(e.message)
    }
  }, [jsonInput])

  const coverOrImage = useMemo(
    () => parsed?.image ?? parsed?.coverImage ?? undefined,
    [parsed]
  )

  const handleSave = async () => {
    if (!parsed) return
    setSaving(true)
    setSaved(false)
    setMessage(null)

    try {
      const method = postId ? "PUT" : "POST"
      const url = postId ? `/api/admin/posts/${postId}` : "/api/admin/posts"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "حدث خطأ أثناء الحفظ")

      setSaved(true)
      setMessage(postId ? "تم تحديث المقال بنجاح ✅" : "تم إنشاء المقال بنجاح ✅")
      if (!postId && data.id) window.history.replaceState(null, "", `?postId=${data.id}`)
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between bg-white border-b px-6 py-3 sticky top-0 z-10 shadow-sm">
        <h1 className="text-lg font-bold text-gray-900">🧠 إنشاء / تعديل مقال JSON</h1>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-green-600 text-sm">
              <Check size={16} /> تم الحفظ
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!parsed || saving}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-white font-medium transition 
              ${saving ? "bg-gray-400" : "bg-violet-600 hover:bg-violet-700"}`}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> جاري الحفظ...
              </>
            ) : (
              <>
                <Save size={16} /> حفظ المقال
              </>
            )}
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <section className="w-1/2 border-l bg-white p-4 overflow-auto">
          <label className="block text-sm font-medium text-gray-700 mb-2">الصق JSON هنا</label>
          <textarea
            className="w-full h-[calc(100vh-140px)] font-mono text-sm border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            placeholder='{
  "restaurantId": "...",
  "title": "عنوان المقال",
  "content": [...]
}'
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
          />
          {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
          {message && <p className="text-gray-600 text-xs mt-1">{message}</p>}
        </section>

        {/* Preview */}
        <section className="flex-1 overflow-auto bg-gray-50 p-6"  dir="rtl" >
          <h2 className="font-semibold mb-3 text-gray-700">👀 المعاينة</h2>
          <div className="border bg-white rounded-xl p-6 shadow-sm min-h-[500px]">
            {parsed ? (
              <PostRenderer
                title={parsed.title}
                subtitle={parsed.subtitle}
                image={coverOrImage}
                layoutType={parsed.layoutType ?? "classic"}
                content={parsed.content ?? []}
              />
            ) : (
              <div className="text-gray-400 text-sm">أدخل JSON صالح لعرض المعاينة</div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
