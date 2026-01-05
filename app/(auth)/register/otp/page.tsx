"use client"

import { Suspense } from "react"
import { OTPForm } from "@/app/components/ui/otp-form"

function OTPPageContent() {
  return (
    <div className="relative min-h-svh w-full overflow-hidden">
      {/* Background dengan gradient dan elemen dekoratif */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-emerald-50 to-teal-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-emerald-950">
        {/* Elemen dekoratif 1 - Lingkaran besar di kiri atas */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-emerald-200/30 to-teal-200/20 rounded-full blur-3xl opacity-60 dark:from-emerald-900/20 dark:to-teal-900/10"></div>

        {/* Elemen dekoratif 2 - Lingkaran di kanan bawah */}
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-tl from-teal-200/30 to-emerald-200/20 rounded-full blur-3xl opacity-60 dark:from-teal-900/20 dark:to-emerald-900/10"></div>

        {/* Elemen dekoratif 3 - Lingkaran kecil di tengah */}
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-br from-teal-100/20 to-transparent rounded-full blur-3xl opacity-40 dark:from-teal-900/10 dark:to-transparent"></div>

        {/* Grid pattern subtle */}
        <div 
          className="absolute inset-0 opacity-5 dark:opacity-10"
          style={{
            backgroundImage: `linear-gradient(90deg, #7CE0A8 1px, transparent 1px), linear-gradient(#7CE0A8 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        ></div>

        {/* Animated lines - elemen 1 */}
        <svg 
          className="absolute top-20 right-20 w-40 h-40 opacity-10 dark:opacity-5"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M50 50 Q100 50 150 100 T150 150" 
            stroke="#7CE0A8" 
            strokeWidth="2"
            className="animate-pulse"
          />
          <circle cx="50" cy="50" r="3" fill="#7CE0A8" />
          <circle cx="150" cy="150" r="3" fill="#7CE0A8" />
        </svg>

        {/* Animated lines - elemen 2 */}
        <svg 
          className="absolute bottom-20 left-20 w-40 h-40 opacity-10 dark:opacity-5"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M150 50 Q100 100 50 150" 
            stroke="#7CE0A8" 
            strokeWidth="2"
            className="animate-pulse"
            style={{ animationDelay: '0.5s' }}
          />
          <circle cx="150" cy="50" r="3" fill="#7CE0A8" />
          <circle cx="50" cy="150" r="3" fill="#7CE0A8" />
        </svg>

        {/* Floating dots - decorative elements */}
        <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-teal-400 rounded-full opacity-20 animate-float" style={{ animationDelay: '0s', animation: 'float 6s ease-in-out infinite' }}></div>
        <div className="absolute top-3/4 left-1/3 w-3 h-3 bg-emerald-400 rounded-full opacity-15 animate-float" style={{ animationDelay: '2s', animation: 'float 6s ease-in-out infinite' }}></div>
        <div className="absolute top-1/2 right-1/3 w-2.5 h-2.5 bg-teal-300 rounded-full opacity-10 animate-float" style={{ animationDelay: '4s', animation: 'float 6s ease-in-out infinite' }}></div>
      </div>

      {/* Content Container - dengan z-index lebih tinggi dari background */}
      <div className="relative z-10 flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <OTPForm type="register" />
        </div>
      </div>

      {/* CSS untuk animasi floating */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-40px) translateX(-10px);
          }
          75% {
            transform: translateY(-20px) translateX(5px);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="relative min-h-svh w-full overflow-hidden">
        {/* Background untuk loading state */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-emerald-50 to-teal-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-emerald-950">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-emerald-200/30 to-teal-200/20 rounded-full blur-3xl opacity-60 dark:from-emerald-900/20 dark:to-teal-900/10"></div>
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-tl from-teal-200/30 to-emerald-200/20 rounded-full blur-3xl opacity-60 dark:from-teal-900/20 dark:to-emerald-900/10"></div>
        </div>

        {/* Loading skeleton */}
        <div className="relative z-10 flex min-h-svh w-full items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-sm">
            <div className="animate-pulse">
              <div className="bg-white dark:bg-neutral-800 rounded-xl p-8 space-y-6">
                <div className="space-y-2">
                  <div className="h-8 bg-gray-200 dark:bg-neutral-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-full"></div>
                </div>
                <div className="flex gap-2 justify-center">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-14 w-12 bg-gray-200 dark:bg-neutral-700 rounded-lg"></div>
                  ))}
                </div>
                <div className="h-10 bg-gray-200 dark:bg-neutral-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <OTPPageContent />
    </Suspense>
  )
}
