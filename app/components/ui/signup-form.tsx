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
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Validasi sederhana
    if (formData.password !== formData.confirmPassword) {
      alert("Password dan konfirmasi password tidak cocok")
      setIsLoading(false)
      return
    }
    
    // Simulasi proses register
    setTimeout(() => {
      setIsLoading(false)
      // Redirect ke halaman OTP register dengan email sebagai parameter
      router.push(`/register/otp?email=${encodeURIComponent(formData.email)}`)
    }, 1000)
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
                    "transition-colors duration-200 w-full"
                  )}
                >
                  {isLoading ? "Memproses..." : "Buat Akun"}
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