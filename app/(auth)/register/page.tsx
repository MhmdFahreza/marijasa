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

      <div className="relative z-10 min-h-svh w-full overflow-x-hidden">
        {/* Main Container */}
        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center lg:items-start justify-center min-h-svh px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 lg:py-4 gap-6 lg:gap-12 xl:gap-16">
          
          {/* Left Side - Character & Text (Desktop only - lg and up) */}
          <div className="hidden lg:flex flex-col items-center lg:sticky lg:top-4 flex-1 max-w-lg xl:max-w-xl pt-2">
            {/* Character Animation - Large size */}
            <div className="relative w-full max-w-sm xl:max-w-md">
              <AnimatedCharacter variant="register" size="large" />
            </div>
            
            {/* Tagline Text */}
            <div className="text-center mt-4 xl:mt-6 space-y-3 xl:space-y-4">
              <h1 className="text-2xl xl:text-3xl 2xl:text-4xl font-bold text-neutral-800 dark:text-white leading-tight">
                Bergabung dengan{" "}
                <span className="bg-gradient-to-r from-[#7CE0A8] to-[#5AB894] bg-clip-text text-transparent">
                  Marijasa
                </span>
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 text-base xl:text-lg">
                Daftar sekarang dan nikmati berbagai kemudahan layanan kami
              </p>
              
              {/* Benefits list */}
              <div className="flex flex-col gap-2.5 xl:gap-3 mt-4 xl:mt-5 text-left">
                <div className="flex items-center gap-3 px-3 xl:px-4 py-2.5 xl:py-3 bg-white/80 dark:bg-neutral-800/80 rounded-xl shadow-sm backdrop-blur-sm">
                  <div className="w-8 h-8 xl:w-10 xl:h-10 rounded-full bg-gradient-to-br from-[#7CE0A8] to-[#5AB894] flex items-center justify-center text-white text-sm xl:text-base flex-shrink-0">
                    ✓
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-800 dark:text-white text-sm xl:text-base">Gratis Pendaftaran</p>
                    <p className="text-xs xl:text-sm text-neutral-500 dark:text-neutral-400">Tanpa biaya apapun</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-3 xl:px-4 py-2.5 xl:py-3 bg-white/80 dark:bg-neutral-800/80 rounded-xl shadow-sm backdrop-blur-sm">
                  <div className="w-8 h-8 xl:w-10 xl:h-10 rounded-full bg-gradient-to-br from-[#7CE0A8] to-[#5AB894] flex items-center justify-center text-white text-sm xl:text-base flex-shrink-0">
                    ⚡
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-800 dark:text-white text-sm xl:text-base">Proses Cepat</p>
                    <p className="text-xs xl:text-sm text-neutral-500 dark:text-neutral-400">Verifikasi dalam hitungan detik</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-3 xl:px-4 py-2.5 xl:py-3 bg-white/80 dark:bg-neutral-800/80 rounded-xl shadow-sm backdrop-blur-sm">
                  <div className="w-8 h-8 xl:w-10 xl:h-10 rounded-full bg-gradient-to-br from-[#7CE0A8] to-[#5AB894] flex items-center justify-center text-white text-sm xl:text-base flex-shrink-0">
                    🛡️
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-800 dark:text-white text-sm xl:text-base">Data Terjaga</p>
                    <p className="text-xs xl:text-sm text-neutral-500 dark:text-neutral-400">Privasi Anda kami utamakan</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-3 xl:px-4 py-2.5 xl:py-3 bg-white/80 dark:bg-neutral-800/80 rounded-xl shadow-sm backdrop-blur-sm">
                  <div className="w-8 h-8 xl:w-10 xl:h-10 rounded-full bg-gradient-to-br from-[#7CE0A8] to-[#5AB894] flex items-center justify-center text-white text-sm xl:text-base flex-shrink-0">
                    ✨
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-800 dark:text-white text-sm xl:text-base">Mudah Digunakan</p>
                    <p className="text-xs xl:text-sm text-neutral-500 dark:text-neutral-400">Tampilan simpel dan jelas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-3 xl:px-4 py-2.5 xl:py-3 bg-white/80 dark:bg-neutral-800/80 rounded-xl shadow-sm backdrop-blur-sm">
                  <div className="w-8 h-8 xl:w-10 xl:h-10 rounded-full bg-gradient-to-br from-[#7CE0A8] to-[#5AB894] flex items-center justify-center text-white text-sm xl:text-base flex-shrink-0">
                    🤖
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-800 dark:text-white text-sm xl:text-base">AI Siap Bantu</p>
                    <p className="text-xs xl:text-sm text-neutral-500 dark:text-neutral-400">Konsultasi awal untuk kamu</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form (All screen sizes) */}
          <div className="w-full max-w-[360px] sm:max-w-sm md:max-w-md lg:max-w-md flex-shrink-0 lg:pt-0">
            
            {/* Mobile/Tablet Header Section */}
            <div className="lg:hidden flex flex-col items-center mb-4 sm:mb-6">
              {/* Character - Smaller on mobile */}
              <div className="w-28 h-32 xs:w-32 xs:h-36 sm:w-40 sm:h-44 md:w-48 md:h-52 mb-3 sm:mb-4">
                <AnimatedCharacter variant="register" size="small" />
              </div>
              
              {/* Tagline */}
              <h1 className="text-xl xs:text-2xl sm:text-2xl md:text-3xl font-bold text-neutral-800 dark:text-white text-center leading-tight">
                Bergabung dengan{" "}
                <span className="bg-gradient-to-r from-[#7CE0A8] to-[#5AB894] bg-clip-text text-transparent">
                  Marijasa
                </span>
              </h1>
            </div>

            {/* Signup Form */}
            <SignupForm />

            {/* Bottom decoration */}
            <div className="mt-6 sm:mt-8 text-center">
              <p className="text-[10px] xs:text-xs text-neutral-500 dark:text-neutral-500 flex items-center justify-center gap-2">
                <span className="w-6 sm:w-8 h-px bg-gradient-to-r from-transparent to-[#7CE0A8]"></span>
                <span>Proses Instan & Aman</span>
                <span className="w-6 sm:w-8 h-px bg-gradient-to-l from-transparent to-[#7CE0A8]"></span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}