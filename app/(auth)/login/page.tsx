"use client"

import { LoginForm } from "@/app/components/ui/login-form"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function Page() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [googleError, setGoogleError] = useState<string | null>(null)

  useEffect(() => {
    // Check for Google OAuth error
    const error = searchParams?.get("error")
    if (error === "USER_NOT_REGISTERED") {
      setGoogleError("Akun Google Anda belum terdaftar. Silakan daftar terlebih dahulu.")
    }
  }, [searchParams])

  useEffect(() => {
    window.history.replaceState(null, "", window.location.href)
    window.history.pushState(null, "", window.location.href)
    const handlePopState = () => {
      router.replace("/")
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [router])

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        {googleError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {googleError}
            <button 
              onClick={() => setGoogleError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}
        <LoginForm userType="user" />
      </div>
    </div>
  )
}
