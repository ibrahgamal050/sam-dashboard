import { Suspense } from "react"

import { LocalAuthPage } from "@/components/auth/local-auth-page"

export default function SignInPage() {
  return (
    <Suspense>
      <LocalAuthPage locale="en" />
    </Suspense>
  )
}
