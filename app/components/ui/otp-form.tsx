// app/components/ui/otp-form.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { FieldDescription, FieldLabel } from "@/app/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/app/components/ui/input-otp";
import { cn } from "../lib/utils";
import { CheckCircle2, AlertCircle, Mail, ArrowLeft, Clock } from "lucide-react";
import { useAuth } from "@/app/components/contexts/AuthContext";

interface OTPFormProps {
  type?: "register" | "login" | "reset_password";
  email?: string;
  name?: string;
  [key: string]: any;
}

function SuccessModal({
  isOpen,
  onClose,
  message,
}: {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-300 mx-4">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full flex items-center justify-center mb-4 md:mb-6">
            <CheckCircle2 className="w-10 h-10 md:w-12 md:h-12 text-emerald-500" />
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white mb-3">
            Verifikasi Berhasil!
          </h2>

          <p className="text-neutral-600 dark:text-neutral-400 mb-6 md:mb-8 text-sm leading-relaxed">
            {message}
          </p>

          <Button
            onClick={onClose}
            className={cn(
              "w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium",
              "focus:ring-emerald-500 focus:ring-offset-2",
              "transition-all duration-200 shadow-lg hover:shadow-xl text-sm md:text-base"
            )}
          >
            Lanjutkan
          </Button>
        </div>
      </div>
    </div>
  );
}

export function OTPForm({ type = "register", email, name, ...props }: OTPFormProps) {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [remainingAttempts, setRemainingAttempts] = useState(5);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const emailFromParams = searchParams?.get("email") || email;

  const backPath =
    type === "reset_password" ? "/forget-password" : "/register";

  // Initialize and validate
  useEffect(() => {
    setIsMounted(true);

    if (!emailFromParams) {
      router.replace(backPath);
      return;
    }
  }, [emailFromParams, router, backPath]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      router.replace(backPath);
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router, backPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.length !== 6) {
      setError("Kode OTP harus 6 digit");
      return;
    }

    if (remainingAttempts <= 0) {
      setError("Terlalu banyak percobaan. Silakan minta kode OTP baru.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: emailFromParams,
          code: otp,
          type: type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
        }
        setError(data.message || "Kode OTP salah");
        setOtp("");
        setIsLoading(false);
        return;
      }

      // Jika register -> login otomatis (kode kamu sudah support data.user)
      if (data.user) {
        login(data.user);
      }

      setIsLoading(false);

      // INI YANG KAMU MINTA:
      // reset_password sukses -> langsung masuk /change-password
      if (type === "reset_password") {
        router.replace("/change-password");
        return;
      }

      // selain reset_password -> tampilkan modal sukses
      setShowSuccessModal(true);
    } catch (err) {
      console.error("OTP verification error:", err);
      setError("Terjadi kesalahan saat verifikasi. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;

    setError(null);
    setOtp("");
    setIsResending(true);

    try {
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailFromParams,
          type: type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429 && data.cooldownRemaining) {
          setCountdown(data.cooldownRemaining);
          setError(`Tunggu ${data.cooldownRemaining} detik sebelum meminta kode baru`);
        } else {
          setError(data.message || "Gagal mengirim ulang OTP");
        }
        setIsResending(false);
        return;
      }

      setCountdown(60);
      setRemainingAttempts(data.remainingAttempts || 5);
      setIsResending(false);
    } catch (err) {
      console.error("Resend OTP error:", err);
      setError("Gagal mengirim ulang OTP. Silakan coba lagi.");
      setIsResending(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);

    // register biasanya masuk homepage, kamu bisa ubah sesuai kebutuhan
    router.replace("/");
  };

  const handleBack = () => {
    router.replace(backPath);
  };

  // Loading skeleton
  if (!isMounted) {
    return (
      <Card {...props} className="border-0 shadow-xl mx-4">
        <CardHeader className="bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 px-4 py-6 md:px-6 md:py-8">
          <CardTitle className="text-lg md:text-xl">Verifikasi</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Memuat halaman verifikasi...
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="space-y-4 md:space-y-6">
            <div className="space-y-3">
              <div className="h-4 w-28 md:h-5 md:w-32 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />
              <div className="flex items-center gap-2 md:gap-2.5 justify-center">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-12 w-9 md:h-14 md:w-12 bg-gray-200 dark:bg-neutral-700 rounded-lg animate-pulse"
                  />
                ))}
              </div>
              <div className="h-3 w-56 md:h-4 md:w-64 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse mx-auto" />
            </div>
            <div className="space-y-3">
              <div className="h-10 md:h-11 bg-gray-200 dark:bg-neutral-700 rounded-lg animate-pulse" />
              <div className="h-3 w-40 md:h-4 md:w-48 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse mx-auto" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Modal hanya untuk register/login (reset_password redirect langsung) */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        message={
          type === "register"
            ? "Anda berhasil melakukan register akun. Selamat datang!"
            : "Verifikasi berhasil."
        }
      />

      <div className="w-full max-w-md mx-auto px-3 sm:px-4">
        <Card {...props} className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-neutral-800 dark:to-neutral-900 px-4 py-6 md:px-6 md:py-8 border-b border-emerald-100 dark:border-neutral-700">
            <div className="flex items-start justify-between gap-3 md:gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg md:text-2xl font-bold text-neutral-900 dark:text-white mb-1 md:mb-2 truncate">
                  Verifikasi Email
                </CardTitle>
                <CardDescription className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 break-words">
                  Kami telah mengirim kode 6 digit ke{" "}
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 break-all">
                    {emailFromParams || "email Anda"}
                  </span>
                </CardDescription>
              </div>
              <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 md:w-6 md:h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3">
              <Clock className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 min-w-0">
                <p className="font-semibold text-blue-900 dark:text-blue-300 text-xs md:text-sm">
                  Kode OTP berlaku selama 5 menit
                </p>
                <p className="text-blue-700 dark:text-blue-400 text-xs leading-relaxed">
                  Jika tidak menemukan email, periksa folder spam atau promosi.
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3 animate-in slide-in-from-top-2 duration-300">
                <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1 md:space-y-2 min-w-0">
                  <p className="text-red-700 dark:text-red-300 text-xs md:text-sm font-medium break-words">
                    {error}
                  </p>
                  {remainingAttempts > 0 && remainingAttempts < 5 && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Sisa percobaan:{" "}
                      <span className="font-semibold">{remainingAttempts}</span>
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-500 hover:text-red-700 dark:hover:text-red-300 flex-shrink-0 transition-colors text-sm"
                  aria-label="Tutup pesan error"
                >
                  ✕
                </button>
              </div>
            )}

            {remainingAttempts <= 2 && remainingAttempts > 0 && !error && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 md:p-4 flex items-center gap-2 md:gap-3 animate-in slide-in-from-top-2 duration-300">
                <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span className="text-amber-700 dark:text-amber-300 text-xs md:text-sm font-medium">
                  Sisa percobaan: <span className="font-bold">{remainingAttempts}</span>
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div className="space-y-2 md:space-y-3">
                <FieldLabel className="text-sm md:text-base font-semibold text-neutral-900 dark:text-white">
                  Kode Verifikasi
                </FieldLabel>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    id="otp"
                    required
                    value={otp}
                    onChange={(value) => {
                      setOtp(value);
                      if (error) setError(null);
                    }}
                    disabled={isLoading || remainingAttempts <= 0}
                    suppressHydrationWarning
                    containerClassName="gap-1.5 sm:gap-2 md:gap-3"
                  >
                    <InputOTPGroup className="gap-1.5 sm:gap-2 md:gap-3">
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <FieldDescription className="text-center text-xs text-neutral-500 dark:text-neutral-400">
                  Masukkan 6 digit yang dikirim ke email Anda
                </FieldDescription>
              </div>

              <Button
                type="submit"
                disabled={isLoading || otp.length !== 6 || remainingAttempts <= 0}
                className={cn(
                  "w-full h-10 md:h-11 text-sm md:text-base font-semibold rounded-lg",
                  "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white",
                  "focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-950",
                  "transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none",
                  "flex items-center justify-center gap-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <>
                    <div className="h-3 w-3 md:h-4 md:w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm md:text-base">Memverifikasi...</span>
                  </>
                ) : (
                  "Verifikasi"
                )}
              </Button>

              <div className="space-y-2 md:space-y-3 text-center">
                <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
                  Tidak menerima kode?{" "}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isLoading || isResending || countdown > 0}
                    className={cn(
                      "font-semibold transition-all duration-200 hover:underline focus:outline-none focus:underline text-xs md:text-sm",
                      countdown > 0 || isResending
                        ? "text-neutral-400 dark:text-neutral-600 cursor-not-allowed"
                        : "text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                    )}
                  >
                    {isResending
                      ? "Mengirim..."
                      : countdown > 0
                      ? `Kirim Ulang (${countdown}s)`
                      : "Kirim Ulang"}
                  </button>
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                disabled={isLoading}
                className={cn(
                  "w-full h-10 md:h-11 text-sm md:text-base font-medium rounded-lg",
                  "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800",
                  "transition-colors duration-200",
                  "flex items-center justify-center gap-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
                <span>Kembali</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
