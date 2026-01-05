"use client";

import { useEffect, useRef } from "react";

interface AnimatedBackgroundProps {
  variant?: "login" | "register";
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  opacity: number;
  spin: number;
  spinSpeed: number;
  update: () => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

export function AnimatedBackground({
  variant = "login",
}: AnimatedBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Animation particles
    const particles: Particle[] = [];
    const particleCount = Math.min(
      50,
      Math.floor(window.innerWidth / 20)
    );

    // Create particle factory function
    const createParticle = (): Particle => {
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      return {
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        color: [
          "rgba(124, 224, 168, 0.3)", // #7CE0A8
          "rgba(90, 184, 148, 0.2)", // #5AB894
          "rgba(107, 203, 150, 0.25)", // #6bcb96
          "rgba(124, 224, 168, 0.15)",
          "rgba(255, 255, 255, 0.1)",
        ][Math.floor(Math.random() * 5)],
        opacity: Math.random() * 0.5 + 0.1,
        spin: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() - 0.5) * 0.02,

        update() {
          this.x += this.speedX;
          this.y += this.speedY;
          this.spin += this.spinSpeed;

          // Wrap around screen
          if (this.x > canvasWidth) this.x = -this.size;
          if (this.x < -this.size) this.x = canvasWidth;
          if (this.y > canvasHeight) this.y = -this.size;
          if (this.y < -this.size) this.y = canvasHeight;

          // Pulse effect
          this.opacity += (Math.random() - 0.5) * 0.02;
          this.opacity = Math.max(0.05, Math.min(0.5, this.opacity));
        },

        draw(ctx: CanvasRenderingContext2D) {
          ctx.save();
          ctx.translate(this.x, this.y);
          ctx.rotate(this.spin);

          ctx.fillStyle = this.color;
          ctx.globalAlpha = this.opacity;

          // Draw hexagon shape
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = this.size * Math.cos(angle);
            const y = this.size * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();

          ctx.restore();
        },
      };
    };

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle());
    }

    // Animation loop
    let animationFrameId: number;

    const drawBlobs = (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number
    ) => {
      const time = Date.now() / 1000;

      // Blob 1 - Top right
      drawBlob(
        ctx,
        width * 0.85,
        height * 0.15,
        150 + Math.sin(time * 0.5) * 30,
        "rgba(124, 224, 168, 0.08)"
      );

      // Blob 2 - Bottom left
      drawBlob(
        ctx,
        width * 0.15,
        height * 0.85,
        120 + Math.cos(time * 0.4) * 25,
        "rgba(124, 224, 168, 0.06)"
      );

      // Blob 3 - Center
      drawBlob(
        ctx,
        width * 0.5,
        height * 0.5,
        100 + Math.sin(time * 0.3) * 20,
        "rgba(90, 184, 148, 0.04)"
      );
    };

    const drawBlob = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      color: string
    ) => {
      const time = Date.now() / 2000;

      ctx.fillStyle = color;
      ctx.beginPath();

      // Draw smooth blob shape
      for (let i = 0; i < Math.PI * 2; i += 0.1) {
        const r = size + Math.sin(i * 3 + time) * (size * 0.3);
        const px = x + Math.cos(i) * r;
        const py = y + Math.sin(i) * r;

        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }

      ctx.closePath();
      ctx.fill();

      // Add blur effect
      ctx.filter = "blur(60px)";
      ctx.fill();
      ctx.filter = "none";
    };

    const drawConnections = (
      ctx: CanvasRenderingContext2D,
      particles: Particle[]
    ) => {
      const connectionDistance = 150;

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            ctx.strokeStyle = `rgba(124, 224, 168, ${
              0.15 * (1 - distance / connectionDistance)
            })`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      if (!canvas || !ctx) return;

      // Clear canvas dengan gradient
      const gradient = ctx.createLinearGradient(
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Check if dark mode
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

      if (isDark) {
        gradient.addColorStop(0, "rgba(31, 33, 33, 1)");
        gradient.addColorStop(0.5, "rgba(38, 40, 40, 0.8)");
        gradient.addColorStop(1, "rgba(31, 33, 33, 1)");
      } else {
        gradient.addColorStop(0, "rgba(255, 255, 253, 1)");
        gradient.addColorStop(0.5, "rgba(252, 252, 249, 0.9)");
        gradient.addColorStop(1, "rgba(255, 255, 253, 1)");
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw animated blobs
      drawBlobs(ctx, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach((particle) => {
        particle.update();
        particle.draw(ctx);
      });

      // Draw connection lines between nearby particles
      drawConnections(ctx, particles);

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 w-full h-full"
      style={{ background: "transparent" }}
    />
  );
}