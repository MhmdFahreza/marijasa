import { OTPForm } from "@/app/components/ui/otp-form"

export default function RegisterOTPPage({
  searchParams,
}: {
  searchParams?: { email?: string }
}) {
  const email = searchParams?.email || ""

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-xs">
        <OTPForm type="register" email={email} />
      </div>
    </div>
  )
}