"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react"; 
import { cn } from "@/app/components/lib/utils";

export function PlaceholdersAndVanishInput({
  placeholders,
  onChange,
  onSubmit,
  className,
  inputClassName,
  buttonClassName,
}: {
  placeholders: string[];
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
}) {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [value, setValue] = useState("");
  const [animating, setAnimating] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const newDataRef = useRef<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null); // Tambahkan ref untuk form

  const startAnimation = () => {
    intervalRef.current = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
    }, 3000);
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState !== "visible" && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    } else if (document.visibilityState === "visible") {
      startAnimation();
    }
  };

  useEffect(() => {
    startAnimation();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [placeholders]);

  const draw = useCallback(() => {
    if (!inputRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 800;
    ctx.clearRect(0, 0, 800, 800);
    const computedStyles = getComputedStyle(inputRef.current);

    const fontSize = parseFloat(computedStyles.getPropertyValue("font-size"));
    ctx.font = `${fontSize * 2}px ${computedStyles.fontFamily}`;
    ctx.fillStyle = "#FFF";
    ctx.fillText(value, 16, 40);

    const imageData = ctx.getImageData(0, 0, 800, 800);
    const pixelData = imageData.data;
    const newData: any[] = [];

    for (let t = 0; t < 800; t++) {
      let i = 4 * t * 800;
      for (let n = 0; n < 800; n++) {
        let e = i + 4 * n;
        if (pixelData[e] !== 0 && pixelData[e + 1] !== 0 && pixelData[e + 2] !== 0) {
          newData.push({
            x: n,
            y: t,
            color: [pixelData[e], pixelData[e + 1], pixelData[e + 2], pixelData[e + 3]],
          });
        }
      }
    }

    newDataRef.current = newData.map(({ x, y, color }) => ({
      x,
      y,
      r: 1,
      color: `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`,
    }));
  }, [value]);

  useEffect(() => {
    draw();
  }, [value, draw]);

  const animate = (start: number) => {
    const animateFrame = (pos: number = 0) => {
      requestAnimationFrame(() => {
        const newArr = [];
        for (let i = 0; i < newDataRef.current.length; i++) {
          const current = newDataRef.current[i];
          if (current.x < pos) {
            newArr.push(current);
          } else {
            if (current.r <= 0) {
              current.r = 0;
              continue;
            }
            current.x += Math.random() > 0.5 ? 1 : -1;
            current.y += Math.random() > 0.5 ? 1 : -1;
            current.r -= 0.05 * Math.random();
            newArr.push(current);
          }
        }
        newDataRef.current = newArr;
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
          ctx.clearRect(pos, 0, 800, 800);
          newDataRef.current.forEach((t) => {
            const { x: n, y: i, r: s, color } = t;
            if (n > pos) {
              ctx.beginPath();
              ctx.rect(n, i, s, s);
              ctx.fillStyle = color;
              ctx.strokeStyle = color;
              ctx.stroke();
            }
          });
        }
        if (newDataRef.current.length > 0) {
          animateFrame(pos - 8);
        } else {
          setAnimating(false);
        }
      });
    };
    animateFrame(start);
  };

  // ANIMASI HAPUS - Trigger animasi serpihan saat menghapus
  const vanishAndDelete = useCallback(() => {
    if (!value.trim() || animating) return;
    
    setAnimating(true);
    draw();
    
    const currentValue = value;
    if (currentValue && inputRef.current) {
      const maxX = newDataRef.current.reduce(
        (prev, current) => (current.x > prev ? current.x : prev),
        0
      );
      
      // Animasi serpihan
      animate(maxX);
      
      // Setelah animasi selesai, baru kosongkan input
      setTimeout(() => {
        setValue("");
        const event = {
          target: { value: "" }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(event);
      }, 500); // Delay sedikit untuk sinkron dengan animasi
    }
  }, [value, animating, draw, onChange]);

  // Handle tombol X (delete) - trigger animasi
  const handleClearInput = useCallback(() => {
    if (animating) return;
    vanishAndDelete();
  }, [animating, vanishAndDelete]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !animating) {
      // Cukup submit form saja tanpa melewatkan event keyboard
      formRef.current?.requestSubmit();
      e.preventDefault(); // Mencegah reload halaman
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!value.trim() || animating) return;
    onSubmit && onSubmit(e);
  };

  // Handle perubahan input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!animating) {
      setValue(e.target.value);
      onChange && onChange(e);
    }
  };

  return (
    <form
      ref={formRef} // Tambahkan ref ke form
      className={cn(
        "w-full relative h-12 rounded-xl border border-input bg-background text-foreground shadow-none transition duration-200",
        "px-0",
        className
      )}
      onSubmit={handleSubmit}
    >
      {/* Canvas untuk animasi - hanya muncul saat delete */}
      <canvas
        className={cn(
          "absolute pointer-events-none text-base transform scale-50 top-[18%] left-2 sm:left-3 origin-top-left filter invert dark:invert-0 pr-16",
          !animating ? "opacity-0" : "opacity-100"
        )}
        ref={canvasRef}
      />

      <input
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        ref={inputRef}
        value={value}
        type="text"
        className={cn(
          "w-full h-full border-none bg-transparent focus:outline-none focus:ring-0",
          "text-sm sm:text-base dark:text-foreground text-foreground",
          "pl-4 sm:pl-4",
          // Sesuaikan padding kanan berdasarkan apakah ada nilai
          value ? "pr-24" : "pr-20",
          inputClassName,
          animating && "text-transparent dark:text-transparent"
        )}
      />

      {/* Container untuk tombol aksi di kanan */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {/* Tombol Clear (X) - Muncul hanya ketika ada teks */}
        {value && !animating && (
          <button
            type="button"
            onClick={handleClearInput}
            className="h-8 w-8 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7CE0A8]"
            aria-label="Hapus pencarian"
            title="Hapus"
          >
            <X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
        )}

        {/* Tombol Submit (Search) */}
        <button
          disabled={!value || animating}
          type="submit"
          className={cn(
            "h-8 w-8 rounded-md",
            "disabled:bg-muted bg-muted/70 hover:bg-muted",
            "dark:disabled:bg-zinc-800 dark:bg-zinc-800/70 dark:hover:bg-zinc-800",
            "flex items-center justify-center transition",
            buttonClassName
          )}
          aria-label="Cari"
          title="Cari"
        >
          <motion.div whileTap={{ scale: 0.95 }}>
            <Search className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </button>
      </div>

      <div className="absolute inset-0 flex items-center pointer-events-none">
        <AnimatePresence mode="wait">
          {!value && !animating && (
            <motion.p
              initial={{ y: 5, opacity: 0 }}
              key={`current-placeholder-${currentPlaceholder}`}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -15, opacity: 0 }}
              transition={{ duration: 0.3, ease: "linear" }}
              className="dark:text-muted-foreground text-sm sm:text-base font-normal text-muted-foreground pl-4 text-left w-[calc(100%-4rem)] truncate"
            >
              {placeholders[currentPlaceholder]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}