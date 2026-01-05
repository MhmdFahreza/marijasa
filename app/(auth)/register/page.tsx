"use client";

import { SignupForm } from "@/app/components/ui/signup-form";
import { AnimatedBackground } from "@/app/components/ui/animated-background";
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

      <div className="relative z-10 flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          {/* Decorative element above form */}
          <div className="mb-8 text-center">
            <div className="inline-block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#7CE0A8] to-[#5AB894] rounded-2xl blur-xl opacity-30 animate-pulse"></div>
              </div>
            </div>
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
    </>
  );
}
