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
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { LoaderTwo } from "@/app/components/transition/loader"

type UserType = "user" | "mitra" | "admin"

interface LoginFormProps extends React.ComponentProps<"div"> {
  userType?: UserType
}

export function LoginForm({
  className,
  userType = "user",
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
      description: "Masukkan email Anda untuk login sebagai mitra",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // Validasi khusus untuk admin
    if (userType === "admin") {
      if (!validateEmail(email)) {
        setError("Format email tidak valid. Gunakan format email yang benar (contoh: admin@gmail.com)")
        return
      }
      
      if (password.length < 8) {
        setError("Password minimal 8 karakter")
        return
      }
      
      // Validasi dummy - bisa diganti dengan API call
      const dummyAdminCredentials = [
        { email: "Sejasa@gmail.com", password: "admin1234" },
      ]
      
      const isValid = dummyAdminCredentials.some(
        cred => cred.email === email && cred.password === password
      )
      
      if (!isValid) {
        setError("Email atau password salah.")
        return
      }
    }
    
    setIsLoading(true)
    
    try {
      // Simulasi API call
      const response = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true, token: "dummy-token" })
        }, 1500)
      })
      
      // Simpan token di localStorage berdasarkan user type
      if (typeof window !== 'undefined') {
        if (userType === "admin") {
          localStorage.setItem('adminToken', 'dummy-token')
          localStorage.setItem('adminUser', JSON.stringify({ 
            email,
            name: "Administrator",
            role: "admin"
          }))
        } else if (userType === "mitra") {
          localStorage.setItem('mitraToken', 'dummy-token')
          localStorage.setItem('mitraUser', JSON.stringify({ email }))
        }
      }
      
      // Tampilkan loader redirect
      setShowRedirectLoader(true)
      
      // Tunggu sebentar untuk menampilkan loader redirect
      setTimeout(() => {
        // Redirect berdasarkan user type
        if (userType === "mitra") {
          router.push("/mitra/dashboard")
        } else if (userType === "user") {
          router.push(`/login/otp?email=${encodeURIComponent(email)}&type=${userType}`)
        } else if (userType === "admin") {
          router.push("/admin/dashboard")
        }
        router.refresh()
      }, 1000)
      
    } catch (error) {
      console.error("Login error:", error)
      setError("Terjadi kesalahan saat login. Silakan coba lagi.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {showRedirectLoader && (
        <div className="fixed inset-0 bg-white/90 dark:bg-neutral-900/90 z-50 flex flex-col items-center justify-center gap-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-neutral-800 dark:text-white mb-2">
              Login Berhasil!
            </h2>
            <p className="text-neutral-600 dark:text-neutral-300">
              Mengarahkan ke dashboard admin...
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
                    placeholder={userType === "admin" ? "admin@gmail.com" : "masukkan email"}
                    autoComplete="email"
                    disabled={isLoading || showRedirectLoader}
                  />
                </Field>
                <Field>
                  <div className="flex items-center">
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    {userType !== "admin" && (
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
                    placeholder={userType === "admin" ? "minimal 8 karakter" : "masukkan password"}
                    autoComplete="current-password"
                    disabled={isLoading || showRedirectLoader}
                  />
                  {userType === "admin" && (
                    <p className="text-xs text-neutral-500 mt-1">
                      Password harus minimal 8 karakter
                    </p>
                  )}
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
                        Memproses...
                      </>
                    ) : showRedirectLoader ? "Mengalihkan..." : "Login"}
                  </Button>
                  
                  {userType !== "admin" && !showRedirectLoader && (
                    <Button 
                      variant="outline" 
                      type="button"
                      disabled={isLoading}
                      className="w-full mt-3 border-[#7CE0A8] text-[#7CE0A8] hover:bg-[#7CE0A8]/10"
                    >
                      Login dengan Google
                    </Button>
                  )}
                  
                  {config.registerLink && !showRedirectLoader && (
                    <FieldDescription className="text-center mt-4">
                      Belum punya akun?{" "}
                      <Link 
                        href={config.registerLink} 
                        className="text-[#7CE0A8] hover:text-[#6bcb96] underline-offset-4 hover:underline"
                      >
                        {config.registerText}
                      </Link>
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