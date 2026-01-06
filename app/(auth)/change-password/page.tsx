"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Password strength logic
  const passwordStrength = useMemo(() => {
    if (!password) return { strength: 0, label: "", color: "" };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const levels = [
      { strength: 0, label: "Terlalu pendek", color: "bg-red-500" },
      { strength: 1, label: "Lemah", color: "bg-red-500" },
      { strength: 2, label: "Sedang", color: "bg-yellow-500" },
      { strength: 3, label: "Kuat", color: "bg-blue-500" },
      { strength: 4, label: "Sangat Kuat", color: "bg-green-500" },
      { strength: 5, label: "Ekstrem", color: "bg-[#7CE0A8]" },
    ];

    return levels[strength];
  }, [password]);

  const canSubmit = useMemo(() => {
    return password.length >= 8 && confirmPassword.length >= 8 && !isLoading;
  }, [password, confirmPassword, isLoading]);

  const passwordMatch = useMemo(() => password === confirmPassword, [password, confirmPassword]);

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const onPopState = () => router.replace("/login");
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Gagal mengubah password.");
        setIsLoading(false);
        return;
      }

      setSuccess("Password berhasil diubah. Silakan login.");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => router.replace("/login"), 1200);
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#7CE0A8] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-[#7CE0A8] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        
        {/* Circuit Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-5" preserveAspectRatio="none">
          <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#7CE0A8" strokeWidth="0.5"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left side - Tech Character (Secure Mode) */}
        <div className="hidden lg:flex justify-center items-center">
          <div className="relative w-full h-96">
            <svg className="w-full h-full animate-float-slow" viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Head */}
              <circle cx="150" cy="80" r="35" fill="#FDB94E" className="animate-bounce-gentle"/>
              <circle cx="140" cy="75" r="4" fill="#333"/>
              <circle cx="160" cy="75" r="4" fill="#333"/>
              <path d="M 140 85 Q 150 92 160 85" stroke="#333" strokeWidth="2" fill="none"/>
              
              {/* Tech Glasses - Glowing */}
              <rect x="125" y="65" width="20" height="15" rx="3" fill="none" stroke="#7CE0A8" strokeWidth="2.5" opacity="0.9" className="animate-pulse"/>
              <rect x="155" y="65" width="20" height="15" rx="3" fill="none" stroke="#7CE0A8" strokeWidth="2.5" opacity="0.9" className="animate-pulse"/>
              <line x1="145" y1="72" x2="155" y2="72" stroke="#7CE0A8" strokeWidth="2" opacity="0.7"/>
              
              {/* Hard hat */}
              <ellipse cx="150" cy="50" rx="40" ry="20" fill="#FF6B6B"/>
              <rect x="130" y="45" width="40" height="8" rx="2" fill="#FF6B6B"/>
              <path d="M 130 50 Q 150 48 170 50" stroke="#FFE66D" strokeWidth="2" fill="none"/>
              
              {/* Body - Tech uniform with glow */}
              <defs><radialGradient id="bodyGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#7CE0A8" stopOpacity="0.3"/><stop offset="100%" stopColor="#7CE0A8" stopOpacity="0"/></radialGradient></defs>
              <rect x="115" y="120" width="70" height="60" rx="5" fill="#4ECDC4" className="animate-bounce-gentle"/>
              <rect x="115" y="120" width="70" height="60" rx="5" fill="url(#bodyGlow)"/>
              <rect x="125" y="130" width="50" height="40" fill="#2A9D8F" rx="3"/>
              
              {/* Arms holding secure items */}
              <g className="animate-arm-idle" style={{transformOrigin: "120px 140px"}}>
                <rect x="85" y="125" width="35" height="20" rx="10" fill="#FDB94E"/>
                <g transform="translate(70, 110)">
                  <circle cx="12" cy="8" r="8" fill="none" stroke="#7CE0A8" strokeWidth="2.5"/>
                  <rect x="18" y="5" width="12" height="6" rx="1" fill="#7CE0A8"/>
                </g>
              </g>
              
              <rect x="120" y="185" width="30" height="50" fill="#2C3E50"/>
              <rect x="155" y="185" width="30" height="50" fill="#2C3E50"/>
              <ellipse cx="135" cy="240" rx="18" ry="12" fill="#1A1A1A"/>
              <ellipse cx="170" cy="240" rx="18" ry="12" fill="#1A1A1A"/>
            </svg>

            <div className="absolute top-10 right-0 bg-gradient-to-r from-[#7CE0A8] to-[#5ECFA3] text-white px-4 py-2 rounded-full text-sm font-semibold animate-pulse shadow-lg">🛡️ Enkripsi Tingkat Lanjut</div>
            <div className="absolute bottom-20 left-0 bg-gradient-to-r from-[#FFD93D] to-[#FDB94E] text-white px-4 py-2 rounded-full text-sm font-semibold animate-bounce-slow shadow-lg">✨ Pembaruan Aman</div>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#7CE0A8] via-[#5ECFA3] to-[#4ECDC4] rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition duration-1000 animate-pulse"></div>
            
            <div className="relative bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 space-y-6 border border-white/40">
              <div className="text-center space-y-3">
                <h1 className="text-4xl font-bold text-slate-900">Buat Password Baru</h1>
                <p className="text-slate-600 text-lg">Perkuat keamanan akun dengan password baru.</p>
              </div>

              {error && <div className="rounded-xl border-l-4 border-l-red-500 bg-red-50 p-4 text-red-700 animate-shake">{error}</div>}
              {success && <div className="rounded-xl border-l-4 border-l-green-500 bg-green-50 p-4 text-green-700">{success}</div>}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative group">
                  <label className="block text-sm font-semibold text-slate-800 mb-3">Password Baru</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if(error) setError(null); }}
                      placeholder="Minimal 8 karakter"
                      className="block w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl bg-white/60 focus:border-[#7CE0A8] focus:bg-white outline-none transition-all shadow-sm"
                    />
                  </div>
                  
                  {password && (
                    <div className="mt-3 space-y-2">
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${passwordStrength.color}`} style={{width: `${(passwordStrength.strength + 1) * 16.67}%`}}></div>
                      </div>
                      <div className="flex justify-between text-xs"><span className="text-slate-500">Kekuatan:</span><span className="font-semibold">{passwordStrength.label}</span></div>
                    </div>
                  )}

                  <div className="mt-3 p-3 bg-slate-50 rounded-lg space-y-1.5">
                    <p className="text-xs text-slate-600 font-semibold mb-2">Syarat:</p>
                    <div className={`text-xs ${password.length >= 8 ? "text-green-600" : "text-slate-400"}`}>✓ Minimal 8 karakter</div>
                    <div className={`text-xs ${/[A-Z]/.test(password) ? "text-green-600" : "text-slate-400"}`}>✓ Huruf besar (A-Z)</div>
                    <div className={`text-xs ${/[0-9]/.test(password) ? "text-green-600" : "text-slate-400"}`}>✓ Angka (0-9)</div>
                  </div>
                </div>

                <div className="relative group">
                  <label className="block text-sm font-semibold text-slate-800 mb-3">Konfirmasi Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password"
                    className={`block w-full px-4 py-3.5 border-2 rounded-xl bg-white/60 focus:bg-white outline-none transition-all shadow-sm ${confirmPassword && passwordMatch ? "border-green-500" : confirmPassword ? "border-red-500" : "border-slate-200 focus:border-[#7CE0A8]"}`}
                  />
                  {confirmPassword && (
                    <div className={`mt-2 text-xs font-medium ${passwordMatch ? "text-green-600" : "text-red-600"}`}>
                      {passwordMatch ? "✓ Password cocok!" : "✕ Password tidak cocok"}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full py-3.5 px-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-[#7CE0A8] to-[#5ECFA3] hover:from-[#6DD09A] hover:to-[#4DB892] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-[#7CE0A8]/30"
                >
                  {isLoading ? "Menyimpan..." : "Simpan Password Baru"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
