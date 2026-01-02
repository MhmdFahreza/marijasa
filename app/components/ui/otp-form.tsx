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
  type?: "login" | "register"
  email?: string
  [key: string]: any
}

export function OTPForm({ type = "login", email, ...props }: OTPFormProps) {
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const emailFromParams = searchParams?.get("email") || email

  useEffect(() => {
    setIsMounted(true)
    
    // PERBAIKAN: Cek apakah ada pendingAuth yang valid
    if (typeof window !== 'undefined') {
      const pendingAuth = localStorage.getItem('pendingAuth')
      
      if (!pendingAuth) {
        // Jika tidak ada pendingAuth, redirect ke login
        router.push('/login')
        return
      }
      
      try {
        const authData = JSON.parse(pendingAuth)
        
        // Cek apakah email sesuai
        if (authData.email !== emailFromParams) {
          router.push('/login')
          return
        }
        
        // Cek apakah sudah expired (5 menit)
        const timestamp = new Date(authData.timestamp).getTime()
        const now = new Date().getTime()
        const fiveMinutes = 5 * 60 * 1000
        
        if (now - timestamp > fiveMinutes) {
          localStorage.removeItem('pendingAuth')
          router.push('/login')
          return
        }
      } catch (error) {
        console.error('Error parsing pendingAuth:', error)
        router.push('/login')
      }
    }
  }, [emailFromParams, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    // Simulasi proses verifikasi OTP
    setTimeout(() => {
      setIsLoading(false)
      if (otp === "123456") {
        // PERBAIKAN: OTP berhasil - BARU simpan token dan user data
        const userData = {
          name: "User",
          email: emailFromParams,
          avatar: "/profile.svg"
        };

        const authData = {
          isLoggedIn: true,
          user: userData,
          loginTime: new Date().toISOString()
        };

        // PERBAIKAN: Simpan ke localStorage HANYA setelah OTP berhasil
        if (typeof window !== 'undefined') {
          localStorage.setItem("userToken", "dummy-token");
          localStorage.setItem("user", JSON.stringify(userData));
          localStorage.setItem("authData", JSON.stringify(authData));
          
          // Hapus pendingAuth setelah berhasil
          localStorage.removeItem('pendingAuth');
        }

        // Redirect ke halaman utama setelah verifikasi berhasil
        router.push("/")
        router.refresh()
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
          <CardTitle>Enter verification code</CardTitle>
          <CardDescription>We sent a 6-digit code to your email.</CardDescription>
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

  const handleBackToLogin = () => {
    // PERBAIKAN: Hapus pendingAuth saat kembali ke login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pendingAuth')
    }
    router.push('/login')
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Enter verification code</CardTitle>
        <CardDescription>
          We sent a 6-digit code to {emailFromParams || 'your email'}.
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
              <FieldLabel htmlFor="otp">Verification code</FieldLabel>
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
                Enter the 6-digit code sent to your email.
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
                {isLoading ? "Verifying..." : "Verify"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleBackToLogin}
                disabled={isLoading}
                className="w-full mt-2"
              >
                Back to Login
              </Button>
              <FieldDescription className="text-center">
                Didn&apos;t receive the code?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isLoading}
                  className="text-foreground font-medium hover:underline focus:outline-none focus:underline disabled:opacity-50"
                >
                  Resend
                </button>
              </FieldDescription>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}