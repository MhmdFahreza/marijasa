"use client"

import { LoginForm } from "@/app/components/ui/login-form"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Page() {
  const router = useRouter()

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
        <LoginForm userType="user" />
      </div>
    </div>
  )
}