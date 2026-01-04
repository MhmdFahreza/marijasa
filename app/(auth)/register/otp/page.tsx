"use client"

import { Suspense } from "react"
import { OTPForm } from "@/app/components/ui/otp-form"

function OTPPageContent() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <OTPForm type="register" />
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
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-8"></div>
            <div className="flex gap-2 mb-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-14 w-12 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    }>
      <OTPPageContent />
    </Suspense>
  )
}
