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
  const router = useRouter()
  const searchParams = useSearchParams()

  // Gunakan email dari searchParams jika tersedia
  const emailFromParams = searchParams?.get("email") || email

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulasi proses verifikasi OTP
    setTimeout(() => {
      setIsLoading(false)
      if (otp === "123456") { // OTP dummy
        // Redirect ke halaman utama setelah verifikasi berhasil
        router.push("/")
      } else {
        alert("Kode OTP salah. Coba lagi dengan 123456")
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
            {/* Skeleton untuk OTP input */}
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
    alert("OTP telah dikirim ulang! Gunakan 123456")
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Enter verification code</CardTitle>
        <CardDescription>We sent a 6-digit code to your email.</CardDescription>
      </CardHeader>
      <CardContent>
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
              <FieldDescription className="text-center">
                Didn&apos;t receive the code?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-foreground font-medium hover:underline focus:outline-none focus:underline"
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