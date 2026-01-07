// app/components/ui/popup-login-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./button";
import { Input } from "./input";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Shield,
  Smartphone,
  UserPlus,
  X,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { signIn } from "next-auth/react";
import { useAuth } from "@/app/components/contexts/AuthContext";

interface PopupLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (email: string) => void;
  onRegisterClick?: () => void;
  title?: string;
  description?: string;
}

export function PopupLoginModal({
  isOpen,
  onClose,
  onSuccess,
  onRegisterClick,
  title = "Selamat Datang Kembali!",
  description = "Masuk untuk melanjutkan dan akses semua fitur kami"
}: PopupLoginModalProps) {
  const router = useRouter();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "success">("form");

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIdentifier("");
      setPassword("");
      setError(null);
      setSuccessMessage(null);
      setStep("form");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Simple validation
      if (!identifier.trim()) {
        setError("Email atau nomor telepon wajib diisi");
        setIsLoading(false);
        return;
      }

      if (!password) {
        setError("Password wajib diisi");
        setIsLoading(false);
        return;
      }

      // API call to login
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          isEmail: identifier.includes("@")
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        switch (data.errorType) {
          case "EMAIL_NOT_REGISTERED":
            setError("Email belum terdaftar. Silakan daftar terlebih dahulu.");
            break;
          case "PHONE_NOT_REGISTERED":
            setError("Nomor telepon belum terdaftar. Silakan daftar terlebih dahulu.");
            break;
          case "GOOGLE_ACCOUNT":
            setError("Akun ini terdaftar melalui Google. Silakan login dengan Google.");
            break;
          case "INVALID_PASSWORD":
            setError("Password salah. Silakan coba lagi.");
            break;
          default:
            setError(data.message || "Terjadi kesalahan saat login");
        }
        setIsLoading(false);
        return;
      }

      // Login successful
      if (data.user) {
        login(data.user);
        setSuccessMessage("Login berhasil! Mengarahkan...");
        setStep("success");

        // Close modal and redirect after delay
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(data.user.email);
          } else {
            window.location.reload();
          }
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Terjadi kesalahan saat login. Silakan coba lagi.");
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setError(null);

      await signIn("google", {
        callbackUrl: "/api/auth/google/set-cookies",
        redirect: true,
      });
    } catch (error) {
      console.error("Google sign in error:", error);
      setError("Terjadi kesalahan saat login dengan Google");
      setIsGoogleLoading(false);
    }
  };

  const handleRegister = () => {
    onClose();
    if (onRegisterClick) {
      onRegisterClick();
    } else {
      router.push("/register");
    }
  };

  const handleForgotPassword = () => {
    onClose();
    router.push("/forget-password");
  };

  // Animation variants
  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: 20
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        damping: 25,
        stiffness: 300
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.2
      }
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={backdropVariants}
          onClick={onClose}
        >
          {/* Backdrop with gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-black/10 backdrop-blur-sm" />
          
          <motion.div
            className="relative w-full max-w-[440px] mx-auto max-h-[calc(100vh-24px)] sm:max-h-[calc(100vh-32px)] md:max-h-[calc(100vh-48px)] overflow-y-auto"
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl sm:rounded-3xl pointer-events-none">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#7CE0A8]/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#7CE0A8]/10 rounded-full blur-3xl" />
              <motion.div
                className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-[#7CE0A8]/5 to-transparent rounded-full"
                animate={{
                  rotate: 360,
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  rotate: {
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                  },
                  scale: {
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
              />
            </div>

            {/* Modal content */}
            <div className="relative bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-white/20">
              {/* Header with gradient */}
              <div className="relative p-4 sm:p-5 md:p-6 bg-gradient-to-br from-[#7CE0A8]/10 via-white to-white dark:from-[#7CE0A8]/10 dark:via-neutral-900 dark:to-neutral-900">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="p-1.5 sm:p-2 rounded-full bg-gradient-to-br from-[#7CE0A8] to-emerald-400"
                    >
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </motion.div>
                    <h2 className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-[#7CE0A8] to-emerald-500 bg-clip-text text-transparent">
                      MariJasa
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 sm:p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                    aria-label="Tutup"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-600 dark:text-neutral-400" />
                  </button>
                </div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-neutral-900 dark:text-white mb-1.5 sm:mb-2">
                    {title}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                    {description}
                  </p>
                </motion.div>
              </div>

              {/* Success State */}
              <AnimatePresence mode="wait">
                {step === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="p-6 sm:p-8 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 10 }}
                      className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-[#7CE0A8]/20 to-[#7CE0A8]/10 flex items-center justify-center"
                    >
                      <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-[#7CE0A8]" />
                    </motion.div>
                    <h4 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white mb-2">
                      Login Berhasil! 🎉
                    </h4>
                    <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mb-4 sm:mb-6">
                      {successMessage || "Selamat datang kembali di MariJasa!"}
                    </p>
                    <motion.div
                      animate={{ 
                        scale: [1, 1.05, 1],
                        opacity: [0.7, 1, 0.7]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#7CE0A8]"
                    >
                      <div className="w-2 h-2 rounded-full bg-[#7CE0A8]" />
                      <div className="w-2 h-2 rounded-full bg-[#7CE0A8]" />
                      <div className="w-2 h-2 rounded-full bg-[#7CE0A8]" />
                      Mengalihkan...
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-4 sm:p-5 md:p-6"
                  >
                    {/* Error Message */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 sm:mb-5 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-red-50 to-red-50/50 dark:from-red-950/30 dark:to-red-950/10 border border-red-200 dark:border-red-800"
                      >
                        <div className="flex items-start gap-2 sm:gap-3">
                          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs sm:text-sm text-red-700 dark:text-red-400">{error}</p>
                        </div>
                      </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                      {/* Email/Phone Input */}
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#7CE0A8]/10 to-transparent rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                        <label className="block text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 sm:mb-2">
                          Email atau Nomor Telepon
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-neutral-400 pointer-events-none z-10" />
                          <Input
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder="contoh@email.com atau 081234567890"
                            className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:border-[#7CE0A8] focus:ring-2 focus:ring-[#7CE0A8]/20 transition-all duration-300"
                            disabled={isLoading || isGoogleLoading}
                          />
                        </div>
                      </div>

                      {/* Password Input */}
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#7CE0A8]/10 to-transparent rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                        <label className="block text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 sm:mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-neutral-400 pointer-events-none z-10" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Masukkan password Anda"
                            className="w-full pl-10 sm:pl-12 pr-12 sm:pr-13 md:pr-13 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:border-[#7CE0A8] focus:ring-2 focus:ring-[#7CE0A8]/20 transition-all duration-300"
                            disabled={isLoading || isGoogleLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-0 sm:right-3 md:right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors z-10 p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                            ) : (
                              <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                            )}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-[#7CE0A8] hover:text-emerald-600 transition-colors inline-flex items-center gap-1"
                        >
                          <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                          Lupa password?
                        </button>
                      </div>

                      {/* Submit Button */}
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          type="submit"
                          disabled={isLoading || isGoogleLoading}
                          className="w-full bg-gradient-to-r from-[#7CE0A8] to-emerald-500 hover:from-emerald-500 hover:to-[#7CE0A8] text-white font-semibold py-3 sm:py-3.5 text-sm sm:text-base rounded-xl shadow-lg shadow-[#7CE0A8]/20 transition-all duration-300 flex items-center justify-center gap-2 group"
                        >
                          {isLoading ? (
                            <>
                              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Memproses...</span>
                            </>
                          ) : (
                            <>
                              <span>Masuk Sekarang</span>
                              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </form>

                    {/* Divider */}
                    <div className="relative my-4 sm:my-5">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-neutral-200 dark:border-neutral-700" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-3 sm:px-4 bg-white dark:bg-neutral-900 text-neutral-500">
                          Atau lanjutkan dengan
                        </span>
                      </div>
                    </div>

                    {/* Google Sign In */}
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading || isGoogleLoading}
                        className="w-full border-2 border-neutral-200 dark:border-neutral-700 hover:border-[#7CE0A8] hover:bg-[#7CE0A8]/5 py-3 sm:py-3.5 text-sm sm:text-base rounded-xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3"
                      >
                        {isGoogleLoading ? (
                          <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-[#7CE0A8] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span>Masuk dengan Google</span>
                          </>
                        )}
                      </Button>
                    </motion.div>

                    {/* Register Link */}
                    <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-neutral-100 dark:border-neutral-800">
                      <div className="text-center">
                        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mb-2.5 sm:mb-3">
                          Belum punya akun? Mulai petualangan Anda di MariJasa!
                        </p>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={handleRegister}
                            className="w-full bg-gradient-to-r from-[#7CE0A8]/10 via-[#7CE0A8]/5 to-transparent border-2 border-[#7CE0A8]/30 hover:border-[#7CE0A8] hover:bg-[#7CE0A8]/10 text-[#7CE0A8] font-semibold py-2.5 sm:py-3 text-sm sm:text-base rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group"
                          >
                            <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>Daftar Akun Baru</span>
                            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </motion.div>
                      </div>
                    </div>

                    {/* Security Badge */}
                    <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-neutral-100 dark:border-neutral-800">
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-neutral-500">
                        <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Keamanan terenkripsi • Data Anda terlindungi</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Floating elements */}
              <motion.div
                className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-[#7CE0A8] to-emerald-400"
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 180, 360]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div
                className="absolute -bottom-2 -left-2 sm:-bottom-3 sm:-left-3 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-gradient-to-br from-emerald-400 to-[#7CE0A8]"
                animate={{
                  y: [0, 10, 0],
                  rotate: [0, -180, -360]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}