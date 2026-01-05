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
import { validateVendorLogin, getCategoryFromTags } from "@/app/data/dataVendor";
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
  const [showRedirectLoader, setShowRedirectLoader] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { user, isAuthenticated, login } = useAuth();

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        if (status === "loading") {
          return;
        }

        // Check for error from URL (OAuth error)
        const errorParam = searchParams?.get("error");
        if (errorParam) {
          setIsCheckingSession(false);
          return;
        }

        // If already authenticated via AuthContext, redirect
        if (isAuthenticated && user) {
          if (onSuccess) {
            onSuccess(user.email);
          } else {
            setShowRedirectLoader(true);
            setTimeout(() => {
              router.push("/");
              router.refresh();
            }, 1000);
          }
          return;
        }

        // If authenticated via NextAuth session
        if (status === "authenticated" && session?.user) {
          const userEmail = session.user.email;
          const userId = (session.user as any).id;

          if (!userEmail || !userId) {
            setIsCheckingSession(false);
            return;
          }

          // Login via context
          login({
            id: userId,
            name: session.user.name || "",
            email: userEmail,
            phone: (session.user as any).phone || "",
            avatar: session.user.image || "/profile.svg",
            role: (session.user as any).role || "USER",
          });

          if (onSuccess) {
            onSuccess(userEmail);
          } else {
            setShowRedirectLoader(true);
            setTimeout(() => {
              router.push("/");
              router.refresh();
            }, 1000);
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
  }, [status, session, router, onSuccess, searchParams, isAuthenticated, user, login]);

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

  // Google Sign In handler
  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setError(null);

      await signIn("google", {
        callbackUrl: "/",
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

    // Validation
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

    if (password.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }

    // Admin validation (if still needed)
    if (userType === "admin") {
      const dummyAdminCredentials = [
        { email: "Marijasa@gmail.com", password: "admin1234" },
      ];

      const isValid = dummyAdminCredentials.some(
        (cred) =>
          cred.email === trimmedIdentifier && cred.password === password
      );

      if (!isValid) {
        setError("Email atau password admin salah.");
        return;
      }
    }

    // Mitra validation
    if (userType === "mitra") {
      const vendor = validateVendorLogin(trimmedIdentifier, password);

      if (!vendor) {
        setError(
          "Email atau password mitra salah. Pastikan Anda menggunakan kredensial yang benar."
        );
        return;
      }

      setIsLoading(true);

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const category = getCategoryFromTags(vendor.tags);

        if (onSuccess) {
          onSuccess(trimmedIdentifier);
          setIsLoading(false);
          return;
        }

        setShowRedirectLoader(true);
        setTimeout(() => {
          router.push("/mitra/dashboard");
          router.refresh();
        }, 1000);
      } catch (error) {
        console.error("Login error:", error);
        setError("Terjadi kesalahan saat login. Silakan coba lagi.");
        setIsLoading(false);
      }

      return;
    }

    // User login via API
    setIsLoading(true);

    try {
      let normalizedIdentifier = trimmedIdentifier;
      if (!isEmail) {
        normalizedIdentifier = normalizePhone(trimmedIdentifier);
      }

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

      // Login successful - update context
      if (data.user) {
        login(data.user);
      }

      if (onSuccess) {
        onSuccess(data.user.email);
        setIsLoading(false);
        return;
      }

      setShowRedirectLoader(true);
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1000);
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

  const getRedirectLoaderText = () => {
    if (userType === "admin") {
      return {
        title: "Login Berhasil! ✓",
        message: "Mengarahkan ke dashboard admin...",
      };
    } else if (userType === "mitra") {
      return {
        title: "Login Berhasil! ✓",
        message: "Mengarahkan ke dashboard mitra...",
      };
    }
    return {
      title: "Login Berhasil! ✓",
      message: "Mengarahkan ke halaman utama...",
    };
  };

  const loaderText = getRedirectLoaderText();

  // Show loading while checking session
  if (isCheckingSession || status === "loading") {
    return (
      <div className="flex flex-col gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{config.title}</CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 border-4 border-[#7CE0A8] border-t-transparent rounded-full animate-spin"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {showRedirectLoader && (
        <div className="fixed inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-neutral-900/95 dark:to-neutral-900/90 z-50 flex flex-col items-center justify-center gap-6 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-5xl mb-4">✓</div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#7CE0A8] to-[#5AB894] bg-clip-text text-transparent mb-2">
              {loaderText.title}
            </h2>
            <p className="text-neutral-600 dark:text-neutral-300">
              {loaderText.message}
            </p>
          </div>
          <LoaderTwo />
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-4">
            Mohon tunggu sebentar
          </p>
        </div>
      )}

      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="relative shadow-2xl overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 dark:from-neutral-900 dark:to-neutral-950">
          {/* Decorative gradient background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#7CE0A8]/5 to-transparent rounded-full -z-0 blur-3xl"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-[#7CE0A8]/5 to-transparent rounded-full -z-0 blur-3xl"></div>

          <CardHeader className="relative z-10 pb-6">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl">{config.icon}</span>
                  <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-700 dark:from-white dark:via-neutral-100 dark:to-neutral-300 bg-clip-text text-transparent">
                    {config.title}
                  </CardTitle>
                </div>
                <CardDescription className="text-neutral-600 dark:text-neutral-400">
                  {config.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative z-10">
            {/* Error Alert with improved styling */}
            {error && (
              <div className="mb-5 p-4 bg-gradient-to-r from-red-50 to-red-50/50 dark:from-red-950/30 dark:to-red-950/10 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-lg font-bold flex-shrink-0 mt-0.5">⚠️</span>
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

            <form onSubmit={handleSubmit} className="space-y-5">
              <FieldGroup className="space-y-5">
                {/* Email/Phone Field */}
                <Field className="space-y-2">
                  <FieldLabel
                    htmlFor="identifier"
                    className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2"
                  >
                    <span>📧</span>
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
                          ? "admin@gmail.com"
                          : userType === "mitra"
                          ? "mitra@marijasa.com"
                          : "Email atau 081234567890"
                      }
                      autoComplete="email"
                      disabled={isLoading || isGoogleLoading || showRedirectLoader}
                      className={cn(
                        "transition-all duration-300 pl-4 pr-4 py-3 rounded-lg",
                        "border-2 border-neutral-200 dark:border-neutral-700",
                        "focus:border-[#7CE0A8] focus:ring-2 focus:ring-[#7CE0A8]/20",
                        "dark:focus:border-[#7CE0A8]",
                        "bg-white dark:bg-neutral-800",
                        focusedField === "identifier" && "border-[#7CE0A8] ring-2 ring-[#7CE0A8]/20"
                      )}
                    />
                  </div>
                  {userType === "user" && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-500 flex items-center gap-2 mt-2">
                      <span>ℹ️</span>
                      Gunakan email atau nomor telepon yang terdaftar
                    </p>
                  )}
                  {userType === "mitra" && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-500 flex items-center gap-2 mt-2">
                      <span>ℹ️</span>
                      Gunakan email yang terdaftar sebagai mitra
                    </p>
                  )}
                </Field>

                {/* Password Field */}
                <Field className="space-y-2">
                  <div className="flex items-center justify-between">
                    <FieldLabel
                      htmlFor="password"
                      className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2"
                    >
                      <span>🔐</span>
                      Password
                    </FieldLabel>
                    {userType !== "admin" && userType !== "mitra" && (
                      <a
                        href="#"
                        className="inline-block text-xs sm:text-sm text-[#7CE0A8] hover:text-[#6bcb96] underline-offset-4 hover:underline transition-colors font-medium"
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
                      disabled={isLoading || isGoogleLoading || showRedirectLoader}
                      className={cn(
                        "transition-all duration-300 pl-4 pr-12 py-3 rounded-lg w-full",
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors p-1.5"
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    >
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-500 flex items-center gap-2 mt-2">
                    <span>ℹ️</span>
                    Password harus minimal 8 karakter
                  </p>
                </Field>

                {/* Submit Button */}
                <Field className="pt-2">
                  <Button
                    type="submit"
                    disabled={isLoading || isGoogleLoading || showRedirectLoader}
                    className={cn(
                      "w-full bg-gradient-to-r from-[#7CE0A8] to-[#5AB894] hover:from-[#6bcb96] hover:to-[#4ba383]",
                      "text-white font-semibold py-3 rounded-lg",
                      "focus:ring-2 focus:ring-[#7CE0A8] focus:ring-offset-2 dark:focus:ring-offset-neutral-900",
                      "transition-all duration-300 flex items-center justify-center gap-3",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "hover:shadow-lg hover:shadow-[#7CE0A8]/30"
                    )}
                  >
                    {isLoading ? (
                      <>
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Memproses...</span>
                      </>
                    ) : showRedirectLoader ? (
                      <>
                        <span>✓</span>
                        <span>Mengalihkan...</span>
                      </>
                    ) : (
                      <>
                        <span>🚀</span>
                        <span>Login Sekarang</span>
                      </>
                    )}
                  </Button>

                  {/* Divider - Google Login */}
                  {userType !== "admin" &&
                    userType !== "mitra" &&
                    !showRedirectLoader && (
                      <>
                        <div className="relative my-6">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-neutral-300 dark:border-neutral-700" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white dark:bg-neutral-900 px-3 text-neutral-500 dark:text-neutral-400 font-medium">
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
                            "transition-all duration-300 py-3 rounded-lg",
                            "flex items-center justify-center gap-3 font-medium",
                            "dark:hover:bg-[#7CE0A8]/10"
                          )}
                        >
                          {isGoogleLoading ? (
                            <>
                              <div className="h-5 w-5 border-2 border-[#7CE0A8] border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-sm">Menghubungkan ke Google...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                              <span className="text-sm">Google</span>
                            </>
                          )}
                        </Button>
                      </>
                    )}

                  {/* Register Link */}
                  {config.registerLink && !showRedirectLoader && (
                    <FieldDescription className="text-center mt-6 text-neutral-600 dark:text-neutral-400">
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
        <div className="text-center text-xs text-neutral-500 dark:text-neutral-500 flex items-center justify-center gap-2">
          <span>🔒</span>
          <p>Data Anda dilindungi dengan enkripsi tingkat enterprise</p>
        </div>
      </div>
    </>
  );
}
