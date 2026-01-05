"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function isEmail(value: string) {
  return value.includes("@");
}

export default function ForgetPasswordPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const identifierType = useMemo(() => {
    const v = identifier.trim();
    if (!v) return null;
    return isEmail(v) ? "email" : "phone";
  }, [identifier]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const value = identifier.trim();

      if (!value) {
        setError("Email atau nomor telepon wajib diisi.");
        return;
      }

      // Validasi ringan di client
      if (identifierType === "email") {
        if (!value.includes("@") || value.length < 6) {
          setError("Format email tidak valid.");
          return;
        }
      } else {
        // Basic validation phone: minimal 8 digit angka (boleh +62)
        const cleaned = value.replace(/[()\-\s]/g, "");
        const digitsOnly = cleaned.replace(/^\+/, "").replace(/\D/g, "");
        if (digitsOnly.length < 8) {
          setError("Format nomor telepon tidak valid.");
          return;
        }
      }

      setIsLoading(true);

      try {
        const res = await fetch("/api/auth/request-reset-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: value }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.message || "Gagal memproses permintaan.");
          return;
        }

        router.push(
          `/forget-password/otp?email=${encodeURIComponent(
            data.otpTargetEmail
          )}&type=reset_password`
        );
      } catch (err) {
        console.error(err);
        setError("Terjadi kesalahan. Silakan coba lagi.");
      } finally {
        setIsLoading(false);
      }
    },
    [identifier, identifierType, router]
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-gray-200">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Lupa Password</h1>
            <p className="text-gray-600">
              Masukkan email atau nomor telepon yang terdaftar. Kami akan mengirim OTP untuk reset password.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Email atau nomor telepon
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="you@example.com atau 08xxxxxxxxxx"
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
              <p className="text-xs text-gray-500">
                Kamu cukup isi salah satu. Sistem otomatis mendeteksi email atau nomor telepon.
              </p>
            </div>

            <button
              type="submit"
              disabled={!identifier.trim() || isLoading}
              className="w-full py-3 px-4 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Memproses..." : "Lanjut"}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Kembali ke Login
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          Pastikan email kamu aktif. OTP akan dikirim melalui email.
        </div>
      </div>
    </div>
  );
}
