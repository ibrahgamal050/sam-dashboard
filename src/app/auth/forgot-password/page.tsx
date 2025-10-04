"use client"

import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Mail } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requestPasswordReset } from "@/lib/auth-client"

const formSchema = z.object({
  email: z.string().email({ message: "أدخل بريدًا إلكترونيًا صالحًا" }),
})

type ForgotPasswordForm = z.infer<typeof formSchema>

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  })

  const onSubmit = async (values: ForgotPasswordForm) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      await requestPasswordReset(values.email)
      setSuccess(true)
    } catch (err) {
      console.error("Forgot password error", err)
      const message = err instanceof Error && err.message ? err.message : "تعذر إرسال رمز إعادة التعيين"
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-0 shadow-none" dir="rtl">
      <CardHeader className="space-y-2 text-right">
        <CardTitle className="text-3xl font-bold text-gray-900">إعادة تعيين الرقم السري</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          أدخل بريدك الإلكتروني لنرسل لك رمز التحقق لإعادة تعيين الرقم السري.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <CardContent className="space-y-5">
          {success && (
            <Alert className="text-right">
              <Mail className="h-4 w-4" />
              <AlertTitle>تم الإرسال</AlertTitle>
              <AlertDescription className="leading-6">
                راجع بريدك الإلكتروني. في وضع التطوير ستجد الرمز مطبوعًا في سجل الخادم.
              </AlertDescription>
            </Alert>
          )}

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
              disabled={isSubmitting}
              {...register("email")}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 text-right">
          <Button type="submit" className="w-full rounded-2xl bg-[#6c5ce7] text-white" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جارٍ الإرسال...
              </>
            ) : (
              "إرسال رمز إعادة التعيين"
            )}
          </Button>

          <p className="text-xs leading-6 text-gray-500">
            تذكرت الرقم السري؟{' '}
            <Link href="/auth/signin" className="font-semibold text-[#6c5ce7] hover:text-[#5643d7]">
              العودة لتسجيل الدخول
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
