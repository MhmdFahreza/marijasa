"use client"

import { LoginForm } from "@/app/components/ui/login-form"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Suspense } from "react"

function LoginContent() {
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

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-neutral-200 rounded w-full mb-8"></div>
            <div className="h-10 bg-neutral-200 rounded w-full mb-4"></div>
            <div className="h-10 bg-neutral-200 rounded w-full mb-4"></div>
            <div className="h-10 bg-neutral-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}