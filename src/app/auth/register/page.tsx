"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { Eye, EyeOff, Loader2 } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { zodFormResolver } from "@/lib/zod-form-resolver"

const formSchema = z
  .object({
    name: z.string().min(2, { message: "الاسم يجب أن يتكوّن من حرفين على الأقل" }),
    email: z.string().email({ message: "أدخل بريدًا إلكترونيًا صالحًا" }),
    password: z.string().min(6, { message: "الرقم السري يجب ألا يقل عن 6 خانات" }),
    confirmPassword: z.string().min(6, { message: "يرجى تأكيد الرقم السري" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "الرقم السري غير متطابق",
    path: ["confirmPassword"],
  })

type FormData = z.infer<typeof formSchema>

export default function CustomerRegisterPage() {
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
  } = useForm<FormData>({
    resolver: zodFormResolver<FormData>(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "customer",
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "تعذّر التسجيل، حاول مرة أخرى")
        return
      }

      setSuccess("تم إنشاء الحساب بنجاح! سيتم تحويلك لتسجيل الدخول")
      setTimeout(() => router.push("/auth/login"), 1800)
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
        <CardTitle className="text-3xl font-bold text-gray-900">إنشاء حساب عميل</CardTitle>
        <CardDescription className="text-sm leading-6 text-gray-500">
          انضم إلى منصة ميلزا لتصفح المطاعم، حفظ عناوينك وتتبع طلباتك بكل سهولة.
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

          <Field label="الاسم الكامل" error={errors.name?.message}>
            <Input
              id="name"
              placeholder="مثال: أحمد القاضي"
              className="text-right"
              disabled={isLoading}
              {...register("name")}
            />
          </Field>

          <Field label="البريد الإلكتروني" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
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
              "تسجيل الحساب"
            )}
          </Button>

          <div className="text-sm text-gray-600">
            لديك حساب بالفعل؟
            <Link href="/auth/login" className="mr-2 font-semibold text-[#6c5ce7] hover:text-[#5643d7]">
              تسجيل الدخول
            </Link>
          </div>

          <div className="text-xs text-gray-500">
            هل أنت من فريق الإدارة؟
            <Link href="/auth/register-manager" className="mr-1 font-semibold text-[#6c5ce7] hover:text-[#5643d7]">
              انتقل لتسجيل المدراء
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
