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
import { useState, useEffect } from "react"
import { LoaderTwo } from "@/app/components/transition/loader"
import { validateVendorLogin, getCategoryFromTags } from "@/app/data/dataVendor"
import { signIn, getSession, useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"

type UserType = "user" | "mitra" | "admin"

interface LoginFormProps extends React.ComponentProps<"div"> {
  userType?: UserType
  onSuccess?: (email: string) => void
  onRegisterClick?: () => void
}

// Mapping error codes ke pesan yang user-friendly
const ERROR_MESSAGES: Record<string, string> = {
  "USER_NOT_REGISTERED": "Email Google Anda belum terdaftar. Silakan daftar terlebih dahulu.",
  "ACCOUNT_INACTIVE": "Akun Anda tidak aktif. Silakan hubungi admin.",
  "NO_EMAIL": "Tidak dapat mengambil email dari akun Google. Silakan coba lagi.",
  "GOOGLE_SIGNIN_ERROR": "Terjadi kesalahan saat login dengan Google. Silakan coba lagi.",
  "OAuthAccountNotLinked": "Email ini sudah terdaftar dengan metode login lain. Silakan gunakan metode login yang sesuai.",
  "OAuthSignin": "Terjadi kesalahan saat memulai login Google. Silakan coba lagi.",
  "OAuthCallback": "Terjadi kesalahan saat memproses login Google. Silakan coba lagi.",
  "Callback": "Terjadi kesalahan saat memproses login. Silakan coba lagi.",
  "AccessDenied": "Akses ditolak. Silakan coba lagi.",
  "Configuration": "Terjadi kesalahan konfigurasi. Silakan hubungi admin.",
  "default": "Terjadi kesalahan. Silakan coba lagi."
}

export function LoginForm({
  className,
  userType = "user",
  onSuccess,
  onRegisterClick,
  ...props
}: LoginFormProps) {
  const [identifier, setIdentifier] = useState("") // Email atau Nomor Telepon
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showRedirectLoader, setShowRedirectLoader] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Gunakan useSession hook untuk mendapatkan status session yang lebih akurat
  const { data: session, status } = useSession()

  // Check for existing session on mount (untuk handle redirect dari Google OAuth)
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Tunggu sampai status session selesai loading
        if (status === "loading") {
          return;
        }

        // Cek apakah ada error dari URL (OAuth error)
        const errorParam = searchParams?.get("error")
        if (errorParam) {
          // Jika ada error, jangan redirect, tampilkan form login
          setIsCheckingSession(false);
          return;
        }

        // Hanya redirect jika session benar-benar authenticated dari NextAuth
        if (status === "authenticated" && session?.user) {
          // Verifikasi bahwa session memiliki data yang valid
          const userEmail = session.user.email;
          const userId = (session.user as any).id;
          
          if (!userEmail || !userId) {
            // Session tidak valid, jangan redirect
            setIsCheckingSession(false);
            return;
          }

          // User sudah login via NextAuth (Google OAuth), simpan ke localStorage dan redirect
          const userData = {
            id: userId,
            name: session.user.name || "",
            email: userEmail,
            phone: (session.user as any).phone || "",
            avatar: session.user.image || "/profile.svg"
          };

          const authData = {
            isLoggedIn: true,
            user: userData,
            loginTime: new Date().toISOString()
          };

          if (typeof window !== 'undefined') {
            localStorage.setItem("userToken", "google-oauth-token");
            localStorage.setItem("user", JSON.stringify(userData));
            localStorage.setItem("authData", JSON.stringify(authData));
          }

          if (onSuccess) {
            onSuccess(userEmail);
          } else {
            setShowRedirectLoader(true);
            setTimeout(() => {
              router.push("/");
              router.refresh();
            }, 1000);
          }
          return;
        }

        // Tidak ada session yang valid, tampilkan form login
        setIsCheckingSession(false);
        
      } catch (error) {
        console.error("Error checking session:", error);
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, [status, session, router, onSuccess, searchParams]);

  // Check for error from URL (Google OAuth errors)
  useEffect(() => {
    const errorParam = searchParams?.get("error")
    if (errorParam) {
      const errorMessage = ERROR_MESSAGES[errorParam] || ERROR_MESSAGES["default"]
      setError(errorMessage)
      setIsGoogleLoading(false)
      
      // Clear error from URL without page reload
      const url = new URL(window.location.href)
      url.searchParams.delete("error")
      window.history.replaceState({}, "", url.toString())
    }
  }, [searchParams])

  // Konfigurasi konten berdasarkan tipe user
  const userConfig = {
    user: {
      title: "Login ke Akun Anda",
      description: "Masukkan email atau nomor telepon untuk login ke akun",
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

  // Validasi nomor telepon format (Indonesia)
  const validatePhone = (phone: string) => {
    const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{7,11}$/
    return phoneRegex.test(phone.replace(/[\s-]/g, ''))
  }

  // Normalisasi nomor telepon ke format +62
  const normalizePhone = (phone: string): string => {
    let cleaned = phone.replace(/[\s-]/g, '')
    if (cleaned.startsWith('08')) {
      cleaned = '+62' + cleaned.substring(1)
    } else if (cleaned.startsWith('62')) {
      cleaned = '+' + cleaned
    } else if (!cleaned.startsWith('+62')) {
      cleaned = '+62' + cleaned
    }
    return cleaned
  }

  // Deteksi apakah input adalah email atau nomor telepon
  const isEmailInput = (input: string): boolean => {
    return input.includes('@')
  }

  // Handler untuk Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true)
      setError(null)
      
      // Gunakan signIn dengan redirect
      await signIn("google", {
        callbackUrl: "/",
        redirect: true
      })
      
    } catch (error) {
      console.error("Google sign in error:", error)
      setError("Terjadi kesalahan saat login dengan Google. Silakan coba lagi.")
      setIsGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    const trimmedIdentifier = identifier.trim()
    
    // Validasi input - bisa email atau nomor telepon
    const isEmail = isEmailInput(trimmedIdentifier)
    
    if (isEmail) {
      if (!validateEmail(trimmedIdentifier)) {
        setError("Format email tidak valid. Gunakan format email yang benar (contoh: user@example.com)")
        return
      }
    } else {
      if (!validatePhone(trimmedIdentifier)) {
        setError("Format nomor telepon tidak valid. Gunakan format Indonesia (contoh: 081234567890)")
        return
      }
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
        cred => cred.email === trimmedIdentifier && cred.password === password
      )
      
      if (!isValid) {
        setError("Email atau password admin salah.")
        return
      }
    }
    
    // Validasi khusus untuk mitra - cek dari dataVendor
    if (userType === "mitra") {
      const vendor = validateVendorLogin(trimmedIdentifier, password)
      
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
          onSuccess(trimmedIdentifier)
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
    
    // Untuk user - login via API dengan database check
    setIsLoading(true)
    
    try {
      // Normalisasi identifier
      let normalizedIdentifier = trimmedIdentifier
      if (!isEmail) {
        normalizedIdentifier = normalizePhone(trimmedIdentifier)
      }
      
      // API call untuk login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: isEmail ? normalizedIdentifier.toLowerCase() : normalizedIdentifier,
          password: password,
          isEmail: isEmail
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        // Handle berbagai tipe error
        switch (data.errorType) {
          case "EMAIL_NOT_REGISTERED":
            setError("Email belum terdaftar. Silakan daftar terlebih dahulu.")
            break
          case "PHONE_NOT_REGISTERED":
            setError("Nomor telepon belum terdaftar. Silakan daftar terlebih dahulu.")
            break
          case "GOOGLE_ACCOUNT":
            setError("Akun ini terdaftar melalui Google. Silakan login dengan Google.")
            break
          case "EMAIL_NOT_VERIFIED":
            setError("Email belum diverifikasi. Silakan verifikasi email Anda terlebih dahulu.")
            break
          case "ACCOUNT_INACTIVE":
            setError("Akun Anda tidak aktif. Silakan hubungi admin.")
            break
          case "INVALID_PASSWORD":
            setError("Password salah. Silakan coba lagi.")
            break
          default:
            setError(data.message || "Terjadi kesalahan saat login")
        }
        setIsLoading(false)
        return
      }
      
      // Login berhasil
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
        loginTime: new Date().toISOString()
      };

      // Simpan token dan data user
      if (typeof window !== 'undefined') {
        localStorage.setItem("userToken", data.token || "user-token");
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("authData", JSON.stringify(authData));
      }
      
      // Jika ada callback onSuccess (untuk modal), panggil
      if (onSuccess) {
        onSuccess(data.user.email)
        setIsLoading(false)
        return
      }
      
      // Tampilkan loader redirect untuk user
      setShowRedirectLoader(true)
      
      // Tunggu sebentar untuk menampilkan loader redirect
      setTimeout(() => {
        router.push("/")
        router.refresh()
      }, 1000)
      
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
      message: "Mengarahkan ke halaman utama..."
    }
  }

  const loaderText = getRedirectLoaderText()

  // Show loading while checking session (hanya saat status masih loading)
  if (isCheckingSession || status === "loading") {
    return (
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{config.title}</CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 border-4 border-[#7CE0A8] border-t-transparent rounded-full animate-spin"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

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
                  <FieldLabel htmlFor="identifier">
                    {userType === "user" ? "Email atau Nomor Telepon" : "Email"}
                  </FieldLabel>
                  <Input
                    id="identifier"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      userType === "admin" 
                        ? "admin@gmail.com" 
                        : userType === "mitra"
                        ? "mitra@marijasa.com"
                        : "Email atau 081234567890"
                    }
                    autoComplete="email"
                    disabled={isLoading || isGoogleLoading || showRedirectLoader}
                  />
                  {userType === "user" && (
                    <p className="text-xs text-neutral-500 mt-1">
                      Gunakan email atau nomor telepon yang terdaftar
                    </p>
                  )}
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
                    disabled={isLoading || isGoogleLoading || showRedirectLoader}
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Password harus minimal 8 karakter
                  </p>
                </Field>
                <Field>
                  <Button 
                    type="submit" 
                    disabled={isLoading || isGoogleLoading || showRedirectLoader}
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
                    ) : showRedirectLoader ? "Mengalihkan..." : "Login"}
                  </Button>
                  
                  {userType !== "admin" && userType !== "mitra" && !showRedirectLoader && (
                    <>
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
                            Login dengan Google
                          </>
                        )}
                      </Button>
                    </>
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