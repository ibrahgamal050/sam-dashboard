"use client"
import dynamic from "next/dynamic"

import PostJsonEditor from "@/components/dashboard/posts/PostJsonEditor"
export default function JsonEditorPage() {
  return (
    <div className="min-h-screen bg-white p-6">
      <h1 className="text-2xl font-bold mb-4">إنشاء/تعديل مقال عبر JSON</h1>
      <PostJsonEditor />
    </div>
  )
}
