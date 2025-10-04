"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login } from "@/lib/auth-client"

type SignInData = {
  email: string
  password: string
}

const formSchema = z.object({
  email: z.string().email({ message: "أدخل بريدًا إلكترونيًا صالحًا" }),
  password: z.string().min(6, { message: "الرقم السري يجب ألا يقل عن 6 خانات" }),
})

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard/restaurants"
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInData>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (data: SignInData) => {
    try {
      setIsLoading(true)
      setError(null)

      await login({ email: data.email, password: data.password })
      router.push(callbackUrl)
      router.refresh()
    } catch (err) {
      console.error("Sign in error", err)
      setError(
        err instanceof Error && err.message ? err.message : "حدث خطأ غير متوقع، حاول مرة أخرى"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-none" dir="rtl">
      <CardHeader className="space-y-2 text-right">
        <CardTitle className="text-3xl font-bold text-gray-900">مرحبًا بعودتك</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          سجّل الدخول لبدء إدارة المطعم، وتتبع الطلبات والفريق من لوحة التحكم.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <CardContent className="space-y-5">
          {error && (
            <Alert variant="destructive" className="text-right">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2 text-right">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@restaurant.com"
              className="text-right"
              disabled={isLoading}
              {...register("email")}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2 text-right">
            <Label htmlFor="password">الرقم السري</Label>
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
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <Link href="/auth/register" className="font-semibold text-[#6c5ce7] hover:text-[#5643d7]">
              إنشاء حساب جديد
            </Link>
            <Link href="/auth/forgot-password" className="hover:text-gray-700">
              نسيت الرقم السري؟
            </Link>
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
                جارٍ التحقق من البيانات...
              </>
            ) : (
              "تسجيل الدخول"
            )}
          </Button>

          <p className="text-xs leading-6 text-gray-500">
            باستخدامك للمنصة فأنت توافق على شروط الاستخدام وسياسة الخصوصية الخاصة بميلزا.
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
