"use client"

import { useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { createBranchSchema } from "@/server/validation/branch-schemas"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useRouter, useParams } from "next/navigation"
import { zodFormResolver } from "@/lib/zod-form-resolver"

type FormValues = z.infer<typeof createBranchSchema>

const defaultOpening = { open: true, intervals: [{ start: "09:00", end: "23:00" }] }
const days: { key: keyof FormValues["openingHours"]; label: string }[] = [
  { key: "mon", label: "الاثنين" }, { key: "tue", label: "الثلاثاء" }, { key: "wed", label: "الأربعاء" },
  { key: "thu", label: "الخميس" }, { key: "fri", label: "الجمعة" }, { key: "sat", label: "السبت" },
  { key: "sun", label: "الأحد" },
]

export default function BranchEditorPage() {
  const params = useParams<{ subdomain: string; id: string }>()
  const router = useRouter()
  const isNew = params.id === "new"

  const form = useForm<FormValues>({
    resolver: zodFormResolver<FormValues>(createBranchSchema),
    defaultValues: {
      name: "",
      slug: "",
      phone: "",
      address: { line1: "" },
      openingHours: days.reduce((acc, d) => ({ ...acc, [d.key]: defaultOpening }), {} as any),
      isMain: false,
      isActive: true,
    },
  })

  const load = async () => {
    if (!isNew) {
      const res = await fetch(`/api/${params.subdomain}/branches/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        form.reset({
          name: data.name,
          slug: data.slug,
          phone: data.phone || "",
          whatsapp: data.whatsapp || "",
          email: data.email || "",
          address: {
            line1: data.address?.line1 || "",
            line2: data.address?.line2 || "",
            city: data.address?.city || "",
            region: data.address?.region || "",
            country: data.address?.country || "",
            postalCode: data.address?.postalCode || "",
            location: data.address?.location,
          },
          openingHours: data.openingHours,
          isMain: data.isMain,
          isActive: data.isActive,
        })
      }
    }
  }

  useEffect(() => { load() }, [])

  const onSubmit = async (values: FormValues) => {
    const url = isNew
      ? `/api/${params.subdomain}/branches`
      : `/api/${params.subdomain}/branches/${params.id}`

    const res = await fetch(url, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    if (res.ok) router.push(`/dashboard/${params.subdomain}/branches`)
    else alert("حدث خطأ أثناء الحفظ")
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{isNew ? "إضافة فرع" : "تعديل الفرع"}</h1>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>اسم الفرع</Label>
            <Input {...form.register("name")} placeholder="الهرم – فيصل" />
          </div>
          <div>
            <Label>Slug</Label>
            <Input {...form.register("slug")} placeholder="faisal" />
          </div>
          <div>
            <Label>هاتف</Label>
            <Input {...form.register("phone")} placeholder="+20 1X XXX XXXX" />
          </div>
          <div>
            <Label>واتساب</Label>
            <Input {...form.register("whatsapp")} placeholder="+20 1X XXX XXXX" />
          </div>
          <div>
            <Label>بريد إلكتروني</Label>
            <Input {...form.register("email")} placeholder="branch@example.com" />
          </div>
          <div className="flex items-center gap-3 mt-6">
            <Switch checked={form.watch("isMain")} onCheckedChange={(v) => form.setValue("isMain", v)} />
            <span>فرع رئيسي</span>
          </div>
          <div className="flex items-center gap-3 mt-6">
            <Switch checked={form.watch("isActive")} onCheckedChange={(v) => form.setValue("isActive", v)} />
            <span>نشط</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">العنوان</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div><Label>العنوان</Label><Input {...form.register("address.line1")} placeholder="شارع …" /></div>
          <div><Label>العنوان 2</Label><Input {...form.register("address.line2")} /></div>
          <div><Label>المدينة</Label><Input {...form.register("address.city")} /></div>
          <div><Label>المحافظة/المنطقة</Label><Input {...form.register("address.region")} /></div>
          <div><Label>الدولة</Label><Input {...form.register("address.country")} /></div>
          <div><Label>الرمز البريدي</Label><Input {...form.register("address.postalCode")} /></div>
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div><Label>Longitude (x)</Label><Input type="number"
              onChange={(e) => {
                const lng = Number(e.target.value)
                const lat = form.getValues("address.location")?.coordinates?.[1] ?? 0
                form.setValue("address.location", { type: "Point", coordinates: [lng, lat] } as any)
              }} /></div>
            <div><Label>Latitude (y)</Label><Input type="number"
              onChange={(e) => {
                const lat = Number(e.target.value)
                const lng = form.getValues("address.location")?.coordinates?.[0] ?? 0
                form.setValue("address.location", { type: "Point", coordinates: [lng, lat] } as any)
              }} /></div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">ساعات العمل</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {days.map((d) => (
            <DayEditor key={d.key} dayKey={d.key} label={d.label} form={form} />
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit">حفظ</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>رجوع</Button>
      </div>
    </form>
  )
}

function DayEditor({ dayKey, label, form }: any) {
  const open = form.watch(`openingHours.${dayKey}.open`)
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `openingHours.${dayKey}.intervals`,
  })

  return (
    <div className="p-4 rounded-2xl border space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">{label}</div>
        <div className="flex items-center gap-2">
          <span className="text-sm">مفتوح</span>
          <Switch checked={open} onCheckedChange={(v) => form.setValue(`openingHours.${dayKey}.open`, v)} />
        </div>
      </div>

      {open && (
        <div className="space-y-3">
          {fields.map((f: any, i: number) => (
            <div key={f.id} className="grid grid-cols-2 gap-3">
              <Input type="time" {...form.register(`openingHours.${dayKey}.intervals.${i}.start`)} />
              <div className="flex gap-2">
                <Input type="time" {...form.register(`openingHours.${dayKey}.intervals.${i}.end`)} />
                <Button type="button" variant="outline" onClick={() => remove(i)}>حذف</Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={() => append({ start: "09:00", end: "23:00" })}>
            إضافة فترة
          </Button>
        </div>
      )}
    </div>
  )
}
