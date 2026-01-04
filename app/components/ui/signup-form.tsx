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

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Validasi email format
  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return emailRegex.test(email)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    })
    // Clear error when user types
    if (error) setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // Validasi nama
    if (formData.name.trim().length < 2) {
      setError("Nama harus minimal 2 karakter")
      return
    }
    
    // Validasi email format
    if (!validateEmail(formData.email)) {
      setError("Format email tidak valid. Gunakan format email yang benar (contoh: user@example.com)")
      return
    }
    
    // Validasi nomor telepon
    if (formData.phone.length < 10) {
      setError("Nomor telepon harus minimal 10 digit")
      return
    }
    
    // Validasi password
    if (formData.password.length < 8) {
      setError("Password harus minimal 8 karakter")
      return
    }
    
    // Validasi konfirmasi password
    if (formData.password !== formData.confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok")
      return
    }
    
    setIsLoading(true)
    
    try {
      // Simulasi API call untuk registrasi
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true })
        }, 1000)
      })
      
      // Simpan data registrasi sementara untuk verifikasi OTP
      if (typeof window !== 'undefined') {
        const pendingRegistration = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          timestamp: new Date().toISOString(),
          verified: false
        }
        localStorage.setItem('pendingRegistration', JSON.stringify(pendingRegistration))
      }
      
      // Redirect ke halaman OTP register dengan email dan name sebagai parameter
      router.push(`/register/otp?email=${encodeURIComponent(formData.email)}&name=${encodeURIComponent(formData.name)}`)
      
    } catch (error) {
      console.error("Registration error:", error)
      setError("Terjadi kesalahan saat mendaftar. Silakan coba lagi.")
      setIsLoading(false)
    }
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Buat Akun</CardTitle>
        <CardDescription>
          Masukkan informasi Anda untuk membuat akun
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
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
              <FieldDescription>
                Kami akan menggunakan ini untuk menghubungi Anda.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="phone">Nomor Telepon</FieldLabel>
              <Input
                id="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="+628123456789"
                disabled={isLoading}
              />
              <FieldDescription>
                Masukkan nomor telepon dengan kode negara.
              </FieldDescription>
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
              <FieldDescription>
                Minimal 8 karakter.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirmPassword">
                Konfirmasi Password
              </FieldLabel>
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
            <FieldGroup>
              <Field>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className={cn(
                    "bg-[#7CE0A8] hover:bg-[#6bcb96] text-white",
                    "focus:ring-[#7CE0A8] focus:ring-offset-2",
                    "transition-colors duration-200 w-full flex items-center justify-center gap-2"
                  )}
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Memproses...
                    </>
                  ) : "Buat Akun"}
                </Button>
                <FieldDescription className="px-6 text-center">
                  Sudah punya akun? <a href="/login" className="text-[#7CE0A8] hover:underline">Masuk</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}