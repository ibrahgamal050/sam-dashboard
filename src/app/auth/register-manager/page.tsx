"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Building2, Eye, EyeOff, Loader2, Shield, Users } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type UserRole = "admin" | "manager" | "staff"

const formSchema = z
  .object({
    name: z.string().min(2, { message: "الاسم يجب أن يتكوّن من حرفين على الأقل" }),
    email: z.string().email({ message: "يرجى إدخال بريد إلكتروني صالح" }),
    password: z.string().min(6, { message: "الرقم السري يجب ألا يقل عن 6 خانات" }),
    confirmPassword: z.string().min(6, { message: "يرجى تأكيد الرقم السري" }),
    restaurantId: z.string().min(1, { message: "معرّف المطعم مطلوب" }),
    role: z.enum(["admin", "manager", "staff"], { required_error: "اختر نوع صلاحية المستخدم" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "الرقم السري غير متطابق",
    path: ["confirmPassword"],
  })

type FormData = z.infer<typeof formSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      restaurantId: "",
      role: "manager",
    },
  })

  const role = watch("role")

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "manager",
          name: data.name,
          email: data.email,
          password: data.password,
          restaurantId: data.restaurantId,
          role: data.role,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "تعذّر التسجيل، حاول مرة أخرى")
        return
      }

      setSuccess("تم إنشاء الحساب بنجاح! سيتم تحويلك لتسجيل الدخول")
      setTimeout(() => router.push("/auth/signin"), 1800)
    } catch (err) {
      console.error("Registration error", err)
      setError("حدث خطأ غير متوقع. الرجاء المحاولة لاحقًا.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-none" dir="rtl">
      <CardHeader className="space-y-3 text-right">
        <div className="flex items-center justify-between text-xs text-[#6c5ce7]">
          <span className="rounded-full bg-[#6c5ce7]/10 px-3 py-1 font-semibold text-[#6c5ce7]">منطقة الإدارة</span>
          <span className="hidden text-[#6c5ce7]/70 sm:inline">ميلزا برو</span>
        </div>
        <CardTitle className="text-3xl font-bold text-gray-900">إنشاء حساب إدارة المطعم</CardTitle>
        <CardDescription className="text-sm leading-6 text-gray-500">
          اربط مطعمك بالمنصة، أضف فريقك، وابدأ إدارة الطلبات، الفروع والقوالب بكل سهولة.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <CardContent className="space-y-5">
          {error && (
            <Alert variant="destructive" className="text-right">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 text-right text-green-700">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="الاسم الكامل"
              error={errors.name?.message}
            >
              <Input
                id="name"
                placeholder="مثال: إبراهيم جمال"
                className="text-right"
                disabled={isLoading}
                {...register("name")}
              />
            </Field>

            <Field
              label="البريد الإلكتروني"
              error={errors.email?.message}
            >
              <Input
                id="email"
                type="email"
                placeholder="name@restaurant.com"
                className="text-right"
                disabled={isLoading}
                {...register("email")}
              />
            </Field>

            <Field label="الرقم السري" error={errors.password?.message}>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="text-right"
                  disabled={isLoading}
                  {...register("password")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-0 top-0 h-full px-3 py-2 text-gray-500 hover:bg-transparent"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </Field>

            <Field label="تأكيد الرقم السري" error={errors.confirmPassword?.message}>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="text-right"
                  disabled={isLoading}
                  {...register("confirmPassword")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-0 top-0 h-full px-3 py-2 text-gray-500 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </Field>

            <Field label="معرّف المطعم" error={errors.restaurantId?.message}>
              <div className="relative">
                <Input
                  id="restaurantId"
                  placeholder="64a1c84f2cd9f8f6b1a9c123"
                  className="pr-10 text-right"
                  disabled={isLoading}
                  {...register("restaurantId")}
                />
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </Field>

            <Field label="مستوى الصلاحية" error={errors.role?.message}>
              <Select
                value={role}
                onValueChange={(value) => setValue("role", value as UserRole, { shouldValidate: true })}
                disabled={isLoading}
              >
                <SelectTrigger className="justify-between text-right">
                  <SelectValue placeholder="اختر نوع الصلاحية">
                    {roleLabel(role)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="text-right">
                  <SelectItem value="admin">
                    <div className="flex items-center justify-between gap-3">
                      <span>صاحب المنصة (كامل الصلاحيات)</span>
                      <Shield className="h-4 w-4 text-[#6c5ce7]" />
                    </div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div className="flex items-center justify-between gap-3">
                      <span>مدير المطعم</span>
                      <Users className="h-4 w-4 text-[#6c5ce7]" />
                    </div>
                  </SelectItem>
                  <SelectItem value="staff">
                    <div className="flex items-center justify-between gap-3">
                      <span>عضو فريق</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="rounded-3xl bg-[#f8f9ff] p-5 text-sm text-gray-600 shadow-inner">
            <p className="font-medium text-gray-800">تذكّر قبل المتابعة:</p>
            <ul className="mt-3 list-disc space-y-1 pr-5">
              <li>يمكنك تعديل الصلاحيات لاحقًا من داخل لوحة التحكم.</li>
              <li>يتعين أن يكون معرّف المطعم مسجلًا مسبقًا في النظام.</li>
              <li>بعد التسجيل ستتمكن من دعوة أعضاء فريق إضافيين.</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 text-right">
          <Button
            type="submit"
            className="w-full rounded-2xl bg-[#6c5ce7] text-white shadow-lg shadow-[#6c5ce7]/25"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري إنشاء الحساب...
              </>
            ) : (
              "تسجيل حساب جديد"
            )}
          </Button>

          <div className="text-sm text-gray-600">
            لديك حساب بالفعل؟
            <Link href="/auth/signin" className="mr-2 font-semibold text-[#6c5ce7] hover:text-[#5643d7]">
              تسجيل الدخول
            </Link>
          </div>

          <div className="text-xs text-gray-500">
            تبحث عن حساب عميل؟
            <Link href="/auth/register" className="mr-1 font-semibold text-[#6c5ce7] hover:text-[#5643d7]">
              انتقل لتسجيل العملاء
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}

const Field = ({ label, error, children }: { label: string; error?: string | null; children: ReactNode }) => (
  <div className="space-y-2 text-right">
    <Label className="text-sm font-medium text-gray-700">{label}</Label>
    {children}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
)

const roleLabel = (value: UserRole) => {
  switch (value) {
    case "admin":
      return "صاحب المنصة"
    case "manager":
      return "مدير المطعم"
    case "staff":
    default:
      return "عضو فريق"
  }
}
