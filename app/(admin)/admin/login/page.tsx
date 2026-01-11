"use client";

import { LoginForm } from "@/app/components/ui/login-form";
import { AnimatedBackground, AnimatedCharacter } from "@/app/components/ui/animated-background";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

function AdminLoginContent() {
  const router = useRouter();

  useEffect(() => {
    window.history.replaceState(null, "", window.location.href);
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      router.replace("/admin/dashboard");
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router]);

  return (
    <>
      <AnimatedBackground variant="login" />

      <div className="relative z-10 min-h-svh w-full overflow-x-hidden">
        {/* Main Container */}
        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center min-h-svh px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 lg:py-10 gap-6 lg:gap-12 xl:gap-16">
          
          {/* Left Side - Character & Text (Desktop only - lg and up) */}
          <div className="hidden lg:flex flex-col items-center justify-center flex-1 max-w-lg xl:max-w-xl">
            {/* Character Animation - Admin Variant */}
            <div className="relative w-full max-w-sm xl:max-w-md">
              <AnimatedCharacter variant="login" size="large" />
            </div>
            
            {/* Tagline Text - Admin */}
            <div className="text-center mt-6 xl:mt-8 space-y-3 xl:space-y-4">
              <h1 className="text-2xl xl:text-3xl 2xl:text-4xl font-bold text-neutral-800 dark:text-white leading-tight">
                Portal{" "}
                <span className="bg-gradient-to-r from-[#7CE0A8] to-[#5AB894] bg-clip-text text-transparent">
                  Admin
                </span>{" "}
                Marijasa
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 text-base xl:text-lg">
                Kelola platform dengan aman dan efisien
              </p>
              
              {/* Feature badges - Admin */}
              <div className="flex flex-wrap justify-center gap-2 xl:gap-3 mt-4 xl:mt-6">
                <div className="flex items-center gap-2 px-3 xl:px-4 py-1.5 xl:py-2 bg-white/80 dark:bg-neutral-800/80 rounded-full shadow-sm backdrop-blur-sm">
                  <span className="text-base xl:text-lg">🔐</span>
                  <span className="text-xs xl:text-sm font-medium text-neutral-700 dark:text-neutral-300">Akses Terkontrol</span>
                </div>
                <div className="flex items-center gap-2 px-3 xl:px-4 py-1.5 xl:py-2 bg-white/80 dark:bg-neutral-800/80 rounded-full shadow-sm backdrop-blur-sm">
                  <span className="text-base xl:text-lg">📊</span>
                  <span className="text-xs xl:text-sm font-medium text-neutral-700 dark:text-neutral-300">Analitik Lengkap</span>
                </div>
                <div className="flex items-center gap-2 px-3 xl:px-4 py-1.5 xl:py-2 bg-white/80 dark:bg-neutral-800/80 rounded-full shadow-sm backdrop-blur-sm">
                  <span className="text-base xl:text-lg">⚙️</span>
                  <span className="text-xs xl:text-sm font-medium text-neutral-700 dark:text-neutral-300">Manajemen Sistem</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form (All screen sizes) */}
          <div className="w-full max-w-[360px] sm:max-w-sm md:max-w-md lg:max-w-md flex-shrink-0">
            
            {/* Mobile/Tablet Header Section */}
            <div className="lg:hidden flex flex-col items-center mb-4 sm:mb-6">
              {/* Character - Smaller on mobile */}
              <div className="w-28 h-32 xs:w-32 xs:h-36 sm:w-40 sm:h-44 md:w-48 md:h-52 mb-3 sm:mb-4">
                <AnimatedCharacter variant="login" size="small" />
              </div>
              
              {/* Tagline - Admin Mobile */}
              <h1 className="text-xl xs:text-2xl sm:text-2xl md:text-3xl font-bold text-neutral-800 dark:text-white text-center leading-tight">
                Portal{" "}
                <span className="bg-gradient-to-r from-[#7CE0A8] to-[#5AB894] bg-clip-text text-transparent">
                  Admin
                </span>{" "}
                Marijasa
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm md:text-base mt-2 text-center">
                Kelola platform dengan aman
              </p>
            </div>

            {/* Login Form - Admin */}
            <LoginForm userType="admin" />

            {/* Bottom decoration */}
            <div className="mt-6 sm:mt-8 text-center">
              <p className="text-[10px] xs:text-xs text-neutral-500 dark:text-neutral-500 flex items-center justify-center gap-2">
                <span className="w-6 sm:w-8 h-px bg-gradient-to-r from-transparent to-[#7CE0A8]"></span>
                <span>Akses Terbatas • Sistem Terenkripsi</span>
                <span className="w-6 sm:w-8 h-px bg-gradient-to-l from-transparent to-[#7CE0A8]"></span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh w-full items-center justify-center p-4 sm:p-6 md:p-10">
          <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12">
            {/* Skeleton for character - desktop only */}
            <div className="hidden lg:flex flex-1 items-center justify-center">
              <div className="w-64 h-72 bg-neutral-200 dark:bg-neutral-800 rounded-full animate-pulse"></div>
            </div>
            {/* Skeleton for form */}
            <div className="w-full max-w-sm">
              {/* Mobile character skeleton */}
              <div className="lg:hidden flex justify-center mb-4">
                <div className="w-32 h-36 bg-neutral-200 dark:bg-neutral-800 rounded-full animate-pulse"></div>
              </div>
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4 mx-auto lg:mx-0"></div>
                <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-full"></div>
                <div className="h-12 bg-neutral-200 dark:bg-neutral-800 rounded w-full"></div>
                <div className="h-12 bg-neutral-200 dark:bg-neutral-800 rounded w-full"></div>
                <div className="h-12 bg-neutral-200 dark:bg-neutral-800 rounded w-full"></div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}