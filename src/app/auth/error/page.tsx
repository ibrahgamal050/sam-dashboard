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
        return "Invalid email or password. Please try again."
      case "SessionRequired":
        return "You need to be signed in to access this page."
      case "AccessDenied":
        return "You don't have permission to access this resource."
      case "CallbackRouteError":
        return "There was a problem with the authentication callback."
      default:
        return "An unexpected authentication error occurred. Please try again."
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
          <CardDescription>There was a problem signing you in</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{getErrorMessage(error)}</AlertDescription>
          </Alert>

          <p className="text-sm text-gray-500">
            If you continue to experience issues, please contact support or try again later.
          </p>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button className="w-full" onClick={() => (window.location.href = "/auth/signin")}>
            Try Again
          </Button>
          <div className="text-center text-sm">
            <a href="/" className="text-blue-600 hover:text-blue-800">
              Return to Home
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
