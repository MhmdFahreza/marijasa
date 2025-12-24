"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { Card, CardHeader } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { ScrollArea, ScrollBar } from "@/app/components/ui/scroll-area";
import { AspectRatio } from "@/app/components/ui/aspect-ratio";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";
import { Separator } from "@/app/components/ui/separator";
import { Heart, Star, CheckCircle2 } from "lucide-react";
import { LoaderTwo } from "@/app/components/transition/loader";

type WorkImage = { src: string; alt: string };

export type Vendor = {
  [x: string]: any;
  id: string;
  name: string;
  verified?: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
  summary: string;
  gallery: WorkImage[];
  avatar?: string;
};

const FAVORITES_STORAGE_KEY = "favoriteVendors";

// Helper function untuk manage favorites
const getFavorites = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveFavorites = (ids: string[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
  } catch (error) {
    console.error("Error saving favorites:", error);
  }
};

export default function VendorCard({ vendor }: { vendor: Vendor }) {
  const { id, name, verified, rating, reviewCount, tags, summary, gallery, avatar } = vendor;
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Check if vendor is in favorites on mount - optimized
  useEffect(() => {
    const favorites = getFavorites();
    setIsFavorite(favorites.includes(id));
  }, [id]);

  const handleToggleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    const favorites = getFavorites();
    const newIsFavorite = !isFavorite;
    
    setIsFavorite(newIsFavorite);
    setIsAnimating(true);

    if (newIsFavorite) {
      if (!favorites.includes(id)) {
        saveFavorites([...favorites, id]);
      }
    } else {
      saveFavorites(favorites.filter(favId => favId !== id));
    }

    setTimeout(() => setIsAnimating(false), 400);
  }, [id, isFavorite]);

  const handleViewProfile = useCallback(() => {
    setIsNavigating(true);
    setTimeout(() => {
      router.push(`/jasa/detailjasa/${id}`);
    }, prefersReduced ? 50 : 250);
  }, [router, id, prefersReduced]);

  const handleOrderNow = useCallback(() => {
    setIsNavigating(true);
    setTimeout(() => {
      router.push(`/jasa/detailjasa/${id}/form`);
    }, prefersReduced ? 50 : 250);
  }, [router, id, prefersReduced]);

  return (
    <>
      <Card className="w-full overflow-hidden rounded-2xl md:rounded-3xl">
        <CardHeader className="p-3 sm:p-5 md:p-6">
          <div
            className="
            flex flex-col gap-3
            md:grid md:grid-cols-[minmax(0,3fr)_minmax(260px,2fr)]
            md:gap-4 md:items-start
          "
          >
            {/* KIRI: info vendor */}
            <div className="flex items-start gap-2 md:gap-4 min-w-0">
              <Avatar className="h-9 w-9 sm:h-12 sm:w-12 md:h-14 md:w-14 shrink-0">
                <AvatarImage src={avatar ?? ""} alt={name} />
                <AvatarFallback>
                  {(name || "?")
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                {/* Nama + verified + like mobile */}
                <div className="flex items-start gap-1">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 flex-wrap">
                      <h2 className="text-xs sm:text-base md:text-2xl font-semibold leading-tight line-clamp-1">
                        {name}
                      </h2>
                      {verified && <Check className="text-primary" />}
                    </div>
                  </div>

                  {/* Favorite mobile */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={handleToggleFavorite}
                          className="ml-auto h-6 w-6 p-0.5 md:hidden shrink-0 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center active:scale-95 relative"
                          aria-label={isFavorite ? "Hapus dari favorit" : "Tambah ke favorit"}
                        >
                          <Heart
                            className={`h-3 w-3 transition-all duration-200 ${
                              isFavorite
                                ? "text-[#7CE0A8] fill-[#7CE0A8] scale-110"
                                : "text-muted-foreground scale-100"
                            }`}
                          />
                          {isAnimating && (
                            <span className="absolute inset-0 rounded-full bg-[#7CE0A8]/20 animate-ping" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isFavorite ? "Hapus dari favorit" : "Tambah ke favorit"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Rating */}
                <div className="mt-1 flex items-center gap-1 text-[10px] sm:text-sm md:text-base text-muted-foreground">
                  <RatingStars value={rating} />
                  <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
                  <span>({reviewCount})</span>
                </div>

                {/* Tag mobile */}
                <div className="mt-1.5 flex flex-wrap gap-1 items-center md:hidden">
                  {tags.slice(0, 1).map((t, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="rounded-full px-1.5 py-0 text-[8px] leading-none h-4"
                    >
                      {t}
                    </Badge>
                  ))}
                  {tags.length > 1 && (
                    <span className="text-[7px] text-blue-500 font-medium">
                      +{tags.length - 1} lainnya
                    </span>
                  )}
                </div>

                {/* Tag tablet/desktop */}
                <div className="mt-2 hidden md:flex flex-wrap gap-1.5 items-center">
                  {tags.slice(0, 3).map((t, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="rounded-full px-2 py-0.5 text-xs md:text-sm"
                    >
                      {t}
                    </Badge>
                  ))}
                  {tags.length > 3 && (
                    <span className="text-[10px] md:text-xs text-blue-500 font-medium">
                      +{tags.length - 3} lainnya
                    </span>
                  )}
                </div>

                {/* Deskripsi */}
                <p className="mt-1.5 text-[10px] sm:text-sm md:text-base text-foreground/80 leading-relaxed line-clamp-2 md:line-clamp-5">
                  {summary}
                </p>

                {/* Aksi mobile */}
                <div className="mt-2 flex gap-1.5 md:hidden">
                  <Button
                    className="flex-1 px-1.5 py-1 h-7 bg-[#7CE0A8] text-white hover:bg-[#5CA68A] text-[9px] font-medium whitespace-nowrap"
                    onClick={handleOrderNow}
                  >
                    Pesan Sekarang
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 px-1.5 py-1 h-7 text-[9px] font-medium whitespace-nowrap"
                    onClick={handleViewProfile}
                  >
                    Lihat Profil
                  </Button>
                </div>
              </div>
            </div>

            {/* KANAN: favorite + tombol + galeri (md+) */}
            <div className="hidden md:flex flex-col gap-3 items-end w-full pr-4">
              {/* Favorite desktop */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleToggleFavorite}
                      className="self-end p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors relative active:scale-95"
                      aria-label={isFavorite ? "Hapus dari favorit" : "Tambah ke favorit"}
                    >
                      <Heart
                        className={`h-5 w-5 transition-all duration-200 ${
                          isFavorite
                            ? "text-[#7CE0A8] fill-[#7CE0A8] scale-110"
                            : "text-muted-foreground scale-100"
                        }`}
                      />
                      {isAnimating && (
                        <span className="absolute inset-0 rounded-full bg-[#7CE0A8]/20 animate-ping" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isFavorite ? "Hapus dari favorit" : "Tambah ke favorit"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Tombol aksi desktop */}
              <div className="flex gap-2 justify-end w-full">
                <Button
                  className="min-w-[150px] px-4 bg-[#7CE0A8] text-white hover:bg-[#5CA68A]"
                  onClick={handleOrderNow}
                >
                  Pesan Sekarang
                </Button>
                <Button
                  variant="outline"
                  className="min-w-[130px] px-4"
                  onClick={handleViewProfile}
                >
                  Lihat Profil
                </Button>
              </div>

              {/* Galeri */}
              {gallery && gallery.length > 0 && (
                <div className="w-full mt-2">
                  <div className="flex items-center justify-between mb-2 pr-1">
                    <span className="text-sm md:text-base text-muted-foreground">
                      Hasil Pekerjaan
                    </span>
                  </div>
                  <ScrollArea className="w-full whitespace-nowrap overflow-x-auto">
                    <div className="flex gap-3">
                      {gallery.map((img, i) => (
                        <div
                          key={i}
                          className="w-[96px] lg:w-[120px] xl:w-[140px] shrink-0"
                        >
                          <AspectRatio ratio={1}>
                            <Image
                              src={img.src}
                              alt={img.alt}
                              fill
                              unoptimized
                              className="rounded-md object-cover"
                            />
                          </AspectRatio>
                        </div>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <Separator className="hidden md:block" />
        <div className="hidden md:block py-3 px-6" />
      </Card>

      <AnimatePresence>
        {isNavigating && (
          <motion.div
            key="vendor-navigation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.3 }}
            className="fixed inset-0 z-[9999] bg-white dark:bg-neutral-950 flex items-center justify-center"
          >
            <LoaderTwo />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[8px] sm:text-xs md:text-sm font-medium ${className ?? ""}`}
    >
      <CheckCircle2 className="h-2.5 w-2.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
      Verified
    </span>
  );
}

function RatingStars({ value }: { value: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const total = 5;

  return (
    <div className="flex items-center">
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < full || (i === full && half);
        return (
          <Star
            key={i}
            className={`h-2.5 w-2.5 sm:h-4 sm:w-4 md:h-5 md:w-5 ${
              filled ? "fill-current" : "text-muted-foreground/40"
            }`}
            aria-hidden="true"
          />
        );
      })}
      <span className="sr-only">{value} dari 5</span>
    </div>
  );
}