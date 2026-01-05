"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedBackgroundProps {
  variant?: "login" | "register";
}

// SVG Character Component - Cute mascot like Tokopedia's Toped
const AnimatedCharacter = ({ variant }: { variant: "login" | "register" }) => {
  const [isWaving, setIsWaving] = useState(false);
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Wave animation every 3 seconds
    const waveInterval = setInterval(() => {
      setIsWaving(true);
      setTimeout(() => setIsWaving(false), 1000);
    }, 4000);

    // Eye follow mouse
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 10;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      setEyePosition({ x: Math.max(-5, Math.min(5, x)), y: Math.max(-5, Math.min(5, y)) });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      clearInterval(waveInterval);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Main Character Container */}
      <div className="relative animate-float-slow">
        <svg
          viewBox="0 0 300 350"
          className="w-64 h-72 md:w-80 md:h-96 lg:w-96 lg:h-[420px] drop-shadow-2xl"
          style={{ filter: 'drop-shadow(0 20px 40px rgba(124, 224, 168, 0.3))' }}
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
            <linearGradient id="shadowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.1)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </linearGradient>
            <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <radialGradient id="cheekGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FF9B9B" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#FF9B9B" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Shadow under character */}
          <ellipse cx="150" cy="340" rx="60" ry="10" fill="rgba(0,0,0,0.1)" className="animate-pulse-slow" />

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
              rx="30"
              ry="50"
              fill="url(#bodyShine)"
              opacity="0.5"
            />

            {/* Face area - slightly lighter */}
            <ellipse
              cx="150"
              cy="180"
              rx="50"
              ry="45"
              fill="rgba(255,255,255,0.15)"
            />

            {/* Eyes container */}
            <g style={{ transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)` }}>
              {/* Left eye white */}
              <ellipse cx="120" cy="170" rx="22" ry="25" fill="white" />
              {/* Right eye white */}
              <ellipse cx="180" cy="170" rx="22" ry="25" fill="white" />
              
              {/* Left pupil */}
              <circle cx="123" cy="172" r="12" fill="#2D3748" />
              <circle cx="126" cy="168" r="4" fill="white" />
              
              {/* Right pupil */}
              <circle cx="183" cy="172" r="12" fill="#2D3748" />
              <circle cx="186" cy="168" r="4" fill="white" />
            </g>

            {/* Eyebrows */}
            <path
              d="M100 145 Q 120 140, 140 148"
              stroke="#2D3748"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M160 148 Q 180 140, 200 145"
              stroke="#2D3748"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />

            {/* Cheeks - blush */}
            <ellipse cx="90" cy="200" rx="15" ry="10" fill="url(#cheekGlow)" />
            <ellipse cx="210" cy="200" rx="15" ry="10" fill="url(#cheekGlow)" />

            {/* Mouth - happy smile */}
            <path
              d="M 125 220 Q 150 250, 175 220"
              stroke="#2D3748"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              className="animate-smile"
            />

            {/* Tongue when happy */}
            {variant === "register" && (
              <ellipse cx="150" cy="235" rx="10" ry="8" fill="#FF9B9B" opacity="0.8" />
            )}
          </g>

          {/* Left Arm */}
          <g className={isWaving ? "animate-wave" : ""} style={{ transformOrigin: "70px 200px" }}>
            <ellipse
              cx="45"
              cy="220"
              rx="25"
              ry="35"
              fill="url(#bodyGradient)"
            />
            {/* Hand */}
            <circle cx="35" cy="195" r="18" fill="url(#bodyGradient)" />
            <ellipse cx="28" cy="190" rx="8" ry="12" fill="rgba(255,255,255,0.2)" />
          </g>

          {/* Right Arm */}
          <g className="animate-arm-idle" style={{ transformOrigin: "230px 200px" }}>
            <ellipse
              cx="255"
              cy="220"
              rx="25"
              ry="35"
              fill="url(#bodyGradient)"
            />
            {/* Hand with phone/card for register variant */}
            <circle cx="265" cy="195" r="18" fill="url(#bodyGradient)" />
            <ellipse cx="272" cy="190" rx="8" ry="12" fill="rgba(255,255,255,0.2)" />
            
            {variant === "register" && (
              <g className="animate-float-card">
                <rect x="250" y="155" width="35" height="25" rx="3" fill="#4A5568" />
                <rect x="253" y="158" width="29" height="19" rx="2" fill="#63B3ED" />
                <rect x="256" y="161" width="8" height="3" rx="1" fill="white" opacity="0.8" />
              </g>
            )}
          </g>

          {/* Feet */}
          <ellipse cx="120" cy="310" rx="30" ry="15" fill="url(#bodyGradient)" />
          <ellipse cx="180" cy="310" rx="30" ry="15" fill="url(#bodyGradient)" />
          
          {/* Feet shine */}
          <ellipse cx="115" cy="305" rx="10" ry="5" fill="rgba(255,255,255,0.3)" />
          <ellipse cx="175" cy="305" rx="10" ry="5" fill="rgba(255,255,255,0.3)" />

          {/* Hat/Accessory for login variant */}
          {variant === "login" && (
            <g className="animate-hat-bob">
              <ellipse cx="150" cy="95" rx="50" ry="15" fill="#48BB78" />
              <path
                d="M 100 95 Q 100 50, 150 40 Q 200 50, 200 95"
                fill="#5AB894"
              />
              <ellipse cx="130" cy="70" rx="15" ry="8" fill="rgba(255,255,255,0.2)" />
              {/* Star decoration */}
              <polygon
                points="150,55 153,63 162,63 155,69 158,77 150,72 142,77 145,69 138,63 147,63"
                fill="#FFD700"
                className="animate-star-spin"
              />
            </g>
          )}

          {/* Crown for register variant */}
          {variant === "register" && (
            <g className="animate-crown-float">
              <path
                d="M 110 90 L 120 60 L 135 80 L 150 50 L 165 80 L 180 60 L 190 90 Z"
                fill="#FFD700"
                stroke="#FFA500"
                strokeWidth="2"
              />
              <circle cx="150" cy="55" r="5" fill="#FF6B6B" />
              <circle cx="120" cy="65" r="4" fill="#63B3ED" />
              <circle cx="180" cy="65" r="4" fill="#63B3ED" />
            </g>
          )}
        </svg>

        {/* Floating decorations around character */}
        <div className="absolute -top-8 -left-8 animate-float-decoration-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-lg flex items-center justify-center text-lg">
            ✨
          </div>
        </div>
        <div className="absolute top-20 -right-12 animate-float-decoration-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-300 to-green-500 shadow-lg flex items-center justify-center text-xl">
            💚
          </div>
        </div>
        <div className="absolute -bottom-4 -left-16 animate-float-decoration-3">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-300 to-blue-500 shadow-lg flex items-center justify-center text-sm">
            🌟
          </div>
        </div>
        <div className="absolute bottom-20 -right-16 animate-float-decoration-4">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-300 to-pink-500 shadow-lg flex items-center justify-center text-base">
            {variant === "login" ? "🔐" : "🎉"}
          </div>
        </div>
      </div>
    </div>
  );
};

// Floating particles/shapes component
const FloatingElements = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating circles */}
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-float-random"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 60 + 20}px`,
            height: `${Math.random() * 60 + 20}px`,
            background: `rgba(124, 224, 168, ${Math.random() * 0.2 + 0.05})`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${Math.random() * 10 + 10}s`,
          }}
        />
      ))}
      
      {/* Floating icons */}
      <div className="absolute top-[10%] left-[5%] animate-bounce-slow opacity-30">
        <svg className="w-12 h-12 text-green-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      </div>
      <div className="absolute top-[20%] right-[8%] animate-float-slow opacity-20">
        <svg className="w-16 h-16 text-green-300" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </div>
      <div className="absolute bottom-[15%] left-[10%] animate-pulse-slow opacity-25">
        <svg className="w-10 h-10 text-teal-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l4.59-4.58L18 11l-6 6z" />
        </svg>
      </div>
      <div className="absolute bottom-[25%] right-[5%] animate-bounce-slow opacity-20" style={{ animationDelay: '1s' }}>
        <svg className="w-14 h-14 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
        </svg>
      </div>
    </div>
  );
};

// Scene decoration - buildings, plants, etc.
const SceneDecoration = ({ variant }: { variant: "login" | "register" }) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
      {/* Ground gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-green-100/50 to-transparent dark:from-green-900/20" />
      
      {/* Grass/Plants */}
      <svg className="absolute bottom-0 left-0 w-full h-24" viewBox="0 0 1200 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="grassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7CE0A8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#48BB78" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <path
          d="M0 100 Q 100 60, 200 80 T 400 70 T 600 85 T 800 65 T 1000 75 T 1200 80 L 1200 100 Z"
          fill="url(#grassGradient)"
        />
      </svg>

      {/* Decorative plants - left side */}
      <div className="absolute bottom-8 left-[5%] animate-sway">
        <svg className="w-16 h-24 text-green-400 opacity-60" viewBox="0 0 50 80">
          <path d="M25 80 L25 40 Q15 30 20 10 Q25 20 25 40" fill="currentColor" />
          <path d="M25 60 Q35 50 40 30 Q30 45 25 60" fill="currentColor" />
          <path d="M25 50 Q15 40 10 25 Q20 38 25 50" fill="currentColor" />
        </svg>
      </div>
      <div className="absolute bottom-6 left-[15%] animate-sway" style={{ animationDelay: '0.5s' }}>
        <svg className="w-12 h-20 text-emerald-500 opacity-50" viewBox="0 0 50 80">
          <ellipse cx="25" cy="65" rx="20" ry="10" fill="currentColor" />
          <path d="M25 70 L25 30 Q20 20 25 5 Q30 20 25 30" fill="currentColor" />
        </svg>
      </div>

      {/* Decorative plants - right side */}
      <div className="absolute bottom-10 right-[8%] animate-sway" style={{ animationDelay: '0.3s' }}>
        <svg className="w-14 h-22 text-teal-400 opacity-50" viewBox="0 0 50 80">
          <path d="M25 80 L25 35 Q10 25 15 5 Q25 18 25 35" fill="currentColor" />
          <path d="M25 55 Q40 45 45 20 Q32 42 25 55" fill="currentColor" />
        </svg>
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

    // Particle system for subtle background animation
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
    const particleCount = Math.min(30, Math.floor(window.innerWidth / 40));

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.3 + 0.1,
        hue: Math.random() * 30 + 140, // Green hue range
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

      // Draw subtle blob shapes
      const time = Date.now() / 3000;
      
      ctx.globalAlpha = isDark ? 0.1 : 0.15;
      
      // Blob 1
      ctx.fillStyle = isDark ? "rgba(124, 224, 168, 0.15)" : "rgba(124, 224, 168, 0.2)";
      ctx.beginPath();
      const blob1X = canvas.width * 0.2;
      const blob1Y = canvas.height * 0.3;
      const blob1Size = 150 + Math.sin(time) * 30;
      for (let i = 0; i < Math.PI * 2; i += 0.1) {
        const r = blob1Size + Math.sin(i * 3 + time) * 30;
        const px = blob1X + Math.cos(i) * r;
        const py = blob1Y + Math.sin(i) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Blob 2
      ctx.fillStyle = isDark ? "rgba(90, 184, 148, 0.12)" : "rgba(90, 184, 148, 0.15)";
      ctx.beginPath();
      const blob2X = canvas.width * 0.8;
      const blob2Y = canvas.height * 0.7;
      const blob2Size = 120 + Math.cos(time * 0.8) * 25;
      for (let i = 0; i < Math.PI * 2; i += 0.1) {
        const r = blob2Size + Math.sin(i * 4 + time * 1.2) * 25;
        const px = blob2X + Math.cos(i) * r;
        const py = blob2Y + Math.sin(i) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha = 1;

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
        ctx.fillStyle = `hsla(${particle.hue}, 70%, 60%, ${particle.opacity})`;
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
      <SceneDecoration variant={variant} />
    </div>
  );
}

// Export the character component separately for use in page layout
export { AnimatedCharacter };