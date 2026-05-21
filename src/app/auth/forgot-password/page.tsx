"use client"

import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2, Mail } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requestPasswordReset } from "@/lib/auth-client"
import { zodFormResolver } from "@/lib/zod-form-resolver"

const formSchema = z.object({
  email: z.string().email({ message: "Введите корректный email" }),
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
    resolver: zodFormResolver<ForgotPasswordForm>(formSchema),
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
      const message = err instanceof Error && err.message ? err.message : "Не удалось отправить код сброса пароля"
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-0 shadow-none" dir="ltr">
      <CardHeader className="space-y-2 text-left">
        <CardTitle className="text-3xl font-bold text-gray-900">Сброс пароля</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Введите ваш email, и мы отправим код для сброса пароля.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <CardContent className="space-y-5">
          {success && (
            <Alert className="text-left">
              <Mail className="h-4 w-4" />
              <AlertTitle>Отправлено</AlertTitle>
              <AlertDescription className="leading-6">
                Проверьте вашу почту. В режиме разработки код будет выведен в логах сервера.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="text-left">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2 text-left">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@restaurant.com"
              className="text-left"
              disabled={isSubmitting}
              {...register("email")}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 text-left">
          <Button type="submit" className="w-full rounded-2xl bg-[#6c5ce7] text-white" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                Отправка...
              </>
            ) : (
              "Отправить код сброса"
            )}
          </Button>

          <p className="text-xs leading-6 text-gray-500">
            Вспомнили пароль?{' '}
            <Link href="/auth/login" className="font-semibold text-[#6c5ce7] hover:text-[#5643d7]">
              Вернуться к входу
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
