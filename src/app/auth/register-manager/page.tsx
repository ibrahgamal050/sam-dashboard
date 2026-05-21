"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { Building2, Eye, EyeOff, Loader2, Shield, Users } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { zodFormResolver } from "@/lib/zod-form-resolver"

type UserRole = "admin" | "manager" | "staff"

const formSchema = z
  .object({
    name: z.string().min(2, { message: "Имя должно содержать не менее 2 символов" }),
    email: z.string().email({ message: "Введите корректный email" }),
    password: z.string().min(6, { message: "Пароль должен содержать не менее 6 символов" }),
    confirmPassword: z.string().min(6, { message: "Пожалуйста, подтвердите пароль" }),
    restaurantId: z.string().min(1, { message: "Идентификатор ресторана обязателен" }),
    role: z.enum(["admin", "manager", "staff"], { required_error: "Выберите уровень доступа" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
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
    resolver: zodFormResolver<FormData>(formSchema),
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
        setError(result.error || "Не удалось зарегистрироваться, попробуйте ещё раз")
        return
      }

      setSuccess("Аккаунт успешно создан! Вы будете перенаправлены на страницу входа")
      setTimeout(() => router.push("/auth/login"), 1800)
    } catch (err) {
      console.error("Registration error", err)
      setError("Произошла непредвиденная ошибка. Пожалуйста, попробуйте позже.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-none" dir="ltr">
      <CardHeader className="space-y-3 text-left">
        <div className="flex items-center justify-between text-xs text-[#6c5ce7]">
          <span className="rounded-full bg-[#6c5ce7]/10 px-3 py-1 font-semibold text-[#6c5ce7]">Зона управления</span>
          <span className="hidden text-[#6c5ce7]/70 sm:inline">Meelza Pro</span>
        </div>
        <CardTitle className="text-3xl font-bold text-gray-900">Создать аккаунт управления рестораном</CardTitle>
        <CardDescription className="text-sm leading-6 text-gray-500">
          Подключите ваш ресторан к платформе, добавьте команду и начните управлять заказами, филиалами и шаблонами.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <CardContent className="space-y-5">
          {error && (
            <Alert variant="destructive" className="text-left">
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
              label="Полное имя"
              error={errors.name?.message}
            >
              <Input
                id="name"
                placeholder="Например: Иван Иванов"
                className="text-left"
                disabled={isLoading}
                {...register("name")}
              />
            </Field>

            <Field
              label="Email"
              error={errors.email?.message}
            >
              <Input
                id="email"
                type="email"
                placeholder="name@restaurant.com"
                className="text-left"
                disabled={isLoading}
                {...register("email")}
              />
            </Field>

            <Field label="Пароль" error={errors.password?.message}>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="text-left"
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

            <Field label="Подтвердите пароль" error={errors.confirmPassword?.message}>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="text-left"
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

            <Field label="ID ресторана" error={errors.restaurantId?.message}>
              <div className="relative">
                <Input
                  id="restaurantId"
                  placeholder="64a1c84f2cd9f8f6b1a9c123"
                  className="pr-10 text-left"
                  disabled={isLoading}
                  {...register("restaurantId")}
                />
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </Field>

            <Field label="Уровень доступа" error={errors.role?.message}>
              <Select
                value={role}
                onValueChange={(value) => setValue("role", value as UserRole, { shouldValidate: true })}
                disabled={isLoading}
              >
                <SelectTrigger className="justify-between text-left">
                  <SelectValue placeholder="Выберите уровень доступа">
                    {roleLabel(role)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="text-left">
                  <SelectItem value="admin">
                    <div className="flex items-center justify-between gap-3">
                      <span>Владелец платформы (полный доступ)</span>
                      <Shield className="h-4 w-4 text-[#6c5ce7]" />
                    </div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div className="flex items-center justify-between gap-3">
                      <span>Менеджер ресторана</span>
                      <Users className="h-4 w-4 text-[#6c5ce7]" />
                    </div>
                  </SelectItem>
                  <SelectItem value="staff">
                    <div className="flex items-center justify-between gap-3">
                      <span>Сотрудник</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="rounded-3xl bg-[#f8f9ff] p-5 text-sm text-gray-600 shadow-inner">
            <p className="font-medium text-gray-800">Обратите внимание:</p>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>Вы можете изменить права доступа позже в панели управления.</li>
              <li>ID ресторана должен быть зарегистрирован в системе заранее.</li>
              <li>После регистрации вы сможете пригласить дополнительных сотрудников.</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 text-left">
          <Button
            type="submit"
            className="w-full rounded-2xl bg-[#6c5ce7] text-white shadow-lg shadow-[#6c5ce7]/25"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                Создание аккаунта...
              </>
            ) : (
              "Зарегистрировать новый аккаунт"
            )}
          </Button>

          <div className="text-sm text-gray-600">
            Уже есть аккаунт?{" "}
            <Link href="/auth/login" className="font-semibold text-[#6c5ce7] hover:text-[#5643d7]">
              Войти
            </Link>
          </div>

          <div className="text-xs text-gray-500">
            Ищете клиентский аккаунт?{" "}
            <Link href="/auth/register" className="font-semibold text-[#6c5ce7] hover:text-[#5643d7]">
              Регистрация для клиентов
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}

const Field = ({ label, error, children }: { label: string; error?: string | null; children: ReactNode }) => (
  <div className="space-y-2 text-left">
    <Label className="text-sm font-medium text-gray-700">{label}</Label>
    {children}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
)

const roleLabel = (value: UserRole) => {
  switch (value) {
    case "admin":
      return "Владелец платформы"
    case "manager":
      return "Менеджер ресторана"
    case "staff":
    default:
      return "Сотрудник"
  }
}
