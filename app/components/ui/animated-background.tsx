"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedBackgroundProps {
  variant?: "login" | "register";
}

// SVG Character Component - Cute mascot like Tokopedia's Toped
const AnimatedCharacter = ({ variant, size = "default" }: { variant: "login" | "register"; size?: "small" | "default" | "large" }) => {
  const [isWaving, setIsWaving] = useState(false);
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Wave animation every 4 seconds
    const waveInterval = setInterval(() => {
      setIsWaving(true);
      setTimeout(() => setIsWaving(false), 1000);
    }, 4000);

    // Eye follow mouse
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 8;
      const y = (e.clientY / window.innerHeight - 0.5) * 8;
      setEyePosition({ x: Math.max(-4, Math.min(4, x)), y: Math.max(-4, Math.min(4, y)) });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      clearInterval(waveInterval);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Size classes based on prop
  const sizeClasses = {
    small: "w-32 h-36",
    default: "w-48 h-52 sm:w-56 sm:h-64 md:w-64 md:h-72",
    large: "w-64 h-72 md:w-80 md:h-96 lg:w-96 lg:h-[420px]"
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Main Character Container */}
      <div className="relative animate-float-slow">
        <svg
          viewBox="0 0 300 350"
          className={`${sizeClasses[size]} drop-shadow-xl`}
          style={{ filter: 'drop-shadow(0 10px 25px rgba(124, 224, 168, 0.25))' }}
        >
          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7CE0A8" />
              <stop offset="50%" stopColor="#5AB894" />
              <stop offset="100%" stopColor="#48BB78" />
            </linearGradient>
            <linearGradient id="bodyShine" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
            <radialGradient id="cheekGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FF9B9B" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#FF9B9B" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Shadow under character */}
          <ellipse cx="150" cy="340" rx="50" ry="8" fill="rgba(0,0,0,0.08)" className="animate-pulse-slow" />

          {/* Body - Rounded rectangle like a cute mascot */}
          <g className="animate-bounce-gentle">
            {/* Main body */}
            <rect
              x="70"
              y="100"
              width="160"
              height="200"
              rx="80"
              ry="80"
              fill="url(#bodyGradient)"
            />
            {/* Body shine */}
            <ellipse
              cx="110"
              cy="150"
              rx="25"
              ry="40"
              fill="url(#bodyShine)"
              opacity="0.5"
            />

            {/* Face area - slightly lighter */}
            <ellipse
              cx="150"
              cy="180"
              rx="45"
              ry="40"
              fill="rgba(255,255,255,0.12)"
            />

            {/* Eyes container */}
            <g style={{ transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)` }}>
              {/* Left eye white */}
              <ellipse cx="120" cy="170" rx="20" ry="22" fill="white" />
              {/* Right eye white */}
              <ellipse cx="180" cy="170" rx="20" ry="22" fill="white" />
              
              {/* Left pupil */}
              <circle cx="123" cy="172" r="10" fill="#2D3748" />
              <circle cx="126" cy="168" r="3" fill="white" />
              
              {/* Right pupil */}
              <circle cx="183" cy="172" r="10" fill="#2D3748" />
              <circle cx="186" cy="168" r="3" fill="white" />
            </g>

            {/* Eyebrows */}
            <path
              d="M102 148 Q 120 143, 138 150"
              stroke="#2D3748"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M162 150 Q 180 143, 198 148"
              stroke="#2D3748"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />

            {/* Cheeks - blush */}
            <ellipse cx="92" cy="198" rx="12" ry="8" fill="url(#cheekGlow)" />
            <ellipse cx="208" cy="198" rx="12" ry="8" fill="url(#cheekGlow)" />

            {/* Mouth - happy smile */}
            <path
              d="M 128 218 Q 150 245, 172 218"
              stroke="#2D3748"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
            />

            {/* Tongue when happy */}
            {variant === "register" && (
              <ellipse cx="150" cy="232" rx="8" ry="6" fill="#FF9B9B" opacity="0.7" />
            )}
          </g>

          {/* Left Arm */}
          <g className={isWaving ? "animate-wave" : ""} style={{ transformOrigin: "70px 200px" }}>
            <ellipse
              cx="48"
              cy="218"
              rx="22"
              ry="30"
              fill="url(#bodyGradient)"
            />
            {/* Hand */}
            <circle cx="40" cy="195" r="15" fill="url(#bodyGradient)" />
            <ellipse cx="34" cy="191" rx="6" ry="10" fill="rgba(255,255,255,0.2)" />
          </g>

          {/* Right Arm */}
          <g className="animate-arm-idle" style={{ transformOrigin: "230px 200px" }}>
            <ellipse
              cx="252"
              cy="218"
              rx="22"
              ry="30"
              fill="url(#bodyGradient)"
            />
            {/* Hand */}
            <circle cx="260" cy="195" r="15" fill="url(#bodyGradient)" />
            <ellipse cx="266" cy="191" rx="6" ry="10" fill="rgba(255,255,255,0.2)" />
            
            {variant === "register" && (
              <g className="animate-float-card">
                <rect x="248" y="158" width="30" height="22" rx="3" fill="#4A5568" />
                <rect x="251" y="161" width="24" height="16" rx="2" fill="#63B3ED" />
                <rect x="254" y="164" width="7" height="2.5" rx="1" fill="white" opacity="0.8" />
              </g>
            )}
          </g>

          {/* Feet */}
          <ellipse cx="120" cy="308" rx="26" ry="12" fill="url(#bodyGradient)" />
          <ellipse cx="180" cy="308" rx="26" ry="12" fill="url(#bodyGradient)" />
          
          {/* Feet shine */}
          <ellipse cx="115" cy="304" rx="8" ry="4" fill="rgba(255,255,255,0.25)" />
          <ellipse cx="175" cy="304" rx="8" ry="4" fill="rgba(255,255,255,0.25)" />

          {/* Hat/Accessory for login variant */}
          {variant === "login" && (
            <g className="animate-hat-bob">
              <ellipse cx="150" cy="98" rx="45" ry="12" fill="#48BB78" />
              <path
                d="M 105 98 Q 105 55, 150 45 Q 195 55, 195 98"
                fill="#5AB894"
              />
              <ellipse cx="128" cy="72" rx="12" ry="7" fill="rgba(255,255,255,0.2)" />
              {/* Star decoration */}
              <polygon
                points="150,58 152,64 159,64 154,68 156,75 150,71 144,75 146,68 141,64 148,64"
                fill="#FFD700"
                className="animate-star-spin"
              />
            </g>
          )}

          {/* Crown for register variant */}
          {variant === "register" && (
            <g className="animate-crown-float">
              <path
                d="M 112 92 L 122 65 L 136 82 L 150 55 L 164 82 L 178 65 L 188 92 Z"
                fill="#FFD700"
                stroke="#FFA500"
                strokeWidth="1.5"
              />
              <circle cx="150" cy="60" r="4" fill="#FF6B6B" />
              <circle cx="122" cy="68" r="3" fill="#63B3ED" />
              <circle cx="178" cy="68" r="3" fill="#63B3ED" />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

// Floating decorations - RESPONSIVE VERSION
const FloatingDecorations = ({ variant }: { variant: "login" | "register" }) => {
  return (
    <>
      {/* Desktop decorations - hidden on mobile/tablet */}
      <div className="hidden lg:block">
        <div className="absolute top-[15%] left-[8%] animate-float-decoration-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-lg flex items-center justify-center text-base">
            ✨
          </div>
        </div>
        <div className="absolute top-[25%] right-[12%] animate-float-decoration-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-300 to-green-500 shadow-lg flex items-center justify-center text-lg">
            💚
          </div>
        </div>
        <div className="absolute bottom-[20%] left-[12%] animate-float-decoration-3">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-300 to-blue-500 shadow-lg flex items-center justify-center text-sm">
            🌟
          </div>
        </div>
        <div className="absolute bottom-[30%] right-[8%] animate-float-decoration-4">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-300 to-pink-500 shadow-lg flex items-center justify-center text-sm">
            {variant === "login" ? "🔐" : "🎉"}
          </div>
        </div>
      </div>

      {/* Tablet decorations - smaller and repositioned */}
      <div className="hidden md:block lg:hidden">
        <div className="absolute top-[8%] left-[5%] animate-float-decoration-1">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-md flex items-center justify-center text-sm">
            ✨
          </div>
        </div>
        <div className="absolute top-[12%] right-[8%] animate-float-decoration-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-300 to-green-500 shadow-md flex items-center justify-center text-base">
            💚
          </div>
        </div>
        <div className="absolute top-[35%] left-[3%] animate-float-decoration-3">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-300 to-blue-500 shadow-md flex items-center justify-center text-xs">
            🌟
          </div>
        </div>
        <div className="absolute top-[30%] right-[5%] animate-float-decoration-4">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-300 to-pink-500 shadow-md flex items-center justify-center text-xs">
            {variant === "login" ? "🔐" : "🎉"}
          </div>
        </div>
      </div>

      {/* Mobile decorations - minimal and non-intrusive */}
      <div className="block md:hidden">
        <div className="absolute top-[2%] left-[5%] animate-float-decoration-1">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-sm flex items-center justify-center text-xs opacity-70">
            ✨
          </div>
        </div>
        <div className="absolute top-[3%] right-[8%] animate-float-decoration-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-300 to-green-500 shadow-sm flex items-center justify-center text-xs opacity-70">
            💚
          </div>
        </div>
        <div className="absolute top-[12%] left-[2%] animate-float-decoration-3">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-300 to-blue-500 shadow-sm flex items-center justify-center text-[10px] opacity-60">
            ⭐
          </div>
        </div>
        <div className="absolute top-[10%] right-[3%] animate-float-decoration-4">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-pink-300 to-pink-500 shadow-sm flex items-center justify-center text-[10px] opacity-60">
            💖
          </div>
        </div>
      </div>
    </>
  );
};

// Floating particles/shapes component - RESPONSIVE (Fixed positions to avoid hydration mismatch)
const FloatingElements = () => {
  // Fixed positions to avoid hydration mismatch between server and client
  const desktopCircles = [
    { left: "15%", top: "20%", width: "45px", height: "45px", bg: "0.08", delay: "0s", duration: "18s" },
    { left: "75%", top: "15%", width: "35px", height: "35px", bg: "0.06", delay: "2s", duration: "20s" },
    { left: "85%", top: "60%", width: "50px", height: "50px", bg: "0.07", delay: "1s", duration: "16s" },
    { left: "25%", top: "70%", width: "40px", height: "40px", bg: "0.05", delay: "3s", duration: "22s" },
    { left: "60%", top: "80%", width: "30px", height: "30px", bg: "0.09", delay: "0.5s", duration: "19s" },
    { left: "10%", top: "45%", width: "25px", height: "25px", bg: "0.06", delay: "2.5s", duration: "17s" },
    { left: "90%", top: "35%", width: "38px", height: "38px", bg: "0.07", delay: "1.5s", duration: "21s" },
    { left: "45%", top: "10%", width: "32px", height: "32px", bg: "0.05", delay: "4s", duration: "15s" },
    { left: "55%", top: "55%", width: "28px", height: "28px", bg: "0.08", delay: "3.5s", duration: "18s" },
    { left: "30%", top: "90%", width: "42px", height: "42px", bg: "0.06", delay: "2s", duration: "20s" },
    { left: "70%", top: "45%", width: "36px", height: "36px", bg: "0.07", delay: "1s", duration: "16s" },
    { left: "5%", top: "75%", width: "22px", height: "22px", bg: "0.09", delay: "0s", duration: "14s" },
  ];

  const mobileCircles = [
    { left: "10%", top: "15%", width: "20px", height: "20px", bg: "0.05", delay: "0s", duration: "20s" },
    { left: "80%", top: "25%", width: "18px", height: "18px", bg: "0.04", delay: "2s", duration: "22s" },
    { left: "25%", top: "75%", width: "22px", height: "22px", bg: "0.06", delay: "1s", duration: "18s" },
    { left: "70%", top: "65%", width: "16px", height: "16px", bg: "0.05", delay: "3s", duration: "24s" },
    { left: "50%", top: "85%", width: "24px", height: "24px", bg: "0.04", delay: "1.5s", duration: "20s" },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating circles - desktop/tablet */}
      <div className="hidden sm:block">
        {desktopCircles.map((circle, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float-random"
            style={{
              left: circle.left,
              top: circle.top,
              width: circle.width,
              height: circle.height,
              background: `rgba(124, 224, 168, ${circle.bg})`,
              animationDelay: circle.delay,
              animationDuration: circle.duration,
            }}
          />
        ))}
      </div>
      
      {/* Fewer circles on mobile */}
      <div className="block sm:hidden">
        {mobileCircles.map((circle, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float-random"
            style={{
              left: circle.left,
              top: circle.top,
              width: circle.width,
              height: circle.height,
              background: `rgba(124, 224, 168, ${circle.bg})`,
              animationDelay: circle.delay,
              animationDuration: circle.duration,
            }}
          />
        ))}
      </div>
      
      {/* Floating icons - desktop only */}
      <div className="hidden lg:block">
        <div className="absolute top-[10%] left-[5%] animate-bounce-slow opacity-20">
          <svg className="w-10 h-10 text-green-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </div>
        <div className="absolute top-[18%] right-[6%] animate-float-slow opacity-15">
          <svg className="w-12 h-12 text-green-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
        <div className="absolute bottom-[18%] left-[8%] animate-pulse-slow opacity-20">
          <svg className="w-8 h-8 text-teal-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l4.59-4.58L18 11l-6 6z" />
          </svg>
        </div>
        <div className="absolute bottom-[25%] right-[5%] animate-bounce-slow opacity-15" style={{ animationDelay: '1s' }}>
          <svg className="w-11 h-11 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

// Scene decoration - RESPONSIVE
const SceneDecoration = ({ variant }: { variant: "login" | "register" }) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
      {/* Ground gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 lg:h-32 bg-gradient-to-t from-green-100/30 to-transparent dark:from-green-900/10" />
      
      {/* Grass/Plants */}
      <svg className="absolute bottom-0 left-0 w-full h-12 sm:h-16 lg:h-24" viewBox="0 0 1200 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="grassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7CE0A8" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#48BB78" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path
          d="M0 100 Q 100 65, 200 80 T 400 72 T 600 85 T 800 68 T 1000 78 T 1200 82 L 1200 100 Z"
          fill="url(#grassGradient)"
        />
      </svg>

      {/* Decorative plants - hidden on small screens */}
      <div className="hidden md:block">
        <div className="absolute bottom-4 left-[5%] animate-sway">
          <svg className="w-10 h-16 lg:w-14 lg:h-20 text-green-400 opacity-40" viewBox="0 0 50 80">
            <path d="M25 80 L25 40 Q15 30 20 10 Q25 20 25 40" fill="currentColor" />
            <path d="M25 60 Q35 50 40 30 Q30 45 25 60" fill="currentColor" />
            <path d="M25 50 Q15 40 10 25 Q20 38 25 50" fill="currentColor" />
          </svg>
        </div>
        <div className="absolute bottom-6 right-[6%] animate-sway" style={{ animationDelay: '0.3s' }}>
          <svg className="w-8 h-14 lg:w-12 lg:h-18 text-teal-400 opacity-35" viewBox="0 0 50 80">
            <path d="M25 80 L25 35 Q10 25 15 5 Q25 18 25 35" fill="currentColor" />
            <path d="M25 55 Q40 45 45 20 Q32 42 25 55" fill="currentColor" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export function AnimatedBackground({
  variant = "login",
}: AnimatedBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Particle system - REDUCED for better performance
    interface Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      hue: number;
    }

    const particles: Particle[] = [];
    // Fewer particles on mobile
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 8 : Math.min(20, Math.floor(window.innerWidth / 60));

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.2,
        speedY: (Math.random() - 0.5) * 0.2,
        opacity: Math.random() * 0.15 + 0.05,
        hue: Math.random() * 30 + 140,
      });
    }

    let animationFrameId: number;

    const animate = () => {
      if (!canvas || !ctx) return;

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      
      if (isDark) {
        gradient.addColorStop(0, "rgba(15, 23, 42, 1)");
        gradient.addColorStop(0.5, "rgba(20, 30, 50, 1)");
        gradient.addColorStop(1, "rgba(15, 25, 45, 1)");
      } else {
        gradient.addColorStop(0, "rgba(240, 253, 244, 1)");
        gradient.addColorStop(0.3, "rgba(236, 253, 245, 1)");
        gradient.addColorStop(0.7, "rgba(243, 250, 247, 1)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 1)");
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw subtle blob shapes - only on larger screens
      if (!isMobile) {
        const time = Date.now() / 3000;
        
        ctx.globalAlpha = isDark ? 0.06 : 0.1;
        
        // Blob 1
        ctx.fillStyle = isDark ? "rgba(124, 224, 168, 0.1)" : "rgba(124, 224, 168, 0.12)";
        ctx.beginPath();
        const blob1X = canvas.width * 0.2;
        const blob1Y = canvas.height * 0.3;
        const blob1Size = 100 + Math.sin(time) * 20;
        for (let i = 0; i < Math.PI * 2; i += 0.1) {
          const r = blob1Size + Math.sin(i * 3 + time) * 20;
          const px = blob1X + Math.cos(i) * r;
          const py = blob1Y + Math.sin(i) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Blob 2
        ctx.fillStyle = isDark ? "rgba(90, 184, 148, 0.08)" : "rgba(90, 184, 148, 0.1)";
        ctx.beginPath();
        const blob2X = canvas.width * 0.8;
        const blob2Y = canvas.height * 0.7;
        const blob2Size = 80 + Math.cos(time * 0.8) * 15;
        for (let i = 0; i < Math.PI * 2; i += 0.1) {
          const r = blob2Size + Math.sin(i * 4 + time * 1.2) * 15;
          const px = blob2X + Math.cos(i) * r;
          const py = blob2Y + Math.sin(i) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        ctx.globalAlpha = 1;
      }

      // Update and draw particles
      particles.forEach((particle) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Wrap around
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.y > canvas.height) particle.y = 0;
        if (particle.y < 0) particle.y = canvas.height;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particle.hue}, 55%, 50%, ${particle.opacity})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [variant]);

  return (
    <div className="fixed inset-0 -z-10 w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: "transparent" }}
      />
      <FloatingElements />
      <FloatingDecorations variant={variant} />
      <SceneDecoration variant={variant} />
    </div>
  );
}

// Export the character component separately for use in page layout
export { AnimatedCharacter };