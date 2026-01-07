// app/mitra/login/page.tsx
import { Suspense } from "react"
import { LoginForm } from "@/app/components/ui/login-form"

export default function MitraLoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
      <div className="w-full max-w-sm">
        <Suspense fallback={<div>Loading...</div>}>
          <LoginForm userType="mitra" />
        </Suspense>
      </div>
    </div>
  )
}