"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/app/components/ui/input-otp"
import { cn } from "../lib/utils"

interface OTPFormProps {
  type?: "register"
  email?: string
  name?: string
  [key: string]: any
}

export function OTPForm({ type = "register", email, name, ...props }: OTPFormProps) {
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const emailFromParams = searchParams?.get("email") || email
  const nameFromParams = searchParams?.get("name") || name

  useEffect(() => {
    setIsMounted(true)
    
    // Cek apakah ada pendingRegistration yang valid
    if (typeof window !== 'undefined') {
      const pendingRegistration = localStorage.getItem('pendingRegistration')
      
      if (!pendingRegistration) {
        // Jika tidak ada pendingRegistration, redirect ke register
        router.replace('/register')
        return
      }
      
      try {
        const regData = JSON.parse(pendingRegistration)
        
        // Cek apakah email sesuai
        if (regData.email !== emailFromParams) {
          localStorage.removeItem('pendingRegistration')
          router.replace('/register')
          return
        }
        
        // Cek apakah sudah expired (10 menit untuk registrasi)
        const timestamp = new Date(regData.timestamp).getTime()
        const now = new Date().getTime()
        const tenMinutes = 10 * 60 * 1000
        
        if (now - timestamp > tenMinutes) {
          localStorage.removeItem('pendingRegistration')
          router.replace('/register')
          return
        }
      } catch (error) {
        console.error('Error parsing pendingRegistration:', error)
        localStorage.removeItem('pendingRegistration')
        router.replace('/register')
      }
    }
  }, [emailFromParams, router])

  // Tangani browser back button
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault()
      
      // Hapus pendingRegistration saat user menekan back browser
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pendingRegistration')
      }
      
      // Redirect ke halaman register
      router.replace('/register')
    }

    // Tambahkan entry ke history agar back button bisa di-handle
    window.history.pushState(null, '', window.location.href)
    
    // Listen untuk popstate (back button)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    // Simulasi proses verifikasi OTP
    setTimeout(() => {
      setIsLoading(false)
      if (otp === "123456") {
        // OTP berhasil - Simpan token dan user data untuk registrasi baru
        
        // Ambil data dari pendingRegistration
        let registrationData = null
        if (typeof window !== 'undefined') {
          const pendingReg = localStorage.getItem('pendingRegistration')
          if (pendingReg) {
            registrationData = JSON.parse(pendingReg)
          }
        }
        
        const userData = {
          name: registrationData?.name || nameFromParams || "User Baru",
          email: emailFromParams,
          phone: registrationData?.phone || "",
          avatar: "/profile.svg"
        };

        const authData = {
          isLoggedIn: true,
          user: userData,
          loginTime: new Date().toISOString(),
          registeredAt: new Date().toISOString()
        };

        // Simpan ke localStorage setelah OTP berhasil
        if (typeof window !== 'undefined') {
          localStorage.setItem("userToken", "dummy-token");
          localStorage.setItem("user", JSON.stringify(userData));
          localStorage.setItem("authData", JSON.stringify(authData));
          
          // Hapus pendingRegistration setelah berhasil
          localStorage.removeItem('pendingRegistration');
        }

        // Redirect ke halaman utama setelah verifikasi berhasil
        router.replace("/")
      } else {
        setError("Kode OTP salah. Coba lagi dengan 123456")
      }
    }, 1000)
  }

  // Tampilkan skeleton atau loading state selama belum mounted
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
    )
  }

  const handleResend = () => {
    // Simulasi kirim ulang OTP
    setOtp("")
    setError(null)
    alert("OTP telah dikirim ulang! Gunakan 123456")
  }

  const handleBackToRegister = () => {
    // Hapus pendingRegistration saat kembali ke register
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pendingRegistration')
    }
    router.replace('/register')
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Verifikasi Email</CardTitle>
        <CardDescription>
          Kami mengirim kode 6 digit ke {emailFromParams || 'email Anda'}.
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
              <FieldLabel htmlFor="otp">Kode Verifikasi</FieldLabel>
              <InputOTP
                maxLength={6}
                id="otp"
                required
                value={otp}
                onChange={(value) => setOtp(value)}
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
                disabled={isLoading || otp.length !== 6}
                className={cn(
                  "w-full",
                  "bg-[#7CE0A8] hover:bg-[#6bcb96] text-white",
                  "focus:ring-[#7CE0A8] focus:ring-offset-2",
                  "transition-colors duration-200"
                )}
              >
                {isLoading ? "Memverifikasi..." : "Verifikasi"}
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
                  disabled={isLoading}
                  className="text-foreground font-medium hover:underline focus:outline-none focus:underline disabled:opacity-50"
                >
                  Kirim Ulang
                </button>
              </FieldDescription>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}