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

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulasi proses login
    setTimeout(() => {
      setIsLoading(false)
      // Redirect ke halaman OTP login
      router.push(`/login/otp?email=${encodeURIComponent(email)}`)
    }, 1000)
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login ke akun Anda</CardTitle>
          <CardDescription>
            Masukkan email Anda untuk login ke akun
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
                  placeholder="contoh@email.com"
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm text-[#7CE0A8] hover:text-[#6bcb96] underline-offset-4 hover:underline"
                  >
                    Lupa password?
                  </a>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                >
                  {isLoading ? "Memproses..." : "Login"}
                </Button>
                <Button 
                  variant="outline" 
                  type="button"
                  className="border-[#7CE0A8] text-[#7CE0A8] hover:bg-[#7CE0A8]/10"
                >
                  Login dengan Google
                </Button>
                <FieldDescription className="text-center">
                  Belum punya akun?{" "}
                  <Link 
                    href="/register" 
                    className="text-[#7CE0A8] hover:text-[#6bcb96] underline-offset-4 hover:underline"
                  >
                    Daftar
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}