// app/components/ui/login-form.tsx
"use client";

import { cn } from "../lib/utils";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LoaderTwo } from "@/app/components/transition/loader";
import { signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/components/contexts/AuthContext";

type UserType = "user" | "mitra" | "admin";

interface LoginFormProps extends React.ComponentProps<"div"> {
  userType?: UserType;
  onSuccess?: (email: string) => void;
  onRegisterClick?: () => void;
}

// Error messages mapping
const ERROR_MESSAGES: Record<string, string> = {
  USER_NOT_REGISTERED:
    "Email Google Anda belum terdaftar. Silakan daftar terlebih dahulu.",
  ACCOUNT_INACTIVE: "Akun Anda tidak aktif. Silakan hubungi admin.",
  NO_EMAIL:
    "Tidak dapat mengambil email dari akun Google. Silakan coba lagi.",
  NO_SESSION:
    "Tidak dapat membuat sesi. Silakan coba lagi.",
  SESSION_ERROR:
    "Terjadi kesalahan pada sesi. Silakan coba lagi.",
  CALLBACK_ERROR:
    "Terjadi kesalahan saat memproses login. Silakan coba lagi.",
  GOOGLE_SIGNIN_ERROR:
    "Terjadi kesalahan saat login dengan Google. Silakan coba lagi.",
  OAuthAccountNotLinked:
    "Email ini sudah terdaftar dengan metode login lain. Silakan gunakan metode login yang sesuai.",
  OAuthSignin:
    "Terjadi kesalahan saat memulai login Google. Silakan coba lagi.",
  OAuthCallback:
    "Terjadi kesalahan saat memproses login Google. Silakan coba lagi.",
  Callback: "Terjadi kesalahan saat memproses login. Silakan coba lagi.",
  AccessDenied: "Akses ditolak. Silakan coba lagi.",
  Configuration: "Terjadi kesalahan konfigurasi. Silakan hubungi admin.",
  default: "Terjadi kesalahan. Silakan coba lagi.",
};

export function LoginForm({
  className,
  userType = "user",
  onSuccess,
  onRegisterClick,
  ...props
}: LoginFormProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { login: authLogin, refreshUser } = useAuth();

  // User config
  const userConfig = {
    user: {
      title: "Selamat Datang Kembali",
      description: "Masukkan email atau nomor telepon untuk melanjutkan",
      registerLink: "/register",
      registerText: "Daftar",
      icon: "👋",
    },
    mitra: {
      title: "Portal Mitra Bijak",
      description: "Akses dashboard penjualan Anda",
      registerLink: null,
      registerText: null,
      icon: "🏢",
    },
    admin: {
      title: "Admin Dashboard",
      description: "Kelola platform dengan aman",
      registerLink: null,
      registerText: null,
      icon: "🔐",
    },
  };

  const config = userConfig[userType];

  // Check for existing session on mount - ONLY FOR USER TYPE
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Skip session check for mitra and admin - they use different auth
        if (userType === "mitra" || userType === "admin") {
          setIsCheckingSession(false);
          return;
        }

        // Only check session for user type
        if (status === "loading") {
          return;
        }

        // Check for error from URL (OAuth error)
        const errorParam = searchParams?.get("error");
        if (errorParam) {
          setIsCheckingSession(false);
          return;
        }

        // If authenticated via NextAuth session (Google OAuth) - only for user type
        if (status === "authenticated" && session?.user && userType === "user") {
          const userEmail = session.user.email;
          const userId = (session.user as any).id;

          console.log("[Login] NextAuth session found for user:", {
            email: userEmail,
            userId: userId
          });

          if (!userEmail || !userId) {
            setIsCheckingSession(false);
            return;
          }

          // For user type, redirect or call onSuccess
          if (onSuccess) {
            onSuccess(userEmail);
          } else {
            router.push("/");
            router.refresh();
          }
          return;
        }

        setIsCheckingSession(false);
      } catch (error) {
        console.error("Error checking session:", error);
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, [status, session, router, onSuccess, searchParams, userType]);

  // Check for error from URL
  useEffect(() => {
    const errorParam = searchParams?.get("error");
    if (errorParam) {
      const errorMessage =
        ERROR_MESSAGES[errorParam] || ERROR_MESSAGES["default"];
      setError(errorMessage);
      setIsGoogleLoading(false);

      // Clear error from URL
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{7,11}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ""));
  };

  const normalizePhone = (phone: string): string => {
    let cleaned = phone.replace(/[\s-]/g, "");
    if (cleaned.startsWith("08")) {
      cleaned = "+62" + cleaned.substring(1);
    } else if (cleaned.startsWith("62")) {
      cleaned = "+" + cleaned;
    } else if (!cleaned.startsWith("+62")) {
      cleaned = "+62" + cleaned;
    }
    return cleaned;
  };

  const isEmailInput = (input: string): boolean => {
    return input.includes("@");
  };

  // Google Sign In handler - only for user type
  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setError(null);

      console.log("[Login] Starting Google sign in...");

      // Sign in with Google and redirect to custom callback
      await signIn("google", {
        callbackUrl: "/api/auth/google/set-cookies",
        redirect: true,
      });
    } catch (error) {
      console.error("Google sign in error:", error);
      setError("Terjadi kesalahan saat login dengan Google. Silakan coba lagi.");
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedIdentifier = identifier.trim();
    const isEmail = isEmailInput(trimmedIdentifier);

    // Validation for user type
    if (userType === "user") {
      if (isEmail) {
        if (!validateEmail(trimmedIdentifier)) {
          setError(
            "Format email tidak valid. Gunakan format email yang benar (contoh: user@example.com)"
          );
          return;
        }
      } else {
        if (!validatePhone(trimmedIdentifier)) {
          setError(
            "Format nomor telepon tidak valid. Gunakan format Indonesia (contoh: 081234567890)"
          );
          return;
        }
      }
    } else {
      // For admin and mitra, must be email
      if (!validateEmail(trimmedIdentifier)) {
        setError("Format email tidak valid.");
        return;
      }
    }

    if (password.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }

    // Admin login
    if (userType === "admin") {
      setIsLoading(true);

      try {
        console.log('[Admin Login] Attempting login for:', trimmedIdentifier);

        const response = await fetch('/api/admin/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            email: trimmedIdentifier.toLowerCase(),
            password: password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Email atau password salah');
          setIsLoading(false);
          return;
        }

        console.log('[Admin Login] Login successful:', {
          id: data.admin.id,
          name: data.admin.name,
          email: data.admin.email
        });

        if (onSuccess) {
          onSuccess(trimmedIdentifier);
          setIsLoading(false);
          return;
        }

        // Redirect to dashboard
        console.log('[Admin Login] Redirecting to dashboard...');
        window.location.href = "/admin/dashboard";
      } catch (error) {
        console.error("Admin login error:", error);
        setError("Terjadi kesalahan saat login. Silakan coba lagi.");
        setIsLoading(false);
      }

      return;
    }

    // Mitra login
    if (userType === "mitra") {
      setIsLoading(true);

      try {
        console.log('[Mitra Login] Attempting login for:', trimmedIdentifier);

        const response = await fetch('/api/mitra/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            email: trimmedIdentifier,
            password: password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Email atau password salah');
          setIsLoading(false);
          return;
        }

        console.log('[Mitra Login] Login successful:', {
          id: data.vendor.id,
          name: data.vendor.name,
          email: data.vendor.email
        });

        if (onSuccess) {
          onSuccess(trimmedIdentifier);
          setIsLoading(false);
          return;
        }

        // Redirect to dashboard
        console.log('[Mitra Login] Redirecting to dashboard...');
        window.location.href = "/mitra/dashboard";
      } catch (error) {
        console.error("Mitra login error:", error);
        setError("Terjadi kesalahan saat login. Silakan coba lagi.");
        setIsLoading(false);
      }

      return;
    }

    // User login via API (only for user type)
    setIsLoading(true);

    try {
      let normalizedIdentifier = trimmedIdentifier;
      if (!isEmail) {
        normalizedIdentifier = normalizePhone(trimmedIdentifier);
      }

      console.log("[Login] Attempting login for:", normalizedIdentifier);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          identifier: isEmail
            ? normalizedIdentifier.toLowerCase()
            : normalizedIdentifier,
          password: password,
          isEmail: isEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        switch (data.errorType) {
          case "EMAIL_NOT_REGISTERED":
            setError("Email belum terdaftar. Silakan daftar terlebih dahulu.");
            break;
          case "PHONE_NOT_REGISTERED":
            setError(
              "Nomor telepon belum terdaftar. Silakan daftar terlebih dahulu."
            );
            break;
          case "GOOGLE_ACCOUNT":
            setError(
              "Akun ini terdaftar melalui Google. Silakan login dengan Google."
            );
            break;
          case "EMAIL_NOT_VERIFIED":
            setError(
              "Email belum diverifikasi. Silakan verifikasi email Anda terlebih dahulu."
            );
            break;
          case "ACCOUNT_INACTIVE":
            setError("Akun Anda tidak aktif. Silakan hubungi admin.");
            break;
          case "INVALID_PASSWORD":
            setError("Password salah. Silakan coba lagi.");
            break;
          default:
            setError(data.message || "Terjadi kesalahan saat login");
        }
        setIsLoading(false);
        return;
      }

      // Login successful
      console.log("[Login] Login successful for:", data.user?.email);

      // Update AuthContext immediately
      if (data.user) {
        authLogin(data.user);
      }

      // CRITICAL: Refresh user data to ensure we have latest from database
      await refreshUser();

      if (onSuccess) {
        // Call onSuccess callback
        onSuccess(data.user?.email || trimmedIdentifier);
        setIsLoading(false);
        return;
      }

      // If no onSuccess, redirect to home
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      setError("Terjadi kesalahan saat login. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  const handleRegisterLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onRegisterClick) {
      onRegisterClick();
    } else {
      router.push("/register");
    }
  };

  // Show loading while checking session - ONLY FOR USER TYPE
  if (isCheckingSession && userType === "user") {
    return (
      <div className="flex flex-col gap-4 sm:gap-6">
        <Card className="shadow-lg">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">{config.title}</CardTitle>
            <CardDescription className="text-sm">{config.description}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-center py-8 sm:py-12">
              <LoaderTwo />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4 sm:gap-5", className)} {...props}>
      <Card className="relative shadow-2xl overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 dark:from-neutral-900 dark:to-neutral-950">
        {/* Decorative gradient background */}
        <div className="absolute top-0 right-0 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-gradient-to-br from-[#7CE0A8]/5 to-transparent rounded-full -z-0 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 sm:-bottom-32 sm:-left-32 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-gradient-to-tr from-[#7CE0A8]/5 to-transparent rounded-full -z-0 blur-3xl"></div>

        <CardHeader className="relative z-10 p-3 sm:p-4 md:p-5 pb-3 sm:pb-4 md:pb-5">
          <div className="flex items-start justify-between gap-3 sm:gap-4 mb-1 sm:mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                <span className="text-xl sm:text-2xl md:text-3xl">{config.icon}</span>
                <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-700 dark:from-white dark:via-neutral-100 dark:to-neutral-300 bg-clip-text text-transparent">
                  {config.title}
                </CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                {config.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 p-3 sm:p-4 md:p-5">
          {/* Error Alert */}
          {error && (
            <div className="mb-3 sm:mb-4 md:mb-5 p-3 sm:p-4 bg-gradient-to-r from-red-50 to-red-50/50 dark:from-red-950/30 dark:to-red-950/10 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg sm:rounded-xl text-xs sm:text-sm flex items-start justify-between gap-2 sm:gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-2 sm:gap-3 flex-1">
                <span className="text-base sm:text-lg font-bold flex-shrink-0 mt-0.5">⚠️</span>
                <span className="pt-0.5">{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex-shrink-0 hover:bg-red-100 dark:hover:bg-red-900/30 p-1 rounded-full transition-colors"
                aria-label="Tutup pesan error"
              >
                ✕
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-5">
            <FieldGroup className="space-y-3 sm:space-y-4 md:space-y-5">
              {/* Email/Phone Field */}
              <Field className="space-y-1.5 sm:space-y-2">
                <FieldLabel
                  htmlFor="identifier"
                  className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 sm:gap-2"
                >
                  <span className="text-sm sm:text-base">📧</span>
                  {userType === "user" ? "Email atau Nomor Telepon" : "Email"}
                </FieldLabel>
                <div className="relative group">
                  <Input
                    id="identifier"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    onFocus={() => setFocusedField("identifier")}
                    onBlur={() => setFocusedField(null)}
                    placeholder={
                      userType === "admin"
                        ? "admin@example.com"
                        : userType === "mitra"
                          ? "mitra@example.com"
                          : "Email atau Nomor Telepon"
                    }
                    autoComplete="email"
                    disabled={isLoading || isGoogleLoading}
                    className={cn(
                      "transition-all duration-300 pl-3 pr-3 py-2 sm:pl-4 sm:pr-4 sm:py-2.5 md:py-3 rounded-lg text-sm sm:text-base",
                      "border-2 border-neutral-200 dark:border-neutral-700",
                      "focus:border-[#7CE0A8] focus:ring-2 focus:ring-[#7CE0A8]/20",
                      "dark:focus:border-[#7CE0A8]",
                      "bg-white dark:bg-neutral-800",
                      focusedField === "identifier" && "border-[#7CE0A8] ring-2 ring-[#7CE0A8]/20"
                    )}
                  />
                </div>
                {userType === "user" && (
                  <p className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-500 flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-2">
                    <span>ℹ️</span>
                    Gunakan email atau nomor telepon yang terdaftar
                  </p>
                )}
              </Field>

              {/* Password Field */}
              <Field className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between">
                  <FieldLabel
                    htmlFor="password"
                    className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 sm:gap-2"
                  >
                    <span className="text-sm sm:text-base">🔐</span>
                    Password
                  </FieldLabel>
                  {userType !== "admin" && userType !== "mitra" && (
                    <a
                      href="/forget-password"
                      className="inline-block text-[10px] sm:text-xs md:text-sm text-[#7CE0A8] hover:text-[#6bcb96] underline-offset-4 hover:underline transition-colors font-medium"
                    >
                      Lupa password?
                    </a>
                  )}
                </div>
                <div className="relative group">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="minimal 8 karakter"
                    autoComplete="current-password"
                    disabled={isLoading || isGoogleLoading}
                    className={cn(
                      "transition-all duration-300 pl-3 pr-10 py-2 sm:pl-4 sm:pr-12 sm:py-2.5 md:py-3 rounded-lg w-full text-sm sm:text-base",
                      "border-2 border-neutral-200 dark:border-neutral-700",
                      "focus:border-[#7CE0A8] focus:ring-2 focus:ring-[#7CE0A8]/20",
                      "dark:focus:border-[#7CE0A8]",
                      "bg-white dark:bg-neutral-800",
                      focusedField === "password" && "border-[#7CE0A8] ring-2 ring-[#7CE0A8]/20"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors p-1 sm:p-1.5"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    <span className="text-sm sm:text-base">{showPassword ? "👁️" : "👁️‍🗨️"}</span>
                  </button>
                </div>
                <p className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-500 flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-2">
                  <span>ℹ️</span>
                  Password harus minimal 8 karakter
                </p>
              </Field>

              {/* Submit Button */}
              <Field className="pt-1 sm:pt-2">
                <Button
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  className={cn(
                    "w-full bg-gradient-to-r from-[#7CE0A8] to-[#5AB894] hover:from-[#6bcb96] hover:to-[#4ba383]",
                    "text-white font-semibold py-2.5 sm:py-3 rounded-lg text-sm sm:text-base",
                    "focus:ring-2 focus:ring-[#7CE0A8] focus:ring-offset-2 dark:focus:ring-offset-neutral-900",
                    "transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "hover:shadow-lg hover:shadow-[#7CE0A8]/30"
                  )}
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>Login Sekarang</span>
                    </>
                  )}
                </Button>

                {/* Divider - Google Login */}
                {userType === "user" && (
                  <>
                    <div className="relative my-4 sm:my-5 md:my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-neutral-300 dark:border-neutral-700" />
                      </div>
                      <div className="relative flex justify-center text-[10px] sm:text-xs uppercase">
                        <span className="bg-white dark:bg-neutral-900 px-2 sm:px-3 text-neutral-500 dark:text-neutral-400 font-medium">
                          atau lanjutkan dengan
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isLoading || isGoogleLoading}
                      className={cn(
                        "w-full border-2 border-[#7CE0A8]/30 hover:border-[#7CE0A8]",
                        "text-neutral-700 dark:text-neutral-300 hover:bg-[#7CE0A8]/5",
                        "transition-all duration-300 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base",
                        "flex items-center justify-center gap-2 sm:gap-3 font-medium",
                        "dark:hover:bg-[#7CE0A8]/10"
                      )}
                    >
                      {isGoogleLoading ? (
                        <>
                          <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-[#7CE0A8] border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs sm:text-sm">Menghubungkan ke Google...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                            <path
                              fill="currentColor"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="currentColor"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          <span className="text-xs sm:text-sm">Google</span>
                        </>
                      )}
                    </Button>
                  </>
                )}

                {/* Register Link */}
                {config.registerLink && (
                  <FieldDescription className="text-center mt-4 sm:mt-5 md:mt-6 text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm">
                    Belum punya akun?{" "}
                    <button
                      type="button"
                      onClick={handleRegisterLinkClick}
                      className="font-semibold text-[#7CE0A8] hover:text-[#6bcb96] underline-offset-4 hover:underline transition-colors"
                    >
                      {config.registerText}
                    </button>
                  </FieldDescription>
                )}
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {/* Security Info Footer */}
      <div className="mt-3 sm:mt-4 md:mt-6 pt-3 sm:pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-col xs:flex-row items-center justify-center gap-2 text-center">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="text-[10px] sm:text-xs">🔒</span>
            <p className="text-[10px] sm:text-[11px] md:text-xs text-neutral-600 dark:text-neutral-400">
              Data Anda dilindungi dengan enkripsi tingkat enterprise
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}