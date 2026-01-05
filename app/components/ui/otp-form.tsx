// app/components/ui/otp-form.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/app/components/ui/field";
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

// Success Modal Component
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
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center text-center">
          {/* Success Icon */}
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <CheckCircle2 className="w-14 h-14 text-emerald-500" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
            Verifikasi Berhasil!
          </h2>

          {/* Message */}
          <p className="text-neutral-600 dark:text-neutral-400 mb-8 text-sm leading-relaxed">
            {message}
          </p>

          {/* Button */}
          <Button
            onClick={onClose}
            className={cn(
              "w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium",
              "focus:ring-emerald-500 focus:ring-offset-2",
              "transition-all duration-200 shadow-lg hover:shadow-xl"
            )}
          >
            Lanjutkan
          </Button>
        </div>
      </div>
    </div>
  );
}

export function OTPForm({
  type = "register",
  email,
  name,
  ...props
}: OTPFormProps) {
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
  const nameFromParams = searchParams?.get("name") || name;

  // Initialize and validate
  useEffect(() => {
    setIsMounted(true);

    if (!emailFromParams) {
      router.replace("/register");
      return;
    }
  }, [emailFromParams, router]);

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
      router.replace("/register");
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router]);

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
        headers: {
          "Content-Type": "application/json",
        },
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

      if (data.user) {
        login(data.user);
      }

      setIsLoading(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("OTP verification error:", error);
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
        headers: {
          "Content-Type": "application/json",
        },
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
    } catch (error) {
      console.error("Resend OTP error:", error);
      setError("Gagal mengirim ulang OTP. Silakan coba lagi.");
      setIsResending(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.replace("/");
  };

  const handleBackToRegister = () => {
    router.replace("/register");
  };

  // Loading skeleton
  if (!isMounted) {
    return (
      <Card {...props} className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 px-6 py-8">
          <CardTitle>Verifikasi Email</CardTitle>
          <CardDescription>Kami mengirim kode 6 digit ke email Anda.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="h-5 w-32 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />
              <div className="flex items-center gap-2.5 justify-center">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-14 w-12 bg-gray-200 dark:bg-neutral-700 rounded-lg animate-pulse"
                  />
                ))}
              </div>
              <div className="h-4 w-64 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />
            </div>
            <div className="space-y-3">
              <div className="h-11 bg-gray-200 dark:bg-neutral-700 rounded-lg animate-pulse" />
              <div className="h-4 w-48 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse mx-auto" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        message="Anda berhasil melakukan register akun. Selamat datang!"
      />

      <div className="w-full max-w-md mx-auto">
        <Card {...props} className="border-0 shadow-xl overflow-hidden">
          {/* Header with gradient */}
          <CardHeader className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-neutral-800 dark:to-neutral-900 px-6 py-8 border-b border-emerald-100 dark:border-neutral-700">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                  Verifikasi Email
                </CardTitle>
                <CardDescription className="text-sm text-neutral-600 dark:text-neutral-400">
                  Kami telah mengirim kode 6 digit ke{" "}
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {emailFromParams || "email Anda"}
                  </span>
                </CardDescription>
              </div>
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <Mail className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-blue-900 dark:text-blue-300 text-sm">
                  Kode OTP berlaku selama 5 menit
                </p>
                <p className="text-blue-700 dark:text-blue-400 text-xs leading-relaxed">
                  Jika tidak menemukan email, silakan periksa folder spam atau folder promosi.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
                  {remainingAttempts > 0 && remainingAttempts < 5 && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Sisa percobaan: <span className="font-semibold">{remainingAttempts}</span>
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-500 hover:text-red-700 dark:hover:text-red-300 flex-shrink-0 transition-colors"
                  aria-label="Tutup pesan error"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Attempts Warning */}
            {remainingAttempts <= 2 && remainingAttempts > 0 && !error && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span className="text-amber-700 dark:text-amber-300 text-sm font-medium">
                  Sisa percobaan: <span className="font-bold">{remainingAttempts}</span>
                </span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* OTP Input */}
              <div className="space-y-3">
                <FieldLabel className="text-base font-semibold text-neutral-900 dark:text-white">
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
                    containerClassName="gap-3"
                  >
                    <InputOTPGroup className="gap-3">
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

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || otp.length !== 6 || remainingAttempts <= 0}
                className={cn(
                  "w-full h-11 text-base font-semibold rounded-lg",
                  "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white",
                  "focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-950",
                  "transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none",
                  "flex items-center justify-center gap-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  "Verifikasi"
                )}
              </Button>

              {/* Resend OTP */}
              <div className="space-y-3 text-center">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Tidak menerima kode?{" "}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isLoading || isResending || countdown > 0}
                    className={cn(
                      "font-semibold transition-all duration-200 hover:underline focus:outline-none focus:underline",
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

              {/* Back Button */}
              <Button
                type="button"
                variant="ghost"
                onClick={handleBackToRegister}
                disabled={isLoading}
                className={cn(
                  "w-full h-11 text-base font-medium rounded-lg",
                  "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800",
                  "transition-colors duration-200",
                  "flex items-center justify-center gap-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Daftar</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}