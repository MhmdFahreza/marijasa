// app/register/otp/page.tsx
"use client";

import { Suspense } from "react";
import { OTPForm } from "@/app/components/ui/otp-form";

function OTPBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Soft blobs */}
      <div className="absolute -top-28 -left-28 h-80 w-80 rounded-full bg-[#7CE0A8]/35 blur-3xl" />
      <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-teal-300/25 blur-3xl" />

      {/* Subtle dots pattern */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.18] dark:opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="otpDots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.6" fill="#7CE0A8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#otpDots)" />
      </svg>

      {/* Abstract "canvas stroke" */}
      <svg
        className="absolute -top-6 right-6 h-40 w-40 opacity-40 dark:opacity-20"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M36,92 C44,48 86,26 124,36 C160,46 175,82 162,118 C150,150 114,172 78,162 C44,152 28,128 36,92 Z"
          fill="#7CE0A8"
          fillOpacity="0.35"
        />
        <circle cx="145" cy="58" r="10" fill="#0ea5a4" fillOpacity="0.25" />
      </svg>

      {/* Small mascot-like icon (minimal, not childish) */}
      <svg
        className="absolute bottom-6 left-6 h-24 w-24 opacity-50 dark:opacity-25"
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="22" y="30" width="76" height="64" rx="18" fill="#7CE0A8" fillOpacity="0.25" />
        <rect x="30" y="40" width="60" height="40" rx="14" fill="#ffffff" fillOpacity="0.55" />
        <circle cx="48" cy="60" r="6" fill="#0f172a" fillOpacity="0.55" />
        <circle cx="72" cy="60" r="6" fill="#0f172a" fillOpacity="0.55" />
        <path d="M50 74 C56 80, 64 80, 70 74" stroke="#0f172a" strokeOpacity="0.45" strokeWidth="4" fill="none" strokeLinecap="round"/>
        <circle cx="60" cy="24" r="8" fill="#7CE0A8" fillOpacity="0.35" />
        <path d="M60 24 L60 34" stroke="#7CE0A8" strokeOpacity="0.55" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function OTPPageContent() {
  return (
    <div
      className={[
        "relative min-h-svh w-full overflow-hidden",
        "bg-gradient-to-br from-[#7CE0A8]/20 via-white to-teal-50",
        "dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900",
      ].join(" ")}
    >
      <OTPBackground />

      {/* Foreground */}
      <div className="relative z-10 flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <OTPForm type="register" />
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="relative min-h-svh w-full overflow-hidden bg-gradient-to-br from-[#7CE0A8]/20 via-white to-teal-50 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
          <OTPBackground />
          <div className="relative z-10 flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-md">
              <div className="animate-pulse rounded-2xl bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md p-6 shadow-xl ring-1 ring-black/5 dark:ring-white/5">
                <div className="h-8 bg-gray-200 dark:bg-neutral-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-full mb-8"></div>
                <div className="flex gap-2 mb-4 justify-center">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-14 w-12 bg-gray-200 dark:bg-neutral-700 rounded"></div>
                  ))}
                </div>
                <div className="h-10 bg-gray-200 dark:bg-neutral-700 rounded w-full"></div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <OTPPageContent />
    </Suspense>
  );
}
