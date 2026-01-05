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
import { CheckCircle2, AlertCircle, Mail } from "lucide-react";
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
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 max-w-sm w-full shadow-xl animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-[#7CE0A8]/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-12 h-12 text-[#7CE0A8]" />
          </div>

          {/* Title */}
          <h2 className="text-xl font-semibold text-neutral-800 dark:text-white mb-2">
            Selamat!
          </h2>

          {/* Message */}
          <p className="text-neutral-600 dark:text-neutral-300 mb-6">{message}</p>

          {/* Button */}
          <Button
            onClick={onClose}
            className={cn(
              "w-full bg-[#7CE0A8] hover:bg-[#6bcb96] text-white",
              "focus:ring-[#7CE0A8] focus:ring-offset-2",
              "transition-colors duration-200"
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
  const [countdown, setCountdown] = useState(60); // Start with 60 seconds cooldown
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const emailFromParams = searchParams?.get("email") || email;
  const nameFromParams = searchParams?.get("name") || name;

  // Initialize and validate
  useEffect(() => {
    setIsMounted(true);

    // Validate email exists
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
        // Update remaining attempts if provided
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
        }

        setError(data.message || "Kode OTP salah");
        setOtp(""); // Clear OTP input on error
        setIsLoading(false);
        return;
      }

      // Success - login user with context
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
        // Handle cooldown from server
        if (response.status === 429 && data.cooldownRemaining) {
          setCountdown(data.cooldownRemaining);
          setError(`Tunggu ${data.cooldownRemaining} detik sebelum meminta kode baru`);
        } else {
          setError(data.message || "Gagal mengirim ulang OTP");
        }
        setIsResending(false);
        return;
      }

      // Success - reset countdown and attempts
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
      <Card {...props}>
        <CardHeader>
          <CardTitle>Verifikasi Email</CardTitle>
          <CardDescription>Kami mengirim kode 6 digit ke email Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="flex items-center gap-2.5">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-14 w-12 bg-gray-200 rounded-md animate-pulse"
                  />
                ))}
              </div>
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mx-auto" />
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

      <Card {...props}>
        <CardHeader>
          <CardTitle>Verifikasi Email</CardTitle>
          <CardDescription>
            Kami mengirim kode 6 digit ke{" "}
            <span className="font-medium text-[#7CE0A8]">
              {emailFromParams || "email Anda"}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Info Box */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-2">
            <Mail className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">Cek email Anda</p>
              <p className="text-blue-600">
                Kode OTP berlaku selama 5 menit. Periksa juga folder spam jika tidak
                menemukan email.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{error}</span>
                {remainingAttempts > 0 && remainingAttempts < 5 && (
                  <p className="mt-1 text-xs text-red-600">
                    Sisa percobaan: {remainingAttempts}
                  </p>
                )}
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 flex-shrink-0"
                aria-label="Tutup pesan error"
              >
                ✕
              </button>
            </div>
          )}

          {/* Attempts Warning */}
          {remainingAttempts <= 2 && remainingAttempts > 0 && !error && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-md text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>Sisa percobaan: {remainingAttempts}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="otp">Kode Verifikasi</FieldLabel>
                <InputOTP
                  maxLength={6}
                  id="otp"
                  required
                  value={otp}
                  onChange={(value) => setOtp(value)}
                  disabled={isLoading || remainingAttempts <= 0}
                  suppressHydrationWarning
                >
                  <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border">
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <FieldDescription>
                  Masukkan kode 6 digit yang dikirim ke email Anda.
                </FieldDescription>
              </Field>

              <FieldGroup>
                <Button
                  type="submit"
                  disabled={isLoading || otp.length !== 6 || remainingAttempts <= 0}
                  className={cn(
                    "w-full",
                    "bg-[#7CE0A8] hover:bg-[#6bcb96] text-white",
                    "focus:ring-[#7CE0A8] focus:ring-offset-2",
                    "transition-colors duration-200",
                    "flex items-center justify-center gap-2"
                  )}
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Memverifikasi...
                    </>
                  ) : (
                    "Verifikasi"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToRegister}
                  disabled={isLoading}
                  className="w-full mt-2"
                >
                  Kembali ke Daftar
                </Button>

                <FieldDescription className="text-center">
                  Tidak menerima kode?{" "}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isLoading || isResending || countdown > 0}
                    className={cn(
                      "font-medium hover:underline focus:outline-none focus:underline",
                      countdown > 0 || isResending
                        ? "text-neutral-400 cursor-not-allowed"
                        : "text-[#7CE0A8] hover:text-[#6bcb96]"
                    )}
                  >
                    {isResending
                      ? "Mengirim..."
                      : countdown > 0
                      ? `Kirim Ulang (${countdown}s)`
                      : "Kirim Ulang"}
                  </button>
                </FieldDescription>
              </FieldGroup>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </>
  );
}