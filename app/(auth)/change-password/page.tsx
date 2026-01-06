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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Array<{
    left: string;
    top: string;
    opacity: number;
    animationDelay: string;
    animationDuration: string;
  }>>([]);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  // Password strength logic
  const passwordStrength = useMemo(() => {
    if (!password) return { strength: 0, label: "", color: "", width: "0%" };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const levels = [
      { strength: 0, label: "Terlalu pendek", color: "bg-red-500", width: "0%" },
      { strength: 1, label: "Sangat Lemah", color: "bg-red-500", width: "20%" },
      { strength: 2, label: "Lemah", color: "bg-orange-500", width: "40%" },
      { strength: 3, label: "Cukup", color: "bg-yellow-500", width: "60%" },
      { strength: 4, label: "Kuat", color: "bg-blue-500", width: "80%" },
      { strength: 5, label: "Sangat Kuat", color: "bg-gradient-to-r from-[#7CE0A8] to-[#4ECDC4]", width: "100%" },
    ];

    return levels[strength];
  }, [password]);

  const canSubmit = useMemo(() => {
    return password.length >= 8 && confirmPassword.length >= 8 && password === confirmPassword && !isLoading;
  }, [password, confirmPassword, isLoading]);

  const passwordMatch = useMemo(() => password === confirmPassword, [password, confirmPassword]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    
    // Generate particles
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

      setSuccess("Password berhasil diubah! Mengarahkan ke login...");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => router.replace("/login"), 1500);
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordCriteriaStatus = (condition: boolean) => {
    return condition 
      ? "text-[#7CE0A8] font-bold" 
      : "text-slate-400";
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-[#0A1929] via-[#0C1F2E] to-[#0A1929]">
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

        {/* Circuit Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" preserveAspectRatio="none">
          <defs>
            <pattern id="circuitGrid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#7CE0A8" strokeWidth="0.5"/>
              <circle cx="40" cy="40" r="2" fill="#7CE0A8" opacity="0.3"/>
              <circle cx="20" cy="20" r="1" fill="#7CE0A8" opacity="0.2"/>
              <circle cx="60" cy="60" r="1" fill="#7CE0A8" opacity="0.2"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuitGrid)" />
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

        {/* Floating Security Icons */}
        <div className="absolute top-[12%] left-[30%] animate-icon-float-1 opacity-20">
          <svg className="w-12 h-12 text-[#7CE0A8]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
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

        {/* Particle Dots */}
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
        {/* Left side - Enhanced 3D Character for Password Change */}
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

            {/* Main Character SVG - Enhanced Security Robot with Password Update */}
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

              {/* Robot Head - Modern Design with Password Update Theme */}
              <g className="animate-head-bob">
                {/* Helmet Base */}
                <ellipse cx="150" cy="95" rx="55" ry="50" fill="#0A1929"/>
                <ellipse cx="150" cy="95" rx="55" ry="50" fill="url(#bodyGradient)" opacity="0.1"/>
                <ellipse cx="150" cy="90" rx="50" ry="45" fill="#152A38"/>
                
                {/* Face Screen with Password Display */}
                <rect x="110" y="70" width="80" height="45" rx="15" fill="#1a2e35"/>
                <rect x="115" y="75" width="70" height="35" rx="12" fill="#0d1b1e"/>
                
                {/* Animated Password Dots */}
                <g className="animate-password-dots">
                  <circle cx="132" cy="92" r="6" fill="#7CE0A8" className="animate-password-dot-1"/>
                  <circle cx="150" cy="92" r="6" fill="#7CE0A8" className="animate-password-dot-2"/>
                  <circle cx="168" cy="92" r="6" fill="#7CE0A8" className="animate-password-dot-3"/>
                </g>

                {/* Antenna */}
                <rect x="147" y="40" width="6" height="20" rx="3" fill="url(#bodyGradient)"/>
                <circle cx="150" cy="35" r="8" fill="#7CE0A8" className="animate-antenna-glow"/>
                <circle cx="150" cy="35" r="4" fill="white"/>
                
                {/* Helmet Details */}
                <path d="M100 95 Q150 130 200 95" stroke="#7CE0A8" strokeWidth="3" fill="none" opacity="0.5"/>
                <circle cx="105" cy="85" r="5" fill="#7CE0A8" opacity="0.6" className="animate-pulse-slow"/>
                <circle cx="195" cy="85" r="5" fill="#7CE0A8" opacity="0.6" className="animate-pulse-slow"/>
              </g>

              {/* Robot Body - Enhanced with Password Update Display */}
              <g className="animate-body-idle">
                {/* Neck */}
                <rect x="135" y="140" width="30" height="20" rx="5" fill="#152A38"/>
                <rect x="140" y="145" width="20" height="10" rx="3" fill="#7CE0A8" opacity="0.3"/>

                {/* Main Body */}
                <path 
                  d="M100 170 L95 280 Q95 295 110 295 L190 295 Q205 295 205 280 L200 170 Q200 155 185 155 L115 155 Q100 155 100 170" 
                  fill="#1A3042"
                />
                <path 
                  d="M100 170 L95 280 Q95 295 110 295 L190 295 Q205 295 205 280 L200 170 Q200 155 185 155 L115 155 Q100 155 100 170" 
                  fill="url(#bodyGradient)" 
                  opacity="0.15"
                />

                {/* Chest Panel - Password Update Interface */}
                <rect x="120" y="175" width="60" height="80" rx="10" fill="#0A1929"/>
                <rect x="125" y="180" width="50" height="70" rx="8" fill="#152A38"/>
                
                {/* Password Update Display */}
                <rect x="130" y="190" width="40" height="15" rx="4" fill="#0d1b1e"/>
                <rect x="130" y="210" width="40" height="15" rx="4" fill="#0d1b1e"/>
                
                {/* Update Status */}
                <circle cx="150" cy="240" r="20" fill="#0d1b1e"/>
                <path 
                  d="M140 240 L150 255 L165 230" 
                  stroke="#7CE0A8" 
                  strokeWidth="6" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="animate-checkmark-draw"
                />
                
                {/* Status Lights */}
                <circle cx="135" y="255" r="4" fill="#7CE0A8" className="animate-light-1"/>
                <circle cx="150" cy="255" r="4" fill="#5ECFA3" className="animate-light-2"/>
                <circle cx="165" cy="255" r="4" fill="#4ECDC4" className="animate-light-3"/>

                {/* Body Lines */}
                <line x1="105" y1="180" x2="105" y2="270" stroke="#7CE0A8" strokeWidth="2" opacity="0.3"/>
                <line x1="195" y1="180" x2="195" y2="270" stroke="#7CE0A8" strokeWidth="2" opacity="0.3"/>
              </g>

              {/* Left Arm with Key */}
              <g className="animate-arm-left" style={{ transformOrigin: "105px 175px" }}>
                <rect x="60" y="165" width="45" height="25" rx="12" fill="#1A3042"/>
                <rect x="60" y="165" width="45" height="25" rx="12" fill="url(#bodyGradient)" opacity="0.1"/>
                <ellipse cx="55" cy="177" rx="18" ry="15" fill="#2C3E50"/>
                
                {/* Old Key - Being Discarded */}
                <g className="animate-key-discard">
                  <ellipse cx="25" cy="150" rx="12" ry="12" fill="#FF6B6B" opacity="0.6"/>
                  <rect x="23" y="163" width="4" height="20" rx="2" fill="#FF6B6B" opacity="0.6"/>
                  <rect x="15" y="175" width="10" height="4" rx="1" fill="#FF6B6B" opacity="0.6"/>
                  <path d="M15 150 L35 150" stroke="#FF6B6B" strokeWidth="2" strokeDasharray="2,2"/>
                </g>
              </g>

              {/* Right Arm with New Key */}
              <g className="animate-arm-right" style={{ transformOrigin: "195px 175px" }}>
                <rect x="195" y="165" width="45" height="25" rx="12" fill="#1A3042"/>
                <rect x="195" y="165" width="45" height="25" rx="12" fill="url(#bodyGradient)" opacity="0.1"/>
                <ellipse cx="245" cy="177" rx="18" ry="15" fill="#2C3E50"/>
                
                {/* New Shiny Key */}
                <g className="animate-key-float">
                  <ellipse cx="270" cy="150" rx="15" ry="15" fill="url(#shieldGradient)"/>
                  <rect x="268" y="163" width="4" height="30" rx="2" fill="url(#shieldGradient)"/>
                  <rect x="260" y="180" width="12" height="4" rx="1" fill="#7CE0A8"/>
                  <rect x="260" y="188" width="8" height="4" rx="1" fill="#7CE0A8"/>
                  <circle cx="270" cy="150" r="6" fill="white" opacity="0.5" className="animate-ping"/>
                  
                  {/* Sparkles */}
                  <circle cx="275" cy="140" r="2" fill="#FFD700" className="animate-sparkle-1"/>
                  <circle cx="280" cy="155" r="1.5" fill="#FFD700" className="animate-sparkle-2"/>
                  <circle cx="265" cy="145" r="1.5" fill="#FFD700" className="animate-sparkle-3"/>
                </g>
              </g>

              {/* Legs */}
              <g className="animate-legs-idle">
                {/* Left Leg */}
                <rect x="115" y="295" width="30" height="60" rx="8" fill="#1A3042"/>
                <rect x="115" y="295" width="30" height="60" rx="8" fill="url(#bodyGradient)" opacity="0.1"/>
                <rect x="110" y="350" width="40" height="20" rx="8" fill="#152A38"/>
                <rect x="110" y="350" width="40" height="20" rx="8" fill="url(#bodyGradient)" opacity="0.2"/>
                
                {/* Right Leg */}
                <rect x="155" y="295" width="30" height="60" rx="8" fill="#1A3042"/>
                <rect x="155" y="295" width="30" height="60" rx="8" fill="url(#bodyGradient)" opacity="0.1"/>
                <rect x="150" y="350" width="40" height="20" rx="8" fill="#152A38"/>
                <rect x="150" y="350" width="40" height="20" rx="8" fill="url(#bodyGradient)" opacity="0.2"/>
              </g>

              {/* Floating Security Elements Around Character */}
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

              {/* Data Flow Lines */}
              <path d="M80 200 Q120 180 140 190" stroke="#7CE0A8" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.4" className="animate-data-flow-1"/>
              <path d="M220 200 Q180 180 160 190" stroke="#5ECFA3" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.4" className="animate-data-flow-2"/>
            </svg>

            {/* Floating Status Badges */}
            <div className="absolute top-8 right-4 bg-gradient-to-r from-[#7CE0A8] to-[#5ECFA3] text-white px-5 py-3 rounded-2xl text-sm font-bold animate-badge-float-1 shadow-lg shadow-[#7CE0A8]/30 border border-white/10">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                🔐 Update Password
              </span>
            </div>
            
            <div className="absolute bottom-28 left-4 bg-white/10 backdrop-blur-md text-white px-5 py-3 rounded-2xl text-sm font-bold animate-badge-float-2 shadow-lg shadow-[#7CE0A8]/20 border border-white/10">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Enkripsi 256-bit
              </span>
            </div>

            <div className="absolute top-1/2 right-0 bg-[#7CE0A8]/10 backdrop-blur-md text-[#7CE0A8] px-4 py-2 rounded-xl text-xs font-semibold animate-badge-float-3 shadow-md border border-[#7CE0A8]/20">
              <span className="flex items-center gap-1">
                ⚡ Real-time
                <span className="w-1 h-1 bg-[#7CE0A8] rounded-full animate-ping"></span>
              </span>
            </div>
          </div>
        </div>

        {/* Right side - Enhanced Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="relative group">
            {/* Animated Border Gradient */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#7CE0A8] via-[#5ECFA3] to-[#4ECDC4] rounded-[2rem] blur-lg opacity-40 group-hover:opacity-60 transition-all duration-500 animate-gradient-shift"></div>
            
            {/* Form Card */}
            <div className="relative bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-[#7CE0A8]/10 p-8 space-y-8 border border-white/20">
              
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
                  Password Baru
                </h1>
                <p className="text-slate-600 text-lg leading-relaxed max-w-sm mx-auto">
                  Buat password yang kuat untuk keamanan akun Anda
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

              {/* Success Alert */}
              {success && (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-50 to-green-50/50 p-4 animate-zoom-in border-l-4 border-green-400">
                  <div className="flex gap-3 items-center">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-500 text-lg">✓</span>
                    </div>
                    <p className="text-sm font-medium text-green-700">{success}</p>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  {/* New Password */}
                  <div className="relative group/input">
                    <label className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#7CE0A8] rounded-full animate-pulse"></span>
                      Password Baru
                    </label>
                    <div className="relative">
                      <input
                        type={passwordVisible ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="Masukkan password baru"
                        className="block w-full pl-4 pr-12 py-4 border-2 border-slate-100 rounded-2xl bg-white focus:border-[#7CE0A8] focus:bg-white focus:outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 font-medium text-base shadow-sm focus:shadow-lg focus:shadow-[#7CE0A8]/10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setPasswordVisible(!passwordVisible)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#7CE0A8] transition-colors"
                      >
                        {passwordVisible ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {password && (
                      <div className="mt-4 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 font-medium">Kekuatan Password:</span>
                          <span className={`font-bold ${passwordStrength.color.replace('bg-', 'text-')}`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${passwordStrength.color}`}
                            style={{ width: passwordStrength.width }}
                          />
                        </div>
                        
                        {/* Password Criteria */}
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <div className={`text-xs ${getPasswordCriteriaStatus(password.length >= 8)}`}>
                            ✓ Minimal 8 karakter
                          </div>
                          <div className={`text-xs ${getPasswordCriteriaStatus(password.length >= 12)}`}>
                            ✓ Ideal 12+ karakter
                          </div>
                          <div className={`text-xs ${getPasswordCriteriaStatus(/[A-Z]/.test(password))}`}>
                            ✓ Huruf besar (A-Z)
                          </div>
                          <div className={`text-xs ${getPasswordCriteriaStatus(/[0-9]/.test(password))}`}>
                            ✓ Angka (0-9)
                          </div>
                          <div className={`text-xs ${getPasswordCriteriaStatus(/[^A-Za-z0-9]/.test(password))} col-span-2`}>
                            ✓ Karakter khusus (!@#$%^&*)
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="relative group/input">
                    <label className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#5ECFA3] rounded-full"></span>
                      Konfirmasi Password
                    </label>
                    <div className="relative">
                      <input
                        type={confirmVisible ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi password baru"
                        className={`block w-full pl-4 pr-12 py-4 border-2 rounded-2xl bg-white focus:outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 font-medium text-base shadow-sm focus:shadow-lg ${
                          confirmPassword && passwordMatch 
                            ? "border-green-400 focus:border-green-500 focus:shadow-green-100" 
                            : confirmPassword 
                            ? "border-red-400 focus:border-red-500 focus:shadow-red-100"
                            : "border-slate-100 focus:border-[#5ECFA3] focus:shadow-[#5ECFA3]/10"
                        }`}
                        required
                      />
                      <div className="absolute right-12 top-1/2 -translate-y-1/2">
                        {confirmPassword && (
                          <span className={`text-sm font-bold ${passwordMatch ? "text-green-500" : "text-red-500"}`}>
                            {passwordMatch ? "✓" : "✗"}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfirmVisible(!confirmVisible)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#5ECFA3] transition-colors"
                      >
                        {confirmVisible ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        )}
                      </button>
                    </div>
                    
                    {confirmPassword && (
                      <p className={`text-sm mt-2 font-medium ${passwordMatch ? "text-green-600" : "text-red-600"}`}>
                        {passwordMatch ? "✓ Password cocok! Password aman untuk digunakan." : "✕ Password tidak cocok. Pastikan kedua password sama."}
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={!canSubmit}
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
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          Simpan Password Baru
                        </>
                      )}
                    </span>
                    {/* Button Shine Effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  </button>
                </div>

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
                  <svg className="w-5 h-5 group-hover/back:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                  </svg>
                  Kembali ke Login
                </button>
              </form>
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

        .animate-float-3d-1 { animation: float-3d-1 8s ease-in-out infinite; }
        .animate-float-3d-2 { animation: float-3d-2 10s ease-in-out infinite; }

        /* Sphere Floats */
        @keyframes sphere-float-1 {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }

        @keyframes sphere-float-2 {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-15px) scale(0.95); }
        }

        .animate-sphere-float-1 { animation: sphere-float-1 6s ease-in-out infinite; }
        .animate-sphere-float-2 { animation: sphere-float-2 8s ease-in-out infinite; }

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

        /* Password dots animation */
        @keyframes password-dot-1 {
          0%, 100% { opacity: 1; transform: scale(1); }
          33% { opacity: 0.3; transform: scale(0.8); }
        }

        @keyframes password-dot-2 {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          33% { opacity: 1; transform: scale(1.2); }
          66% { opacity: 0.3; transform: scale(0.8); }
        }

        @keyframes password-dot-3 {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          66% { opacity: 1; transform: scale(1.2); }
        }

        .animate-password-dots { animation: none; }
        .animate-password-dot-1 { animation: password-dot-1 2s ease-in-out infinite; }
        .animate-password-dot-2 { animation: password-dot-2 2s ease-in-out infinite; }
        .animate-password-dot-3 { animation: password-dot-3 2s ease-in-out infinite; }

        @keyframes antenna-glow {
          0%, 100% { filter: drop-shadow(0 0 5px #7CE0A8); }
          50% { filter: drop-shadow(0 0 15px #7CE0A8); }
        }

        @keyframes body-idle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        @keyframes checkmark-draw {
          0% { stroke-dasharray: 0, 100; stroke-dashoffset: 100; }
          100% { stroke-dasharray: 100, 0; stroke-dashoffset: 0; }
        }

        @keyframes light-1 { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes light-2 { 0%, 33%, 100% { opacity: 0.3; } 16%, 50% { opacity: 1; } }
        @keyframes light-3 { 0%, 66%, 100% { opacity: 0.3; } 33%, 83% { opacity: 1; } }

        @keyframes arm-left {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-5deg); }
        }

        @keyframes arm-right {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(5deg); }
        }

        @keyframes key-discard {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(10px) rotate(10deg) scale(0.8); }
        }

        @keyframes key-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(5deg); }
        }

        @keyframes sparkle-1 {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        @keyframes sparkle-2 {
          0%, 33%, 100% { opacity: 0; transform: scale(0.5); }
          16%, 66% { opacity: 1; transform: scale(1.2); }
        }

        @keyframes sparkle-3 {
          0%, 66%, 100% { opacity: 0; transform: scale(0.5); }
          33%, 83% { opacity: 1; transform: scale(1.2); }
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

        @keyframes data-flow-1 {
          0% { stroke-dashoffset: 20; }
          100% { stroke-dashoffset: 0; }
        }

        @keyframes data-flow-2 {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 20; }
        }

        .animate-character-float { animation: character-float 4s ease-in-out infinite; }
        .animate-platform-float { animation: platform-float 4s ease-in-out infinite; }
        .animate-head-bob { animation: head-bob 3s ease-in-out infinite; }
        .animate-antenna-glow { animation: antenna-glow 2s ease-in-out infinite; }
        .animate-body-idle { animation: body-idle 3s ease-in-out infinite; }
        .animate-checkmark-draw { animation: checkmark-draw 1s ease-in-out forwards; animation-delay: 1s; }
        .animate-light-1 { animation: light-1 1.5s ease-in-out infinite; }
        .animate-light-2 { animation: light-2 1.5s ease-in-out infinite 0.5s; }
        .animate-light-3 { animation: light-3 1.5s ease-in-out infinite 1s; }
        .animate-arm-left { animation: arm-left 4s ease-in-out infinite; }
        .animate-arm-right { animation: arm-right 4s ease-in-out infinite 0.5s; }
        .animate-key-discard { animation: key-discard 3s ease-in-out infinite; }
        .animate-key-float { animation: key-float 3s ease-in-out infinite 0.5s; }
        .animate-sparkle-1 { animation: sparkle-1 2s ease-in-out infinite; }
        .animate-sparkle-2 { animation: sparkle-2 2s ease-in-out infinite 0.3s; }
        .animate-sparkle-3 { animation: sparkle-3 2s ease-in-out infinite 0.6s; }
        .animate-legs-idle { animation: legs-idle 3s ease-in-out infinite; }
        .animate-orbit-1 { animation: orbit-1 6s ease-in-out infinite; }
        .animate-orbit-2 { animation: orbit-2 10s linear infinite; }
        .animate-orbit-3 { animation: orbit-3 4s ease-in-out infinite; }
        .animate-data-flow-1 { animation: data-flow-1 2s linear infinite; }
        .animate-data-flow-2 { animation: data-flow-2 2s linear infinite; }

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

        /* Zoom In Animation */
        @keyframes zoom-in {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }

        .animate-shake { animation: shake 0.5s ease-in-out; }
        .animate-zoom-in { animation: zoom-in 0.3s ease-out; }

        /* Pulse Slow */
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        .animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}