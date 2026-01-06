"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

function isEmail(value: string) {
  return value.includes("@");
}

export default function ForgetPasswordPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Array<{
    left: string;
    top: string;
    opacity: number;
    animationDelay: string;
    animationDuration: string;
  }>>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    
    // Generate particles hanya di client side
    const generatedParticles = [...Array(20)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      opacity: 0.1 + Math.random() * 0.2,
      animationDelay: `${Math.random() * 5}s`,
      animationDuration: `${8 + Math.random() * 4}s`,
    }));
    setParticles(generatedParticles);
    
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

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

      if (identifierType === "email") {
        if (!value.includes("@") || value.length < 6) {
          setError("Format email tidak valid.");
          return;
        }
      } else {
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-[#E8FDF5] via-[#F0FFF9] to-[#E5F9F0]">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Gradient Orbs */}
        <div 
          className="absolute top-[10%] left-[5%] w-[500px] h-[500px] rounded-full opacity-30 animate-orb-float-1"
          style={{
            background: "radial-gradient(circle, rgba(124, 224, 168, 0.4) 0%, rgba(124, 224, 168, 0.1) 50%, transparent 70%)",
            transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
          }}
        />
        <div 
          className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full opacity-25 animate-orb-float-2"
          style={{
            background: "radial-gradient(circle, rgba(94, 207, 163, 0.4) 0%, rgba(94, 207, 163, 0.1) 50%, transparent 70%)",
            transform: `translate(${mousePosition.x * -0.3}px, ${mousePosition.y * -0.3}px)`,
          }}
        />
        <div 
          className="absolute top-[50%] left-[50%] w-[600px] h-[600px] rounded-full opacity-20 animate-orb-float-3"
          style={{
            background: "radial-gradient(circle, rgba(78, 205, 196, 0.3) 0%, transparent 60%)",
            transform: `translate(-50%, -50%) translate(${mousePosition.x * 0.2}px, ${mousePosition.y * 0.2}px)`,
          }}
        />

        {/* Geometric Patterns */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" preserveAspectRatio="none">
          <defs>
            <pattern id="hexGrid" width="60" height="52" patternUnits="userSpaceOnUse">
              <path d="M30 0 L60 15 L60 37 L30 52 L0 37 L0 15 Z" fill="none" stroke="#7CE0A8" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexGrid)" />
        </svg>

        {/* Floating 3D Cubes */}
        <div className="absolute top-[15%] right-[15%] animate-float-3d-1">
          <div className="cube-3d">
            <div className="cube-face cube-front"></div>
            <div className="cube-face cube-back"></div>
            <div className="cube-face cube-right"></div>
            <div className="cube-face cube-left"></div>
            <div className="cube-face cube-top"></div>
            <div className="cube-face cube-bottom"></div>
          </div>
        </div>

        <div className="absolute bottom-[20%] left-[10%] animate-float-3d-2">
          <div className="cube-3d cube-small">
            <div className="cube-face cube-front"></div>
            <div className="cube-face cube-back"></div>
            <div className="cube-face cube-right"></div>
            <div className="cube-face cube-left"></div>
            <div className="cube-face cube-top"></div>
            <div className="cube-face cube-bottom"></div>
          </div>
        </div>

        <div className="absolute top-[60%] right-[8%] animate-float-3d-3">
          <div className="cube-3d cube-tiny">
            <div className="cube-face cube-front"></div>
            <div className="cube-face cube-back"></div>
            <div className="cube-face cube-right"></div>
            <div className="cube-face cube-left"></div>
            <div className="cube-face cube-top"></div>
            <div className="cube-face cube-bottom"></div>
          </div>
        </div>

        {/* Floating Spheres */}
        <div 
          className="absolute top-[25%] left-[20%] w-16 h-16 rounded-full animate-sphere-float-1"
          style={{
            background: "linear-gradient(135deg, rgba(124, 224, 168, 0.6) 0%, rgba(94, 207, 163, 0.3) 50%, rgba(78, 205, 196, 0.1) 100%)",
            boxShadow: "inset -5px -5px 15px rgba(255,255,255,0.8), inset 5px 5px 15px rgba(124, 224, 168, 0.3), 0 10px 30px rgba(124, 224, 168, 0.2)",
          }}
        />
        <div 
          className="absolute bottom-[30%] right-[25%] w-12 h-12 rounded-full animate-sphere-float-2"
          style={{
            background: "linear-gradient(135deg, rgba(94, 207, 163, 0.5) 0%, rgba(124, 224, 168, 0.2) 100%)",
            boxShadow: "inset -4px -4px 12px rgba(255,255,255,0.8), inset 4px 4px 12px rgba(94, 207, 163, 0.3), 0 8px 25px rgba(94, 207, 163, 0.15)",
          }}
        />
        <div 
          className="absolute top-[70%] left-[15%] w-8 h-8 rounded-full animate-sphere-float-3"
          style={{
            background: "linear-gradient(135deg, rgba(78, 205, 196, 0.5) 0%, rgba(124, 224, 168, 0.2) 100%)",
            boxShadow: "inset -3px -3px 10px rgba(255,255,255,0.9), inset 3px 3px 10px rgba(78, 205, 196, 0.3), 0 6px 20px rgba(78, 205, 196, 0.15)",
          }}
        />

        {/* Floating Keys/Lock Icons */}
        <div className="absolute top-[12%] left-[30%] animate-icon-float-1 opacity-20">
          <svg className="w-12 h-12 text-[#7CE0A8]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
          </svg>
        </div>
        <div className="absolute bottom-[15%] right-[20%] animate-icon-float-2 opacity-15">
          <svg className="w-16 h-16 text-[#5ECFA3]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
        </div>

        {/* Floating Rings */}
        <div className="absolute top-[40%] right-[5%] animate-ring-spin-1">
          <div className="w-20 h-20 rounded-full border-4 border-[#7CE0A8]/20 border-t-[#7CE0A8]/60"></div>
        </div>
        <div className="absolute bottom-[40%] left-[5%] animate-ring-spin-2">
          <div className="w-14 h-14 rounded-full border-3 border-[#5ECFA3]/15 border-b-[#5ECFA3]/50"></div>
        </div>

        {/* Particle Dots - Diperbaiki untuk menghindari hydration mismatch */}
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-[#7CE0A8] animate-particle"
            style={{
              left: particle.left,
              top: particle.top,
              opacity: particle.opacity,
              animationDelay: particle.animationDelay,
              animationDuration: particle.animationDuration,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left side - Enhanced 3D Character */}
        <div className="hidden lg:flex justify-center items-center">
          <div 
            className="relative w-full h-[500px]"
            style={{
              transform: `perspective(1000px) rotateY(${mousePosition.x * 0.1}deg) rotateX(${mousePosition.y * -0.1}deg)`,
              transition: "transform 0.1s ease-out",
            }}
          >
            {/* 3D Platform */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 h-8 animate-platform-float">
              <div 
                className="w-full h-full rounded-full"
                style={{
                  background: "linear-gradient(180deg, rgba(124, 224, 168, 0.3) 0%, rgba(124, 224, 168, 0.1) 100%)",
                  boxShadow: "0 10px 40px rgba(124, 224, 168, 0.3), inset 0 2px 10px rgba(255,255,255,0.5)",
                  transform: "rotateX(60deg)",
                }}
              />
            </div>

            {/* Main Character SVG - Enhanced Robot/Security Guard */}
            <svg 
              className="w-full h-full animate-character-float" 
              viewBox="0 0 300 450" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              style={{ filter: "drop-shadow(0 20px 40px rgba(124, 224, 168, 0.3))" }}
            >
              {/* Glow Effect Behind Character */}
              <defs>
                <radialGradient id="characterGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#7CE0A8" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#7CE0A8" stopOpacity="0"/>
                </radialGradient>
                <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7CE0A8"/>
                  <stop offset="50%" stopColor="#5ECFA3"/>
                  <stop offset="100%" stopColor="#4ECDC4"/>
                </linearGradient>
                <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7CE0A8"/>
                  <stop offset="100%" stopColor="#4ECDC4"/>
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Background Glow */}
              <ellipse cx="150" cy="200" rx="120" ry="150" fill="url(#characterGlow)"/>

              {/* Robot Head - Modern Helmet Design */}
              <g className="animate-head-bob">
                {/* Helmet Base */}
                <ellipse cx="150" cy="95" rx="55" ry="50" fill="#F8FFFE"/>
                <ellipse cx="150" cy="95" rx="55" ry="50" fill="url(#bodyGradient)" opacity="0.1"/>
                <ellipse cx="150" cy="90" rx="50" ry="45" fill="white"/>
                
                {/* Face Screen */}
                <rect x="110" y="70" width="80" height="45" rx="15" fill="#1a2e35"/>
                <rect x="115" y="75" width="70" height="35" rx="12" fill="#0d1b1e"/>
                
                {/* Animated Eyes */}
                <g className="animate-blink">
                  <ellipse cx="132" cy="92" rx="12" ry="10" fill="#7CE0A8" filter="url(#glow)"/>
                  <ellipse cx="168" cy="92" rx="12" ry="10" fill="#7CE0A8" filter="url(#glow)"/>
                  <circle cx="135" cy="90" r="3" fill="white" opacity="0.8"/>
                  <circle cx="171" cy="90" r="3" fill="white" opacity="0.8"/>
                </g>

                {/* Antenna */}
                <rect x="147" y="40" width="6" height="20" rx="3" fill="url(#bodyGradient)"/>
                <circle cx="150" cy="35" r="8" fill="#7CE0A8" className="animate-antenna-glow"/>
                <circle cx="150" cy="35" r="4" fill="white"/>
                
                {/* Helmet Details */}
                <path d="M100 95 Q150 130 200 95" stroke="#7CE0A8" strokeWidth="3" fill="none" opacity="0.5"/>
                <circle cx="105" cy="85" r="5" fill="#7CE0A8" opacity="0.6"/>
                <circle cx="195" cy="85" r="5" fill="#7CE0A8" opacity="0.6"/>
              </g>

              {/* Robot Body - Sleek Design */}
              <g className="animate-body-idle">
                {/* Neck */}
                <rect x="135" y="140" width="30" height="20" rx="5" fill="#E8FDF5"/>
                <rect x="140" y="145" width="20" height="10" rx="3" fill="#7CE0A8" opacity="0.3"/>

                {/* Main Body */}
                <path 
                  d="M100 170 L95 280 Q95 295 110 295 L190 295 Q205 295 205 280 L200 170 Q200 155 185 155 L115 155 Q100 155 100 170" 
                  fill="#F8FFFE"
                />
                <path 
                  d="M100 170 L95 280 Q95 295 110 295 L190 295 Q205 295 205 280 L200 170 Q200 155 185 155 L115 155 Q100 155 100 170" 
                  fill="url(#bodyGradient)" 
                  opacity="0.15"
                />

                {/* Chest Panel */}
                <rect x="120" y="175" width="60" height="80" rx="10" fill="white"/>
                <rect x="125" y="180" width="50" height="70" rx="8" fill="#E8FDF5"/>
                
                {/* Animated Core */}
                <circle cx="150" cy="215" r="20" fill="#0d1b1e"/>
                <circle cx="150" cy="215" r="15" fill="#7CE0A8" className="animate-core-pulse"/>
                <circle cx="150" cy="215" r="8" fill="white"/>
                
                {/* Status Lights */}
                <circle cx="135" y="255" r="4" fill="#7CE0A8" className="animate-light-1"/>
                <circle cx="150" cy="255" r="4" fill="#5ECFA3" className="animate-light-2"/>
                <circle cx="165" cy="255" r="4" fill="#4ECDC4" className="animate-light-3"/>

                {/* Body Lines */}
                <line x1="105" y1="180" x2="105" y2="270" stroke="#7CE0A8" strokeWidth="2" opacity="0.3"/>
                <line x1="195" y1="180" x2="195" y2="270" stroke="#7CE0A8" strokeWidth="2" opacity="0.3"/>
              </g>

              {/* Left Arm with Shield */}
              <g className="animate-arm-left" style={{ transformOrigin: "105px 175px" }}>
                <rect x="60" y="165" width="45" height="25" rx="12" fill="#F8FFFE"/>
                <rect x="60" y="165" width="45" height="25" rx="12" fill="url(#bodyGradient)" opacity="0.1"/>
                <ellipse cx="55" cy="177" rx="18" ry="15" fill="#FFE4C4"/>
                
                {/* Shield */}
                <g className="animate-shield-float">
                  <path 
                    d="M25 140 L25 180 Q25 210 55 225 Q85 210 85 180 L85 140 Q55 130 25 140" 
                    fill="url(#shieldGradient)"
                    opacity="0.9"
                  />
                  <path 
                    d="M35 150 L35 178 Q35 200 55 212 Q75 200 75 178 L75 150 Q55 142 35 150" 
                    fill="white"
                    opacity="0.3"
                  />
                  <circle cx="55" cy="175" r="15" fill="white" opacity="0.5"/>
                  <path d="M50 175 L53 180 L65 165" stroke="#7CE0A8" strokeWidth="4" fill="none" strokeLinecap="round"/>
                </g>
              </g>

              {/* Right Arm with Key */}
              <g className="animate-arm-right" style={{ transformOrigin: "195px 175px" }}>
                <rect x="195" y="165" width="45" height="25" rx="12" fill="#F8FFFE"/>
                <rect x="195" y="165" width="45" height="25" rx="12" fill="url(#bodyGradient)" opacity="0.1"/>
                <ellipse cx="245" cy="177" rx="18" ry="15" fill="#FFE4C4"/>
                
                {/* Floating Key */}
                <g className="animate-key-float">
                  <ellipse cx="270" cy="150" rx="15" ry="15" fill="url(#shieldGradient)"/>
                  <rect x="268" y="163" width="4" height="30" rx="2" fill="url(#shieldGradient)"/>
                  <rect x="260" y="180" width="12" height="4" rx="1" fill="#7CE0A8"/>
                  <rect x="260" y="188" width="8" height="4" rx="1" fill="#7CE0A8"/>
                  <circle cx="270" cy="150" r="6" fill="white" opacity="0.5"/>
                </g>
              </g>

              {/* Legs */}
              <g className="animate-legs-idle">
                {/* Left Leg */}
                <rect x="115" y="295" width="30" height="60" rx="8" fill="#F8FFFE"/>
                <rect x="115" y="295" width="30" height="60" rx="8" fill="url(#bodyGradient)" opacity="0.1"/>
                <rect x="110" y="350" width="40" height="20" rx="8" fill="#E8FDF5"/>
                <rect x="110" y="350" width="40" height="20" rx="8" fill="url(#bodyGradient)" opacity="0.2"/>
                
                {/* Right Leg */}
                <rect x="155" y="295" width="30" height="60" rx="8" fill="#F8FFFE"/>
                <rect x="155" y="295" width="30" height="60" rx="8" fill="url(#bodyGradient)" opacity="0.1"/>
                <rect x="150" y="350" width="40" height="20" rx="8" fill="#E8FDF5"/>
                <rect x="150" y="350" width="40" height="20" rx="8" fill="url(#bodyGradient)" opacity="0.2"/>
              </g>

              {/* Floating Tech Elements Around Character */}
              <g className="animate-orbit-1">
                <circle cx="230" cy="120" r="8" fill="#7CE0A8" opacity="0.6"/>
                <circle cx="230" cy="120" r="4" fill="white"/>
              </g>
              <g className="animate-orbit-2">
                <rect x="65" y="250" width="12" height="12" rx="3" fill="#5ECFA3" opacity="0.5"/>
              </g>
              <g className="animate-orbit-3">
                <polygon points="240,250 248,265 232,265" fill="#4ECDC4" opacity="0.5"/>
              </g>
            </svg>

            {/* Floating Status Badges */}
            <div className="absolute top-8 right-4 bg-white/90 backdrop-blur-md text-[#2A9D8F] px-5 py-3 rounded-2xl text-sm font-bold animate-badge-float-1 shadow-lg shadow-[#7CE0A8]/20 border border-[#7CE0A8]/20">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#7CE0A8] rounded-full animate-ping"></span>
                🔐 Keamanan Terjamin
              </span>
            </div>
            
            <div className="absolute bottom-28 left-4 bg-gradient-to-r from-[#7CE0A8] to-[#5ECFA3] text-white px-5 py-3 rounded-2xl text-sm font-bold animate-badge-float-2 shadow-lg shadow-[#7CE0A8]/30">
              ⚡ Reset Instan
            </div>

            <div className="absolute top-1/2 right-0 bg-white/80 backdrop-blur-md text-[#4ECDC4] px-4 py-2 rounded-xl text-xs font-semibold animate-badge-float-3 shadow-md border border-[#4ECDC4]/20">
              ✨ 256-bit Encrypted
            </div>
          </div>
        </div>

        {/* Right side - Enhanced Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="relative group">
            {/* Animated Border Gradient */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#7CE0A8] via-[#5ECFA3] to-[#4ECDC4] rounded-[2rem] blur-lg opacity-40 group-hover:opacity-60 transition-all duration-500 animate-gradient-shift"></div>
            
            {/* Form Card */}
            <div className="relative bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-[#7CE0A8]/10 p-10 space-y-8 border border-[#7CE0A8]/10">
              
              {/* Header */}
              <div className="text-center space-y-4">
                {/* Animated Icon */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#7CE0A8] rounded-full blur-xl opacity-30 animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-[#7CE0A8] to-[#4ECDC4] text-white p-5 rounded-full w-20 h-20 flex items-center justify-center shadow-lg shadow-[#7CE0A8]/30 animate-icon-bounce">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-[#2A9D8F] to-[#4ECDC4] bg-clip-text text-transparent">
                  Lupa Password?
                </h1>
                <p className="text-slate-500 text-lg leading-relaxed max-w-sm mx-auto">
                  Tenang saja! Masukkan email atau nomor telepon untuk reset password.
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-50 to-red-50/50 p-4 animate-shake border-l-4 border-red-400">
                  <div className="flex gap-3 items-center">
                    <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-500 text-lg">⚠️</span>
                    </div>
                    <p className="text-sm font-medium text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative group/input">
                  <label className="block text-sm font-bold text-slate-700 mb-3 items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#7CE0A8] rounded-full"></span>
                    Email atau Nomor Telepon
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7CE0A8] opacity-60 group-focus-within/input:opacity-100 transition-all duration-300">
                      {identifierType === "email" ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      ) : identifierType === "phone" ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      )}
                    </div>

                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="Email atau Nomor Telepon"
                      className="block w-full pl-14 pr-4 py-4 border-2 border-slate-100 rounded-2xl bg-slate-50/50 focus:border-[#7CE0A8] focus:bg-white focus:outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 font-medium text-base shadow-sm focus:shadow-lg focus:shadow-[#7CE0A8]/10"
                      required
                    />
                    
                    {/* Input Glow Effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#7CE0A8]/0 via-[#7CE0A8]/0 to-[#7CE0A8]/0 group-focus-within/input:from-[#7CE0A8]/5 group-focus-within/input:via-transparent group-focus-within/input:to-[#7CE0A8]/5 transition-all duration-300 pointer-events-none"></div>
                  </div>
                  <p className="text-xs text-slate-400 mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-4 h-4 bg-[#7CE0A8]/10 rounded-full">
                      <span className="w-1 h-1 bg-[#7CE0A8] rounded-full"></span>
                    </span>
                    Sistem otomatis mendeteksi format input Anda
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!identifier.trim() || isLoading}
                  className="w-full py-4 px-6 rounded-2xl text-lg font-bold text-white bg-gradient-to-r from-[#7CE0A8] via-[#5ECFA3] to-[#4ECDC4] hover:from-[#6DD09A] hover:via-[#4DC492] hover:to-[#3DBCB3] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-[#7CE0A8]/30 hover:shadow-xl hover:shadow-[#7CE0A8]/40 hover:-translate-y-0.5 group/btn relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        Memproses...
                      </>
                    ) : (
                      <>
                        Kirim Kode OTP
                        <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                      </>
                    )}
                  </span>
                  {/* Button Shine Effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                </button>

                <div className="relative py-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 bg-white text-slate-400 text-sm font-medium">atau</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="w-full py-4 px-6 rounded-2xl text-base font-bold text-[#7CE0A8] bg-[#7CE0A8]/5 border-2 border-[#7CE0A8]/20 hover:border-[#7CE0A8]/50 hover:bg-[#7CE0A8]/10 transition-all duration-300 flex items-center justify-center gap-2 group/back"
                >
                  <svg className="w-5 h-5 group-hover/back:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>
                  Kembali ke Login
                </button>
              </form>
            </div>
          </div>
          
          {/* Trust Badges */}
          <div className="mt-10 flex justify-center gap-8">
            <div className="text-center group cursor-default">
              <div className="w-14 h-14 mx-auto mb-2 bg-white rounded-2xl shadow-lg shadow-[#7CE0A8]/10 flex items-center justify-center group-hover:shadow-xl group-hover:shadow-[#7CE0A8]/20 transition-all duration-300 group-hover:-translate-y-1">
                <span className="text-2xl">🔒</span>
              </div>
              <p className="text-xs text-slate-500 font-semibold">SSL 256-bit</p>
            </div>
            <div className="text-center group cursor-default">
              <div className="w-14 h-14 mx-auto mb-2 bg-white rounded-2xl shadow-lg shadow-[#7CE0A8]/10 flex items-center justify-center group-hover:shadow-xl group-hover:shadow-[#7CE0A8]/20 transition-all duration-300 group-hover:-translate-y-1">
                <span className="text-2xl">⚡</span>
              </div>
              <p className="text-xs text-slate-500 font-semibold">Instan</p>
            </div>
            <div className="text-center group cursor-default">
              <div className="w-14 h-14 mx-auto mb-2 bg-white rounded-2xl shadow-lg shadow-[#7CE0A8]/10 flex items-center justify-center group-hover:shadow-xl group-hover:shadow-[#7CE0A8]/20 transition-all duration-300 group-hover:-translate-y-1">
                <span className="text-2xl">✓</span>
              </div>
              <p className="text-xs text-slate-500 font-semibold">Verified</p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        /* 3D Cube Styles */
        .cube-3d {
          width: 50px;
          height: 50px;
          position: relative;
          transform-style: preserve-3d;
          animation: cube-rotate 12s infinite linear;
        }
        
        .cube-small {
          width: 35px;
          height: 35px;
        }
        
        .cube-tiny {
          width: 25px;
          height: 25px;
        }
        
        .cube-face {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 2px solid rgba(124, 224, 168, 0.3);
          background: linear-gradient(135deg, rgba(124, 224, 168, 0.1) 0%, rgba(124, 224, 168, 0.05) 100%);
          backdrop-filter: blur(5px);
        }
        
        .cube-front { transform: translateZ(25px); }
        .cube-back { transform: rotateY(180deg) translateZ(25px); }
        .cube-right { transform: rotateY(90deg) translateZ(25px); }
        .cube-left { transform: rotateY(-90deg) translateZ(25px); }
        .cube-top { transform: rotateX(90deg) translateZ(25px); }
        .cube-bottom { transform: rotateX(-90deg) translateZ(25px); }
        
        .cube-small .cube-front { transform: translateZ(17.5px); }
        .cube-small .cube-back { transform: rotateY(180deg) translateZ(17.5px); }
        .cube-small .cube-right { transform: rotateY(90deg) translateZ(17.5px); }
        .cube-small .cube-left { transform: rotateY(-90deg) translateZ(17.5px); }
        .cube-small .cube-top { transform: rotateX(90deg) translateZ(17.5px); }
        .cube-small .cube-bottom { transform: rotateX(-90deg) translateZ(17.5px); }
        
        .cube-tiny .cube-front { transform: translateZ(12.5px); }
        .cube-tiny .cube-back { transform: rotateY(180deg) translateZ(12.5px); }
        .cube-tiny .cube-right { transform: rotateY(90deg) translateZ(12.5px); }
        .cube-tiny .cube-left { transform: rotateY(-90deg) translateZ(12.5px); }
        .cube-tiny .cube-top { transform: rotateX(90deg) translateZ(12.5px); }
        .cube-tiny .cube-bottom { transform: rotateX(-90deg) translateZ(12.5px); }

        @keyframes cube-rotate {
          0% { transform: rotateX(0deg) rotateY(0deg); }
          100% { transform: rotateX(360deg) rotateY(360deg); }
        }

        /* Floating Animations */
        @keyframes float-3d-1 {
          0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
          25% { transform: translateY(-20px) translateX(10px) rotate(5deg); }
          50% { transform: translateY(-10px) translateX(-5px) rotate(-3deg); }
          75% { transform: translateY(-25px) translateX(5px) rotate(3deg); }
        }

        @keyframes float-3d-2 {
          0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
          33% { transform: translateY(-15px) translateX(-10px) rotate(-5deg); }
          66% { transform: translateY(-25px) translateX(8px) rotate(5deg); }
        }

        @keyframes float-3d-3 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(10deg); }
        }

        .animate-float-3d-1 { animation: float-3d-1 8s ease-in-out infinite; }
        .animate-float-3d-2 { animation: float-3d-2 10s ease-in-out infinite; }
        .animate-float-3d-3 { animation: float-3d-3 7s ease-in-out infinite; }

        /* Sphere Floats */
        @keyframes sphere-float-1 {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }

        @keyframes sphere-float-2 {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-15px) scale(0.95); }
        }

        @keyframes sphere-float-3 {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-25px) translateX(10px); }
        }

        .animate-sphere-float-1 { animation: sphere-float-1 6s ease-in-out infinite; }
        .animate-sphere-float-2 { animation: sphere-float-2 8s ease-in-out infinite; }
        .animate-sphere-float-3 { animation: sphere-float-3 7s ease-in-out infinite; }

        /* Orb Floats */
        @keyframes orb-float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.1); }
        }

        @keyframes orb-float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, 30px) scale(0.9); }
        }

        @keyframes orb-float-3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.15); }
        }

        .animate-orb-float-1 { animation: orb-float-1 15s ease-in-out infinite; }
        .animate-orb-float-2 { animation: orb-float-2 18s ease-in-out infinite; }
        .animate-orb-float-3 { animation: orb-float-3 20s ease-in-out infinite; }

        /* Icon Floats */
        @keyframes icon-float-1 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }

        @keyframes icon-float-2 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-10deg); }
        }

        .animate-icon-float-1 { animation: icon-float-1 8s ease-in-out infinite; }
        .animate-icon-float-2 { animation: icon-float-2 9s ease-in-out infinite; }

        /* Ring Spins */
        @keyframes ring-spin-1 {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes ring-spin-2 {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }

        .animate-ring-spin-1 { animation: ring-spin-1 20s linear infinite; }
        .animate-ring-spin-2 { animation: ring-spin-2 15s linear infinite; }

        /* Particles */
        @keyframes particle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.1; }
          25% { transform: translateY(-30px) translateX(15px); opacity: 0.3; }
          50% { transform: translateY(-60px) translateX(-10px); opacity: 0.2; }
          75% { transform: translateY(-30px) translateX(20px); opacity: 0.3; }
        }

        .animate-particle { animation: particle 10s ease-in-out infinite; }

        /* Character Animations */
        @keyframes character-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }

        @keyframes platform-float {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(5px); }
        }

        @keyframes head-bob {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-2px) rotate(-1deg); }
          75% { transform: translateY(-2px) rotate(1deg); }
        }

        @keyframes blink {
          0%, 45%, 55%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.1); }
        }

        @keyframes antenna-glow {
          0%, 100% { filter: drop-shadow(0 0 5px #7CE0A8); }
          50% { filter: drop-shadow(0 0 15px #7CE0A8); }
        }

        @keyframes body-idle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        @keyframes core-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }

        @keyframes light-1 { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes light-2 { 0%, 33%, 100% { opacity: 0.3; } 16%, 50% { opacity: 1; } }
        @keyframes light-3 { 0%, 66%, 100% { opacity: 0.3; } 33%, 83% { opacity: 1; } }

        @keyframes arm-left {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-3deg); }
        }

        @keyframes arm-right {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(3deg); }
        }

        @keyframes shield-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(-3deg); }
        }

        @keyframes key-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(5deg); }
        }

        @keyframes legs-idle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(2px); }
        }

        @keyframes orbit-1 {
          0% { transform: translate(0, 0); }
          25% { transform: translate(10px, -10px); }
          50% { transform: translate(0, -15px); }
          75% { transform: translate(-10px, -10px); }
          100% { transform: translate(0, 0); }
        }

        @keyframes orbit-2 {
          0% { transform: translate(0, 0) rotate(0deg); }
          100% { transform: translate(0, 0) rotate(360deg); }
        }

        @keyframes orbit-3 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .animate-character-float { animation: character-float 4s ease-in-out infinite; }
        .animate-platform-float { animation: platform-float 4s ease-in-out infinite; }
        .animate-head-bob { animation: head-bob 3s ease-in-out infinite; }
        .animate-blink { animation: blink 4s ease-in-out infinite; }
        .animate-antenna-glow { animation: antenna-glow 2s ease-in-out infinite; }
        .animate-body-idle { animation: body-idle 3s ease-in-out infinite; }
        .animate-core-pulse { animation: core-pulse 2s ease-in-out infinite; }
        .animate-light-1 { animation: light-1 1.5s ease-in-out infinite; }
        .animate-light-2 { animation: light-2 1.5s ease-in-out infinite 0.5s; }
        .animate-light-3 { animation: light-3 1.5s ease-in-out infinite 1s; }
        .animate-arm-left { animation: arm-left 4s ease-in-out infinite; }
        .animate-arm-right { animation: arm-right 4s ease-in-out infinite 0.5s; }
        .animate-shield-float { animation: shield-float 3s ease-in-out infinite; }
        .animate-key-float { animation: key-float 3s ease-in-out infinite 0.5s; }
        .animate-legs-idle { animation: legs-idle 3s ease-in-out infinite; }
        .animate-orbit-1 { animation: orbit-1 6s ease-in-out infinite; }
        .animate-orbit-2 { animation: orbit-2 10s linear infinite; }
        .animate-orbit-3 { animation: orbit-3 4s ease-in-out infinite; }

        /* Badge Floats */
        @keyframes badge-float-1 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }

        @keyframes badge-float-2 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(-2deg); }
        }

        @keyframes badge-float-3 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        .animate-badge-float-1 { animation: badge-float-1 4s ease-in-out infinite; }
        .animate-badge-float-2 { animation: badge-float-2 5s ease-in-out infinite; }
        .animate-badge-float-3 { animation: badge-float-3 3.5s ease-in-out infinite; }

        /* Icon Bounce */
        @keyframes icon-bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-5px) scale(1.05); }
        }

        .animate-icon-bounce { animation: icon-bounce 3s ease-in-out infinite; }

        /* Gradient Shift */
        @keyframes gradient-shift {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.6; }
        }

        .animate-gradient-shift { animation: gradient-shift 3s ease-in-out infinite; }

        /* Shake Animation */
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }

        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  );
}