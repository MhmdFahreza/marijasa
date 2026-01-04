"use client"

import { cn } from "../lib/utils"
import { Button } from "../ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "../ui/field"
import { Input } from "../ui/input"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { LoaderTwo } from "@/app/components/transition/loader"
import { validateVendorLogin, getCategoryFromTags } from "@/app/data/dataVendor"
import { signIn } from "next-auth/react"

type UserType = "user" | "mitra" | "admin"

interface LoginFormProps extends React.ComponentProps<"div"> {
  userType?: UserType
  onSuccess?: (email: string) => void
  onRegisterClick?: () => void
}

export function LoginForm({
  className,
  userType = "user",
  onSuccess,
  onRegisterClick,
  ...props
}: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showRedirectLoader, setShowRedirectLoader] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Konfigurasi konten berdasarkan tipe user
  const userConfig = {
    user: {
      title: "Login ke Akun Anda",
      description: "Masukkan email Anda untuk login ke akun",
      registerLink: "/register",
      registerText: "Daftar",
    },
    mitra: {
      title: "Login ke Akun Mitra",
      description: "Masukkan email dan password Anda untuk login sebagai mitra",
      registerLink: null,
      registerText: null,
    },
    admin: {
      title: "Login ke Akun Admin",
      description: "Masukkan gmail dan password Anda untuk login ke halaman Admin",
      registerLink: null,
      registerText: null,
    },
  }

  const config = userConfig[userType]

  // Validasi email format
  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return emailRegex.test(email)
  }

  // Handler untuk Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Panggil signIn dengan redirect: true untuk auto redirect
      await signIn("google", {
        callbackUrl: "/",
        redirect: true
      })
      
    } catch (error) {
      console.error("Google sign in error:", error)
      setError("Terjadi kesalahan saat login dengan Google")
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // Validasi email format
    if (!validateEmail(email)) {
      setError("Format email tidak valid. Gunakan format email yang benar (contoh: user@example.com)")
      return
    }
    
    if (password.length < 8) {
      setError("Password minimal 8 karakter")
      return
    }
    
    // Validasi khusus untuk admin
    if (userType === "admin") {
      const dummyAdminCredentials = [
        { email: "Marijasa@gmail.com", password: "admin1234" },
      ]
      
      const isValid = dummyAdminCredentials.some(
        cred => cred.email === email && cred.password === password
      )
      
      if (!isValid) {
        setError("Email atau password admin salah.")
        return
      }
    }
    
    // Validasi khusus untuk mitra - cek dari dataVendor
    if (userType === "mitra") {
      const vendor = validateVendorLogin(email, password)
      
      if (!vendor) {
        setError("Email atau password mitra salah. Pastikan Anda menggunakan kredensial yang benar.")
        return
      }
      
      // Login berhasil untuk mitra
      setIsLoading(true)
      
      try {
        // Simulasi API call
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve({ success: true, token: "dummy-token" })
          }, 1000)
        })
        
        // Determine category from tags
        const category = getCategoryFromTags(vendor.tags);
        
        // Simpan data mitra ke localStorage dengan semua data dari dataVendor
        if (typeof window !== 'undefined') {
          localStorage.setItem('mitraToken', 'dummy-token')
          localStorage.setItem('mitraUser', JSON.stringify({
            id: vendor.id,
            email: vendor.email,
            name: vendor.name,
            phone: vendor.phone,
            avatar: vendor.avatar,
            description: vendor.description,
            serviceAreas: vendor.serviceAreas,
            rating: vendor.rating,
            reviewCount: vendor.reviewCount,
            verified: vendor.verified,
            joinDate: vendor.joinDate,
            specialties: vendor.specialties || [],
            tags: vendor.tags,
            category: category,
            services: vendor.services || [],
            role: "mitra"
          }))
        }
        
        // Jika ada callback onSuccess (untuk modal), panggil
        if (onSuccess) {
          onSuccess(email)
          setIsLoading(false)
          return
        }
        
        // Tampilkan loader redirect untuk mitra
        setShowRedirectLoader(true)
        
        // Tunggu sebentar untuk menampilkan loader redirect
        setTimeout(() => {
          router.push("/mitra/dashboard")
          router.refresh()
        }, 1000)
        
      } catch (error) {
        console.error("Login error:", error)
        setError("Terjadi kesalahan saat login. Silakan coba lagi.")
        setIsLoading(false)
      }
      
      return
    }
    
    // Untuk user dan admin
    setIsLoading(true)
    
    try {
      // PERBAIKAN: Untuk admin, simpan token langsung
      if (userType === "admin") {
        // Simulasi API call
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve({ success: true, token: "dummy-token" })
          }, 1000)
        })
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('adminToken', 'dummy-token')
          localStorage.setItem('adminUser', JSON.stringify({ 
            email,
            name: "Administrator",
            role: "admin"
          }))
        }
        
        // Jika ada callback onSuccess (untuk modal), panggil
        if (onSuccess) {
          onSuccess(email)
          setIsLoading(false)
          return
        }
        
        // Tampilkan loader redirect untuk admin
        setShowRedirectLoader(true)
        
        // Tunggu sebentar untuk menampilkan loader redirect
        setTimeout(() => {
          router.push("/admin/dashboard")
          router.refresh()
        }, 1000)
      } else {
        // PERBAIKAN: Untuk user biasa, JANGAN simpan token dulu
        // Hanya simpan pendingAuth untuk verifikasi di halaman OTP
        
        // Simulasi API call
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve({ success: true, token: "dummy-token" })
          }, 1000)
        })
        
        if (typeof window !== 'undefined') {
          // Simpan data sementara untuk diverifikasi di OTP
          const pendingAuth = {
            email,
            timestamp: new Date().toISOString(),
            verified: false
          }
          localStorage.setItem('pendingAuth', JSON.stringify(pendingAuth))
          
          // HAPUS token lama jika ada
          localStorage.removeItem('userToken')
          localStorage.removeItem('user')
          localStorage.removeItem('authData')
        }
        
        // Untuk user biasa, langsung redirect ke OTP tanpa loading overlay
        router.push(`/login/otp?email=${encodeURIComponent(email)}&type=${userType}`)
      }
      
    } catch (error) {
      console.error("Login error:", error)
      setError("Terjadi kesalahan saat login. Silakan coba lagi.")
      setIsLoading(false)
    }
  }

  const handleRegisterLinkClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (onRegisterClick) {
      onRegisterClick()
    } else {
      router.push('/register')
    }
  }

  // Fungsi untuk mendapatkan text loader berdasarkan user type
  const getRedirectLoaderText = () => {
    if (userType === "admin") {
      return {
        title: "Login Berhasil!",
        message: "Mengarahkan ke dashboard admin..."
      }
    } else if (userType === "mitra") {
      return {
        title: "Login Berhasil!",
        message: "Mengarahkan ke dashboard mitra..."
      }
    }
    return {
      title: "Login Berhasil!",
      message: "Mengarahkan..."
    }
  }

  const loaderText = getRedirectLoaderText()

  return (
    <>
      {showRedirectLoader && (
        <div className="fixed inset-0 bg-white/90 dark:bg-neutral-900/90 z-50 flex flex-col items-center justify-center gap-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-neutral-800 dark:text-white mb-2">
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
        <Card>
          <CardHeader>
            <CardTitle>{config.title}</CardTitle>
            <CardDescription>
              {config.description}
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
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      userType === "admin" 
                        ? "admin@gmail.com" 
                        : userType === "mitra"
                        ? "mitra@marijasa.com"
                        : "masukkan email"
                    }
                    autoComplete="email"
                    disabled={isLoading || showRedirectLoader}
                  />
                  {userType === "mitra" && (
                    <p className="text-xs text-neutral-500 mt-1">
                      Gunakan email yang terdaftar sebagai mitra
                    </p>
                  )}
                </Field>
                <Field>
                  <div className="flex items-center">
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    {userType !== "admin" && userType !== "mitra" && (
                      <a
                        href="#"
                        className="ml-auto inline-block text-sm text-[#7CE0A8] hover:text-[#6bcb96] underline-offset-4 hover:underline"
                      >
                        Lupa password?
                      </a>
                    )}
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="minimal 8 karakter"
                    autoComplete="current-password"
                    disabled={isLoading || showRedirectLoader}
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Password harus minimal 8 karakter
                  </p>
                </Field>
                <Field>
                  <Button 
                    type="submit" 
                    disabled={isLoading || showRedirectLoader}
                    className={cn(
                      "w-full bg-[#7CE0A8] hover:bg-[#6bcb96] text-white",
                      "focus:ring-[#7CE0A8] focus:ring-offset-2",
                      "transition-colors duration-200 flex items-center justify-center gap-2"
                    )}
                  >
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {userType === "user" ? "Mengirim kode OTP..." : "Memproses..."}
                      </>
                    ) : showRedirectLoader ? "Mengalihkan..." : "Login"}
                  </Button>
                  
                  {userType !== "admin" && userType !== "mitra" && !showRedirectLoader && (
                    <Button 
                      variant="outline" 
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                      className="w-full mt-3 border-[#7CE0A8] text-[#7CE0A8] hover:bg-[#7CE0A8]/10 flex items-center justify-center gap-2"
                    >
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
                      Login dengan Google
                    </Button>
                  )}
                  
                  {config.registerLink && !showRedirectLoader && (
                    <FieldDescription className="text-center mt-4">
                      Belum punya akun?{" "}
                      <button
                        type="button"
                        onClick={handleRegisterLinkClick}
                        className="text-[#7CE0A8] hover:text-[#6bcb96] underline-offset-4 hover:underline"
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
      </div>
    </>
  )
}