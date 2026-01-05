"use client"

import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { MinusIcon } from "lucide-react"

import { cn } from "../lib/utils"

function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        "flex items-center gap-1.5 sm:gap-2 md:gap-3 has-disabled:opacity-50 transition-opacity duration-200",
        containerClassName
      )}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  )
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn("flex items-center justify-center", className)}
      {...props}
    />
  )
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  index: number
}) {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {}

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        // Base styles - Responsive sizing
        "relative flex h-10 w-8 sm:h-12 sm:w-10 md:h-14 md:w-12 items-center justify-center",
        "text-base sm:text-lg md:text-xl font-semibold",
        // Border & background
        "border-2 border-neutral-300 dark:border-neutral-600 rounded-lg",
        "bg-white dark:bg-neutral-800",
        // Transitions
        "transition-all duration-200 outline-none",
        // Active state dengan warna custom #7CE0A8
        "data-[active=true]:border-[#7CE0A8] dark:data-[active=true]:border-[#7CE0A8]",
        "data-[active=true]:bg-[#7CE0A8]/5 dark:data-[active=true]:bg-[#7CE0A8]/10",
        "data-[active=true]:ring-1 sm:data-[active=true]:ring-2 data-[active=true]:ring-[#7CE0A8]/30",
        "data-[active=true]:shadow-sm sm:data-[active=true]:shadow-md",
        // Filled state
        "has-[input:not(:placeholder-shown)]:border-[#7CE0A8] dark:has-[input:not(:placeholder-shown)]:border-[#7CE0A8]",
        "has-[input:not(:placeholder-shown)]:bg-[#7CE0A8]/5 dark:has-[input:not(:placeholder-shown)]:bg-[#7CE0A8]/10",
        // Text color
        "text-neutral-900 dark:text-white",
        // Disabled state
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink h-4 sm:h-5 md:h-6 w-0.5 bg-[#7CE0A8] dark:bg-[#7CE0A8] duration-1000" />
        </div>
      )}
    </div>
  )
}

function InputOTPSeparator({ ...props }: React.ComponentProps<"div">) {
  return (
    <div 
      data-slot="input-otp-separator" 
      role="separator"
      className="text-neutral-400 dark:text-neutral-600"
      {...props}
    >
      <MinusIcon className="w-3 h-3 sm:w-4 sm:h-4" />
    </div>
  )
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }