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
      description: "Masukkan kredensial admin Anda untuk login",
      registerLink: null, // Admin tidak punya link daftar
      registerText: null,
    },
  }

  const config = userConfig[userType]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulasi proses login
    setTimeout(() => {
      setIsLoading(false)
      // Redirect ke halaman OTP login dengan userType
      router.push(`/login/otp?email=${encodeURIComponent(email)}&type=${userType}`)
    }, 1000)
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>{config.title}</CardTitle>
          <CardDescription>
            {config.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                  suppressHydrationWarning
                />
              </Field>
              <Field>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className={cn(
                    "bg-[#7CE0A8] hover:bg-[#6bcb96] text-white",
                    "focus:ring-[#7CE0A8] focus:ring-offset-2",
                    "transition-colors duration-200"
                  )}
                  suppressHydrationWarning
                >
                  {isLoading ? "Memproses..." : "Login"}
                </Button>
                
                {/* Hanya tampilkan Google login untuk user biasa dan mitra */}
                {userType !== "admin" && (
                  <Button 
                    variant="outline" 
                    type="button"
                    className="border-[#7CE0A8] text-[#7CE0A8] hover:bg-[#7CE0A8]/10"
                    suppressHydrationWarning
                  >
                    Login dengan Google
                  </Button>
                )}
                
                {/* Hanya tampilkan link register jika tersedia */}
                {config.registerLink && (
                  <FieldDescription className="text-center">
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
  )
}