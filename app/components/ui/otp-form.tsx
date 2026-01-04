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
import { CheckCircle2 } from "lucide-react"

interface OTPFormProps {
  type?: "register"
  email?: string
  name?: string
  [key: string]: any
}

// Success Modal Component
function SuccessModal({ 
  isOpen, 
  onClose, 
  message 
}: { 
  isOpen: boolean
  onClose: () => void
  message: string 
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 max-w-sm w-full shadow-xl animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-[#7CE0A8]/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-12 h-12 text-[#7CE0A8]" />
          </div>
          
          {/* Title */}
          <h2 className="text-xl font-semibold text-neutral-800 dark:text-white mb-2">
            Selamat!
          </h2>
          
          {/* Message */}
          <p className="text-neutral-600 dark:text-neutral-300 mb-6">
            {message}
          </p>
          
          {/* Button */}
          <Button
            onClick={onClose}
            className={cn(
              "w-full bg-[#7CE0A8] hover:bg-[#6bcb96] text-white",
              "focus:ring-[#7CE0A8] focus:ring-offset-2",
              "transition-colors duration-200"
            )}
          >
            Lanjutkan
          </Button>
        </div>
      </div>
    </div>
  )
}

export function OTPForm({ type = "register", email, name, ...props }: OTPFormProps) {
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [countdown, setCountdown] = useState(0)
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

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Ambil data dari pendingRegistration
      let registrationData = null
      if (typeof window !== 'undefined') {
        const pendingReg = localStorage.getItem('pendingRegistration')
        if (pendingReg) {
          registrationData = JSON.parse(pendingReg)
        }
      }

      // API call untuk verifikasi OTP
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailFromParams,
          code: otp,
          type: 'register'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Kode OTP salah")
        setIsLoading(false)
        return
      }

      // OTP berhasil - Simpan token dan user data
      const userData = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        avatar: data.user.avatar || "/profile.svg"
      };

      const authData = {
        isLoggedIn: true,
        user: userData,
        loginTime: new Date().toISOString(),
        registeredAt: new Date().toISOString()
      };

      // Simpan ke localStorage setelah OTP berhasil
      if (typeof window !== 'undefined') {
        localStorage.setItem("userToken", data.token || "user-token");
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("authData", JSON.stringify(authData));
        
        // Hapus pendingRegistration setelah berhasil
        localStorage.removeItem('pendingRegistration');
      }

      setIsLoading(false)
      
      // Tampilkan success modal
      setShowSuccessModal(true)

    } catch (error) {
      console.error("OTP verification error:", error)
      setError("Terjadi kesalahan saat verifikasi. Silakan coba lagi.")
      setIsLoading(false)
    }
  }

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false)
    // Redirect ke halaman utama setelah modal ditutup
    router.replace("/")
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

  const handleResend = async () => {
    if (countdown > 0) return
    
    setError(null)
    setOtp("")
    
    try {
      // API call untuk kirim ulang OTP
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailFromParams,
          type: 'register'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Gagal mengirim ulang OTP")
        return
      }

      // Set countdown 60 detik
      setCountdown(60)
      
      // Update timestamp di pendingRegistration
      if (typeof window !== 'undefined') {
        const pendingReg = localStorage.getItem('pendingRegistration')
        if (pendingReg) {
          const regData = JSON.parse(pendingReg)
          regData.timestamp = new Date().toISOString()
          regData.otpId = data.otpId
          localStorage.setItem('pendingRegistration', JSON.stringify(regData))
        }
      }
      
      alert("OTP telah dikirim ulang! Gunakan kode: 123456 (dummy)")
      
    } catch (error) {
      console.error("Resend OTP error:", error)
      setError("Gagal mengirim ulang OTP. Silakan coba lagi.")
    }
  }

  const handleBackToRegister = () => {
    // Hapus pendingRegistration saat kembali ke register
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pendingRegistration')
    }
    router.replace('/register')
  }

  return (
    <>
      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        message="Anda berhasil melakukan register akun"
      />
      
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
          
          {/* Info box untuk dummy OTP */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-md text-sm">
            <strong>Demo Mode:</strong> Gunakan kode OTP <code className="bg-blue-100 px-1 rounded">123456</code>
          </div>
          
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
                    "transition-colors duration-200",
                    "flex items-center justify-center gap-2"
                  )}
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Memverifikasi...
                    </>
                  ) : "Verifikasi"}
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
                    disabled={isLoading || countdown > 0}
                    className={cn(
                      "font-medium hover:underline focus:outline-none focus:underline",
                      countdown > 0 
                        ? "text-neutral-400 cursor-not-allowed" 
                        : "text-foreground"
                    )}
                  >
                    {countdown > 0 ? `Kirim Ulang (${countdown}s)` : "Kirim Ulang"}
                  </button>
                </FieldDescription>
              </FieldGroup>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </>
  )
}
