// app/components/ui/signup-form.tsx
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
import { useState } from "react";

interface SignupFormProps extends React.ComponentProps<"div"> {
  onSuccess?: (email: string) => void;
  onLoginClick?: () => void;
}

export function SignupForm({
  className,
  onSuccess,
  onLoginClick,
  ...props
}: SignupFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const router = useRouter();

  // Calculate password strength
  const calculatePasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[!@#$%^&*]/.test(pwd)) strength++;
    return strength;
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordStrength(calculatePasswordStrength(value));
  };

  // Validate email format
  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  // Validate phone format (Indonesia)
  const validatePhone = (phone: string) => {
    const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{7,11}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ""));
  };

  // Get password strength indicator
  const getPasswordStrengthInfo = () => {
    const strengthLevels = [
      { label: "Sangat Lemah", color: "bg-red-500", width: "w-1/5" },
      { label: "Lemah", color: "bg-orange-500", width: "w-2/5" },
      { label: "Sedang", color: "bg-yellow-500", width: "w-3/5" },
      { label: "Kuat", color: "bg-blue-500", width: "w-4/5" },
      { label: "Sangat Kuat", color: "bg-green-500", width: "w-full" },
    ];
    return strengthLevels[Math.max(0, passwordStrength - 1)] || strengthLevels[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPhone || !password) {
      setError("Semua field harus diisi");
      return;
    }

    if (trimmedName.length < 2) {
      setError("Nama harus minimal 2 karakter");
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError(
        "Format email tidak valid. Gunakan format yang benar (contoh: user@example.com)"
      );
      return;
    }

    if (!validatePhone(trimmedPhone)) {
      setError(
        "Format nomor telepon tidak valid. Gunakan format Indonesia (contoh: 081234567890)"
      );
      return;
    }

    if (password.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak sama");
      return;
    }

    setIsLoading(true);

    try {
      // Call register API
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle cooldown
        if (response.status === 429 && data.cooldownRemaining) {
          setError(`Tunggu ${data.cooldownRemaining} detik sebelum mencoba lagi`);
        } else {
          setError(data.message || "Terjadi kesalahan saat mendaftar");
        }
        setIsLoading(false);
        return;
      }

      // Success - redirect to OTP page
      if (onSuccess) {
        onSuccess(trimmedEmail);
      } else {
        // Redirect to OTP verification page with email as query param
        router.push(
          `/register/otp?email=${encodeURIComponent(
            trimmedEmail
          )}&name=${encodeURIComponent(trimmedName)}`
        );
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("Terjadi kesalahan saat mendaftar. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  const handleLoginLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onLoginClick) {
      onLoginClick();
    } else {
      router.push("/login");
    }
  };

  const passwordStrengthInfo = getPasswordStrengthInfo();

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="relative shadow-2xl overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 dark:from-neutral-900 dark:to-neutral-950">
        {/* Decorative gradient background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#7CE0A8]/5 to-transparent rounded-full -z-0 blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-[#7CE0A8]/5 to-transparent rounded-full -z-0 blur-3xl"></div>

        <CardHeader className="relative z-10 pb-6">
          <div className="flex items-start gap-3 mb-2">
            <span className="text-3xl">🎉</span>
            <div className="flex-1">
              <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-700 dark:from-white dark:via-neutral-100 dark:to-neutral-300 bg-clip-text text-transparent">
                Buat Akun Baru
              </CardTitle>
              <CardDescription className="text-neutral-600 dark:text-neutral-400 mt-2">
                Bergabunglah dengan ribuan pengguna yang puas. Proses pendaftaran hanya butuh 2 menit.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10">
          {/* Error Alert */}
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
              {/* Name Field */}
              <Field className="space-y-2">
                <FieldLabel
                  htmlFor="name"
                  className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2"
                >
                  <span>👤</span>
                  Nama Lengkap
                </FieldLabel>
                <div className="relative group">
                  <Input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Masukkan nama lengkap Anda"
                    autoComplete="name"
                    disabled={isLoading}
                    className={cn(
                      "transition-all duration-300 pl-4 pr-4 py-3 rounded-lg w-full",
                      "border-2 border-neutral-200 dark:border-neutral-700",
                      "focus:border-[#7CE0A8] focus:ring-2 focus:ring-[#7CE0A8]/20",
                      "dark:focus:border-[#7CE0A8]",
                      "bg-white dark:bg-neutral-800",
                      focusedField === "name" && "border-[#7CE0A8] ring-2 ring-[#7CE0A8]/20"
                    )}
                  />
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-500 flex items-center gap-2">
                  <span>ℹ️</span>
                  Minimal 2 karakter, contoh: Budi Santoso
                </p>
              </Field>

              {/* Email Field */}
              <Field className="space-y-2">
                <FieldLabel
                  htmlFor="email"
                  className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2"
                >
                  <span>📧</span>
                  Email
                </FieldLabel>
                <div className="relative group">
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Masukan Email Anda"
                    autoComplete="email"
                    disabled={isLoading}
                    className={cn(
                      "transition-all duration-300 pl-4 pr-4 py-3 rounded-lg w-full",
                      "border-2 border-neutral-200 dark:border-neutral-700",
                      "focus:border-[#7CE0A8] focus:ring-2 focus:ring-[#7CE0A8]/20",
                      "dark:focus:border-[#7CE0A8]",
                      "bg-white dark:bg-neutral-800",
                      focusedField === "email" && "border-[#7CE0A8] ring-2 ring-[#7CE0A8]/20"
                    )}
                  />
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-500 flex items-center gap-2">
                  <span>🔔</span>
                  Kode OTP verifikasi akan dikirim ke email ini
                </p>
              </Field>

              {/* Phone Field */}
              <Field className="space-y-2">
                <FieldLabel
                  htmlFor="phone"
                  className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2"
                >
                  <span>📱</span>
                  Nomor Telepon
                </FieldLabel>
                <div className="relative group">
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onFocus={() => setFocusedField("phone")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Masukan Nomor Anda"
                    autoComplete="tel"
                    disabled={isLoading}
                    className={cn(
                      "transition-all duration-300 pl-4 pr-4 py-3 rounded-lg w-full",
                      "border-2 border-neutral-200 dark:border-neutral-700",
                      "focus:border-[#7CE0A8] focus:ring-2 focus:ring-[#7CE0A8]/20",
                      "dark:focus:border-[#7CE0A8]",
                      "bg-white dark:bg-neutral-800",
                      focusedField === "phone" && "border-[#7CE0A8] ring-2 ring-[#7CE0A8]/20"
                    )}
                  />
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-500 flex items-center gap-2">
                  <span>ℹ️</span>
                  Gunakan format Indonesia (08xxx atau +62xxx)
                </p>
              </Field>

              {/* Password Field */}
              <Field className="space-y-2">
                <FieldLabel
                  htmlFor="password"
                  className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2"
                >
                  <span>🔐</span>
                  Password
                </FieldLabel>
                <div className="relative group">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Minimal 8 karakter"
                    autoComplete="new-password"
                    disabled={isLoading}
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
                    aria-label={
                      showPassword ? "Sembunyikan password" : "Tampilkan password"
                    }
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-2 mt-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Kekuatan password:
                      </span>
                      <span className={cn(
                        "font-semibold px-2 py-0.5 rounded",
                        passwordStrengthInfo.color,
                        "text-white text-xs"
                      )}>
                        {passwordStrengthInfo.label}
                      </span>
                    </div>
                    <div className="w-full bg-neutral-300 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all duration-300 rounded-full",
                          passwordStrengthInfo.color,
                          passwordStrengthInfo.width
                        )}
                      ></div>
                    </div>
                    <ul className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                      <li
                        className={cn(
                          "flex items-center gap-2",
                          password.length >= 8 ? "text-green-600 dark:text-green-400" : ""
                        )}
                      >
                        <span>{password.length >= 8 ? "✓" : "○"}</span>
                        Minimal 8 karakter
                      </li>
                      <li
                        className={cn(
                          "flex items-center gap-2",
                          /[A-Z]/.test(password) ? "text-green-600 dark:text-green-400" : ""
                        )}
                      >
                        <span>{/[A-Z]/.test(password) ? "✓" : "○"}</span>
                        Huruf besar (A-Z)
                      </li>
                      <li
                        className={cn(
                          "flex items-center gap-2",
                          /[0-9]/.test(password) ? "text-green-600 dark:text-green-400" : ""
                        )}
                      >
                        <span>{/[0-9]/.test(password) ? "✓" : "○"}</span>
                        Angka (0-9)
                      </li>
                    </ul>
                  </div>
                )}
              </Field>

              {/* Confirm Password Field */}
              <Field className="space-y-2">
                <FieldLabel
                  htmlFor="confirmPassword"
                  className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2"
                >
                  <span>✓</span>
                  Konfirmasi Password
                </FieldLabel>
                <div className="relative group">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setFocusedField("confirmPassword")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Ulangi password Anda"
                    autoComplete="new-password"
                    disabled={isLoading}
                    className={cn(
                      "transition-all duration-300 pl-4 pr-12 py-3 rounded-lg w-full",
                      "border-2 border-neutral-200 dark:border-neutral-700",
                      confirmPassword &&
                        password !== confirmPassword &&
                        "border-red-500 dark:border-red-500",
                      confirmPassword &&
                        password === confirmPassword &&
                        "border-green-500 dark:border-green-500",
                      focusedField === "confirmPassword" &&
                        "focus:ring-2 focus:ring-[#7CE0A8]/20",
                      "bg-white dark:bg-neutral-800",
                      focusedField === "confirmPassword" &&
                        password === confirmPassword &&
                        "border-[#7CE0A8] ring-2 ring-[#7CE0A8]/20"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors p-1.5"
                    aria-label={
                      showConfirmPassword
                        ? "Sembunyikan password"
                        : "Tampilkan password"
                    }
                  >
                    {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                    <span>⚠️</span>
                    Password tidak sama
                  </p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-2">
                    <span>✓</span>
                    Password cocok
                  </p>
                )}
              </Field>

              {/* Submit Button */}
              <Field className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
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
                      <span>Membuat Akun...</span>
                    </>
                  ) : (
                    <>
                      <span>🎯</span>
                      <span>Buat Akun Sekarang</span>
                    </>
                  )}
                </Button>

                {/* Login Link */}
                <FieldDescription className="text-center mt-6 text-neutral-600 dark:text-neutral-400">
                  Sudah punya akun?{" "}
                  <button
                    type="button"
                    onClick={handleLoginLinkClick}
                    className="font-semibold text-[#7CE0A8] hover:text-[#6bcb96] underline-offset-4 hover:underline transition-colors"
                  >
                    Masuk
                  </button>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {/* Benefits Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        <div className="p-4 rounded-lg bg-[#7CE0A8]/10 dark:bg-[#7CE0A8]/5 border border-[#7CE0A8]/20 text-center">
          <div className="text-2xl mb-1">⚡</div>
          <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
            Proses Instan
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-0.5">
            Verifikasi dalam hitungan detik
          </p>
        </div>
        <div className="p-4 rounded-lg bg-[#7CE0A8]/10 dark:bg-[#7CE0A8]/5 border border-[#7CE0A8]/20 text-center">
          <div className="text-2xl mb-1">🔒</div>
          <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
            Aman & Terpercaya
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-0.5">
            Enkripsi tingkat enterprise
          </p>
        </div>
      </div>

      {/* Terms Footer */}
      <p className="text-center text-xs text-neutral-500 dark:text-neutral-500">
        Dengan mendaftar, Anda menyetujui{" "}
        <a href="#" className="text-[#7CE0A8] hover:underline">
          Syarat & Ketentuan
        </a>{" "}
        dan{" "}
        <a href="#" className="text-[#7CE0A8] hover:underline">
          Kebijakan Privasi
        </a>
      </p>
    </div>
  );
}