"use client"

import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  // Map error codes to user-friendly messages
  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case "CredentialsSignin":
        return "Неверный email или пароль. Попробуйте ещё раз."
      case "SessionRequired":
        return "Для доступа к этой странице необходимо войти в систему."
      case "AccessDenied":
        return "У вас нет прав доступа к этому ресурсу."
      case "CallbackRouteError":
        return "Произошла ошибка при обратном вызове аутентификации."
      default:
        return "Произошла непредвиденная ошибка аутентификации. Попробуйте ещё раз."
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Ошибка аутентификации</CardTitle>
          <CardDescription>При входе в систему возникла проблема</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription>{getErrorMessage(error)}</AlertDescription>
          </Alert>

          <p className="text-sm text-gray-500">
            Если проблема не исчезает, обратитесь в службу поддержки или повторите попытку позже.
          </p>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button className="w-full" onClick={() => (window.location.href = "/auth/login")}>
            Попробовать снова
          </Button>
          <div className="text-center text-sm">
            <a href="/" className="text-blue-600 hover:text-blue-800">
              На главную
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
