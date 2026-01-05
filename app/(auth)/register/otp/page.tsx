// app/register/otp/page.tsx
"use client";

import { Suspense } from "react";
import { OTPForm } from "@/app/components/ui/otp-form";

function OTPBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Soft blobs - Responsive sizes */}
      <div className="absolute -top-20 -left-20 h-60 w-60 md:-top-28 md:-left-28 md:h-80 md:w-80 rounded-full bg-[#7CE0A8]/35 blur-2xl md:blur-3xl" />
      <div className="absolute -bottom-24 -right-16 h-72 w-72 md:-bottom-32 md:-right-24 md:h-96 md:w-96 rounded-full bg-teal-300/25 blur-2xl md:blur-3xl" />

      {/* Subtle dots pattern - Lighter on mobile */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.12] dark:opacity-[0.05] md:opacity-[0.18] md:dark:opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="otpDots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#7CE0A8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#otpDots)" />
      </svg>

      {/* Abstract "canvas stroke" - Smaller on mobile */}
      <svg
        className="absolute -top-4 right-4 h-28 w-28 opacity-30 dark:opacity-15 md:-top-6 md:right-6 md:h-40 md:w-40 md:opacity-40 md:dark:opacity-20"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M36,92 C44,48 86,26 124,36 C160,46 175,82 162,118 C150,150 114,172 78,162 C44,152 28,128 36,92 Z"
          fill="#7CE0A8"
          fillOpacity="0.35"
        />
        <circle cx="145" cy="58" r="8" fill="#0ea5a4" fillOpacity="0.25" />
      </svg>

      {/* Small mascot-like icon - Hidden on very small screens */}
      <svg
        className="absolute bottom-4 left-4 h-16 w-16 opacity-40 dark:opacity-20 md:bottom-6 md:left-6 md:h-24 md:w-24 md:opacity-50 md:dark:opacity-25 hidden sm:block"
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
        "bg-gradient-to-br from-[#7CE0A8]/15 via-white to-teal-50",
        "dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900",
        "safe-area-bottom" // Untuk devices dengan notch
      ].join(" ")}
    >
      <OTPBackground />

      {/* Foreground */}
      <div className="relative z-10 flex min-h-svh w-full items-center justify-center p-4 sm:p-6 md:p-10">
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
        <div className="relative min-h-svh w-full overflow-hidden bg-gradient-to-br from-[#7CE0A8]/15 via-white to-teal-50 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 safe-area-bottom">
          <OTPBackground />
          <div className="relative z-10 flex min-h-svh w-full items-center justify-center p-4 sm:p-6 md:p-10">
            <div className="w-full max-w-md">
              <div className="animate-pulse rounded-2xl bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md p-4 sm:p-6 shadow-xl ring-1 ring-black/5 dark:ring-white/5 mx-4">
                <div className="h-6 sm:h-7 md:h-8 bg-gray-200 dark:bg-neutral-700 rounded w-3/4 mb-3 sm:mb-4"></div>
                <div className="h-3 sm:h-4 bg-gray-200 dark:bg-neutral-700 rounded w-full mb-6 sm:mb-8"></div>
                <div className="flex gap-1.5 sm:gap-2 mb-4 justify-center">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-10 w-7 sm:h-12 sm:w-9 md:h-14 md:w-12 bg-gray-200 dark:bg-neutral-700 rounded"></div>
                  ))}
                </div>
                <div className="h-9 sm:h-10 md:h-11 bg-gray-200 dark:bg-neutral-700 rounded w-full"></div>
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