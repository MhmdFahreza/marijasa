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
import { signIn } from "next-auth/react";

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
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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

  // Handle Google Sign In
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
      setError("Format email tidak valid. Gunakan format yang benar (contoh: user@example.com)");
      return;
    }

    if (!validatePhone(trimmedPhone)) {
      setError("Format nomor telepon tidak valid. Gunakan format Indonesia (contoh: 081234567890)");
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
        router.push(`/register/otp?email=${encodeURIComponent(trimmedEmail)}&name=${encodeURIComponent(trimmedName)}`);
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

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Daftar Akun Baru</CardTitle>
          <CardDescription>
            Isi data di bawah ini untuk membuat akun baru
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-start justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-2 text-red-500 hover:text-red-700 flex-shrink-0"
                aria-label="Tutup pesan error"
              >
                ✕
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Nama Lengkap</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  autoComplete="name"
                  disabled={isLoading || isGoogleLoading}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contoh@email.com"
                  autoComplete="email"
                  disabled={isLoading || isGoogleLoading}
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Kode OTP akan dikirim ke email ini
                </p>
              </Field>

              <Field>
                <FieldLabel htmlFor="phone">Nomor Telepon</FieldLabel>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  autoComplete="tel"
                  disabled={isLoading || isGoogleLoading}
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Gunakan format Indonesia (08xxx)
                </p>
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  autoComplete="new-password"
                  disabled={isLoading || isGoogleLoading}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="confirmPassword">Konfirmasi Password</FieldLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password"
                  autoComplete="new-password"
                  disabled={isLoading || isGoogleLoading}
                />
              </Field>

              <Field>
                <Button
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  className={cn(
                    "w-full bg-[#7CE0A8] hover:bg-[#6bcb96] text-white",
                    "focus:ring-[#7CE0A8] focus:ring-offset-2",
                    "transition-colors duration-200 flex items-center justify-center gap-2"
                  )}
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Memproses...
                    </>
                  ) : (
                    "Buat Akun"
                  )}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-neutral-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-neutral-500">atau</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading || isGoogleLoading}
                  className="w-full border-[#7CE0A8] text-[#7CE0A8] hover:bg-[#7CE0A8]/10 flex items-center justify-center gap-2"
                >
                  {isGoogleLoading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-[#7CE0A8] border-t-transparent rounded-full animate-spin"></div>
                      Menghubungkan ke Google...
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
                      Daftar dengan Google
                    </>
                  )}
                </Button>

                <FieldDescription className="text-center mt-4">
                  Sudah punya akun?{" "}
                  <button
                    type="button"
                    onClick={handleLoginLinkClick}
                    className="text-[#7CE0A8] hover:text-[#6bcb96] underline-offset-4 hover:underline"
                  >
                    Masuk
                  </button>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}