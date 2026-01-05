"use client";

import { LoginForm } from "@/app/components/ui/login-form";
import { AnimatedBackground, AnimatedCharacter } from "@/app/components/ui/animated-background";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const router = useRouter();

  useEffect(() => {
    window.history.replaceState(null, "", window.location.href);
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      router.replace("/");
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router]);

  return (
    <>
      <AnimatedBackground variant="login" />

      <div className="relative z-10 flex min-h-svh w-full">
        {/* Main Container - Centered with max width */}
        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 p-6 md:p-10">
          
          {/* Left Side - Character & Text (Hidden on mobile, visible on lg+) */}
          <div className="hidden lg:flex flex-col items-center justify-center flex-1 max-w-lg xl:max-w-xl">
            {/* Character Animation */}
            <div className="relative w-full aspect-square max-w-md">
              <AnimatedCharacter variant="login" />
            </div>
            
            {/* Tagline Text */}
            <div className="text-center mt-8 space-y-4">
              <h1 className="text-3xl xl:text-4xl font-bold text-neutral-800 dark:text-white leading-tight">
                Selamat Datang di{" "}
                <span className="bg-gradient-to-r from-[#7CE0A8] to-[#5AB894] bg-clip-text text-transparent">
                  Marijasa
                </span>
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 text-lg">
                Platform terpercaya untuk semua kebutuhan Anda
              </p>
              
              {/* Feature badges */}
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-neutral-800/80 rounded-full shadow-sm backdrop-blur-sm">
                  <span className="text-lg">🔒</span>
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Aman</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-neutral-800/80 rounded-full shadow-sm backdrop-blur-sm">
                  <span className="text-lg">⚡</span>
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Cepat</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-neutral-800/80 rounded-full shadow-sm backdrop-blur-sm">
                  <span className="text-lg">💯</span>
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Terpercaya</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-full max-w-sm lg:max-w-md flex-shrink-0">
            {/* Mobile Character (visible only on smaller screens) */}
            <div className="lg:hidden flex justify-center mb-6">
              <div className="w-48 h-48 sm:w-56 sm:h-56">
                <AnimatedCharacter variant="login" />
              </div>
            </div>

            {/* Mobile Tagline */}
            <div className="lg:hidden text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800 dark:text-white">
                Selamat Datang di{" "}
                <span className="bg-gradient-to-r from-[#7CE0A8] to-[#5AB894] bg-clip-text text-transparent">
                  Marijasa
                </span>
              </h1>
            </div>

            <LoginForm userType="user" />

            {/* Decorative bottom element */}
            <div className="mt-8 text-center">
              <p className="text-xs text-neutral-500 dark:text-neutral-500 flex items-center justify-center gap-2">
                <span className="w-8 h-px bg-gradient-to-r from-transparent to-[#7CE0A8]"></span>
                <span>Aman & Terenkripsi</span>
                <span className="w-8 h-px bg-gradient-to-l from-transparent to-[#7CE0A8]"></span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-8">
            {/* Skeleton for character */}
            <div className="hidden lg:flex flex-1 items-center justify-center">
              <div className="w-80 h-80 bg-neutral-200 dark:bg-neutral-800 rounded-full animate-pulse"></div>
            </div>
            {/* Skeleton for form */}
            <div className="w-full max-w-sm">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4"></div>
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
      <LoginContent />
    </Suspense>
  );
}