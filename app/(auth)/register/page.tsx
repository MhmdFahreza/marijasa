"use client";

import { SignupForm } from "@/app/components/ui/signup-form";
import { AnimatedBackground, AnimatedCharacter } from "@/app/components/ui/animated-background";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    window.history.replaceState(null, "", window.location.href);
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      router.replace("/");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [router]);

  return (
    <>
      <AnimatedBackground variant="register" />

      <div className="relative z-10 flex min-h-svh w-full">
        {/* Main Container - Centered with max width */}
        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 p-6 md:p-10">
          
          {/* Left Side - Character & Text (Hidden on mobile, visible on lg+) */}
          <div className="hidden lg:flex flex-col items-center justify-center flex-1 max-w-lg xl:max-w-xl">
            {/* Character Animation */}
            <div className="relative w-full aspect-square max-w-md">
              <AnimatedCharacter variant="register" />
            </div>
            
            {/* Tagline Text */}
            <div className="text-center mt-8 space-y-4">
              <h1 className="text-3xl xl:text-4xl font-bold text-neutral-800 dark:text-white leading-tight">
                Bergabung dengan{" "}
                <span className="bg-gradient-to-r from-[#7CE0A8] to-[#5AB894] bg-clip-text text-transparent">
                  Marijasa
                </span>
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 text-lg">
                Daftar sekarang dan nikmati berbagai kemudahan layanan kami
              </p>
              
              {/* Benefits list */}
              <div className="flex flex-col gap-3 mt-6 text-left">
                <div className="flex items-center gap-3 px-4 py-3 bg-white/80 dark:bg-neutral-800/80 rounded-xl shadow-sm backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7CE0A8] to-[#5AB894] flex items-center justify-center text-white text-lg">
                    ✓
                  </div>
                  <div>
                    <p className="font-medium text-neutral-800 dark:text-white">Gratis Pendaftaran</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Tanpa biaya apapun</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 bg-white/80 dark:bg-neutral-800/80 rounded-xl shadow-sm backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7CE0A8] to-[#5AB894] flex items-center justify-center text-white text-lg">
                    ⚡
                  </div>
                  <div>
                    <p className="font-medium text-neutral-800 dark:text-white">Proses Cepat</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Verifikasi dalam hitungan detik</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 bg-white/80 dark:bg-neutral-800/80 rounded-xl shadow-sm backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7CE0A8] to-[#5AB894] flex items-center justify-center text-white text-lg">
                    🎁
                  </div>
                  <div>
                    <p className="font-medium text-neutral-800 dark:text-white">Bonus Member Baru</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Dapatkan penawaran eksklusif</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-full max-w-sm lg:max-w-md flex-shrink-0">
            {/* Mobile Character (visible only on smaller screens) */}
            <div className="lg:hidden flex justify-center mb-6">
              <div className="w-48 h-48 sm:w-56 sm:h-56">
                <AnimatedCharacter variant="register" />
              </div>
            </div>

            {/* Mobile Tagline */}
            <div className="lg:hidden text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800 dark:text-white">
                Bergabung dengan{" "}
                <span className="bg-gradient-to-r from-[#7CE0A8] to-[#5AB894] bg-clip-text text-transparent">
                  Marijasa
                </span>
              </h1>
            </div>

            <SignupForm />

            {/* Decorative bottom element */}
            <div className="mt-8 text-center">
              <p className="text-xs text-neutral-500 dark:text-neutral-500 flex items-center justify-center gap-2">
                <span className="w-8 h-px bg-gradient-to-r from-transparent to-[#7CE0A8]"></span>
                <span>Proses Instan & Aman</span>
                <span className="w-8 h-px bg-gradient-to-l from-transparent to-[#7CE0A8]"></span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}