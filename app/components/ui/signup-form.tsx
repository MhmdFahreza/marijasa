"use client"

import { Button } from "@/app/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/app/components/ui/field"
import { Input } from "@/app/components/ui/input"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { cn } from "../lib/utils"

type RegisterResponse =
  | { message: string; otpId?: string; devOtp?: string }
  | { message?: string; otpId?: string; devOtp?: string }

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string) => {
    const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{7,11}$/
    return phoneRegex.test(phone.replace(/[\s-]/g, ""))
  }

  const normalizePhone = (phone: string): string => {
    let cleaned = phone.replace(/[\s-]/g, "")
    if (cleaned.startsWith("08")) cleaned = "+62" + cleaned.substring(1)
    else if (cleaned.startsWith("62")) cleaned = "+" + cleaned
    else if (!cleaned.startsWith("+62")) cleaned = "+62" + cleaned
    return cleaned
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }))
    if (error) setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.name.trim().length < 2) {
      setError("Nama harus minimal 2 karakter")
      return
    }

    if (!validateEmail(formData.email)) {
      setError("Format email tidak valid. Contoh: user@example.com")
      return
    }

    if (!validatePhone(formData.phone)) {
      setError("Format nomor telepon tidak valid. Contoh: 081234567890 atau +6281234567890")
      return
    }

    if (formData.password.length < 8) {
      setError("Password harus minimal 8 karakter")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok")
      return
    }

    setIsLoading(true)

    try {
      const normalizedPhone = normalizePhone(formData.phone)
      const payload = {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: normalizedPhone,
        password: formData.password,
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      let data: RegisterResponse | null = null
      const contentType = response.headers.get("content-type") || ""

      if (contentType.includes("application/json")) {
        data = (await response.json()) as RegisterResponse
      } else {
        const text = await response.text()
        data = { message: text || "Respons server tidak valid" }
      }

      if (!response.ok) {
        setError((data && "message" in data && data.message) || "Terjadi kesalahan saat mendaftar")
        return
      }

      if (typeof window !== "undefined") {
        const pendingRegistration = {
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          otpId: (data && "otpId" in data && data.otpId) || null,
          timestamp: new Date().toISOString(),
          verified: false,
        }
        localStorage.setItem("pendingRegistration", JSON.stringify(pendingRegistration))
      }

      router.push(
        `/register/otp?email=${encodeURIComponent(payload.email)}&name=${encodeURIComponent(payload.name)}`
      )
    } catch (err) {
      console.error("Registration error:", err)
      setError("Terjadi kesalahan saat mendaftar. Silakan coba lagi.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Buat Akun</CardTitle>
        <CardDescription>Masukkan informasi Anda untuk membuat akun</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Nama Lengkap</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="Masukkan Namamu"
                required
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="contoh@email.com"
                disabled={isLoading}
              />
              <FieldDescription>Email akan digunakan untuk login dan notifikasi.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="phone">Nomor Telepon</FieldLabel>
              <Input
                id="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="081234567890"
                disabled={isLoading}
              />
              <FieldDescription>Masukkan nomor telepon aktif (format: 08xxx atau +628xxx).</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimal 8 karakter"
                disabled={isLoading}
              />
              <FieldDescription>Minimal 8 karakter.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="confirmPassword">Konfirmasi Password</FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Ulangi password"
                disabled={isLoading}
              />
              <FieldDescription>Harap konfirmasi password Anda.</FieldDescription>
            </Field>

            <Field>
              <Button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full gap-2 bg-[#7CE0A8] text-white transition-colors duration-200 hover:bg-[#6bcb96]",
                  "flex items-center justify-center focus:ring-[#7CE0A8] focus:ring-offset-2"
                )}
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Memproses...
                  </>
                ) : (
                  "Buat Akun"
                )}
              </Button>

              <FieldDescription className="px-6 text-center">
                Sudah punya akun?{" "}
                <a href="/login" className="text-[#7CE0A8] hover:underline">
                  Masuk
                </a>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
