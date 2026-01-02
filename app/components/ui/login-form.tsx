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
import { validateVendorLogin, getCategoryFromTags } from "@/app/data/dataVendor"

type UserType = "user" | "mitra" | "admin"

interface LoginFormProps extends React.ComponentProps<"div"> {
  userType?: UserType
  onSuccess?: (email: string) => void  // Changed from () => void
}

export function LoginForm({
  className,
  userType = "user",
  onSuccess,
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
          onSuccess(email)  // Pass email parameter
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
        } else {
          // Untuk user biasa
          localStorage.setItem('userToken', 'dummy-token')
          localStorage.setItem('user', JSON.stringify({
            email,
            name: "Pengguna",
            role: "user"
          }))
        }
      }

      // Jika ada callback onSuccess (untuk modal), panggil
      if (onSuccess) {
        onSuccess(email)  // Pass email parameter
        setIsLoading(false)
        return
      }
      // Hanya tampilkan loader redirect untuk admin
      if (userType === "admin") {
        setShowRedirectLoader(true)

        // Tunggu sebentar untuk menampilkan loader redirect
        setTimeout(() => {
          router.push("/admin/dashboard")
          router.refresh()
        }, 1000)
      } else {
        // Untuk user biasa, langsung redirect ke OTP tanpa loading overlay
        router.push(`/login/otp?email=${encodeURIComponent(email)}&type=${userType}`)
      }

    } catch (error) {
      console.error("Login error:", error)
      setError("Terjadi kesalahan saat login. Silakan coba lagi.")
      setIsLoading(false)
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