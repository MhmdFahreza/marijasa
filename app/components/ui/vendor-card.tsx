// app/components/ui/vendor-card.tsx
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
import { Heart, CheckCircle2 } from "lucide-react";
import { LoaderTwo } from "@/app/components/transition/loader";
import { RatingStars } from "@/app/components/ui/rating-stars";

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

interface VendorCardProps {
  vendor: Vendor;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
  userId?: string;
}

export default function VendorCard({ vendor, isLoggedIn, onLoginRequired, userId }: VendorCardProps) {
  const { id, name, verified, rating, reviewCount, tags, summary, gallery, avatar } = vendor;
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if vendor is in favorites dari database
  const checkFavorite = useCallback(async () => {
    if (!isLoggedIn || !userId) {
      setIsFavorite(false);
      return;
    }

    try {
      const response = await fetch(`/api/user/favorites/check?vendorId=${id}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setIsFavorite(data.isFavorite);
      }
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  }, [id, isLoggedIn, userId]);

  useEffect(() => {
    checkFavorite();
  }, [checkFavorite]);

  // Listen for favorites update event from other components
  useEffect(() => {
    const handleFavoritesUpdate = () => {
      checkFavorite();
    };

    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);
    return () => window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
  }, [checkFavorite]);

  const handleToggleFavorite = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Cek login terlebih dahulu
    if (!isLoggedIn || !userId) {
      onLoginRequired();
      return;
    }

    setIsLoading(true);
    setIsAnimating(true);

    try {
      const endpoint = isFavorite ? '/api/user/favorites/remove' : '/api/user/favorites/add';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ vendorId: id }),
      });

      if (response.ok) {
        // Update local state immediately for smooth UI
        setIsFavorite(!isFavorite);
        
        // Dispatch event untuk update components lain
        window.dispatchEvent(new CustomEvent('favoritesUpdated'));
      } else {
        const error = await response.json();
        console.error('Error toggling favorite:', error);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsAnimating(false), 400);
    }
  }, [id, isFavorite, isLoggedIn, userId, onLoginRequired]);

  const handleViewProfile = useCallback(() => {
    setIsNavigating(true);
    setTimeout(() => {
      router.push(`/jasa/detailjasa/${id}`);
    }, prefersReduced ? 50 : 250);
  }, [router, id, prefersReduced]);

  const handleOrderNow = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Cek login terlebih dahulu
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }

    setIsNavigating(true);
    setTimeout(() => {
      router.push(`/jasa/detailjasa/${id}/form`);
    }, prefersReduced ? 50 : 250);
  }, [router, id, prefersReduced, isLoggedIn, onLoginRequired]);

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
                          disabled={isLoading}
                          className="ml-auto h-6 w-6 p-0.5 md:hidden shrink-0 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center active:scale-95 relative disabled:opacity-50"
                          aria-label={isFavorite ? "Hapus dari favorit" : "Tambah ke favorit"}
                        >
                          <motion.div
                            animate={isAnimating ? { scale: [1, 1.2, 1] } : {}}
                            transition={{ duration: 0.3 }}
                          >
                            <Heart
                              className={`h-3 w-3 transition-all duration-200 ${
                                isFavorite
                                  ? "text-[#7CE0A8] fill-[#7CE0A8] scale-110"
                                  : "text-muted-foreground scale-100"
                              }`}
                            />
                          </motion.div>
                          {isAnimating && (
                            <motion.span
                              initial={{ opacity: 0.6, scale: 0.8 }}
                              animate={{ opacity: 0, scale: 2 }}
                              transition={{ duration: 0.4 }}
                              className="absolute inset-0 rounded-full bg-[#7CE0A8]/20"
                            />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {!isLoggedIn 
                          ? "Login untuk menyimpan favorit"
                          : isFavorite 
                            ? "Hapus dari favorit" 
                            : "Tambah ke favorit"
                        }
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Rating */}
                <div className="mt-1 flex items-center gap-1.5 text-[10px] sm:text-sm md:text-base text-muted-foreground">
                  <RatingStars value={rating} size="sm" />
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
                      disabled={isLoading}
                      className="self-end p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors relative active:scale-95 disabled:opacity-50"
                      aria-label={isFavorite ? "Hapus dari favorit" : "Tambah ke favorit"}
                    >
                      <motion.div
                        animate={isAnimating ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        <Heart
                          className={`h-5 w-5 transition-all duration-200 ${
                            isFavorite
                              ? "text-[#7CE0A8] fill-[#7CE0A8] scale-110"
                              : "text-muted-foreground scale-100"
                          }`}
                        />
                      </motion.div>
                      {isAnimating && (
                        <motion.span
                          initial={{ opacity: 0.6, scale: 0.8 }}
                          animate={{ opacity: 0, scale: 2 }}
                          transition={{ duration: 0.4 }}
                          className="absolute inset-0 rounded-full bg-[#7CE0A8]/20"
                        />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {!isLoggedIn 
                      ? "Login untuk menyimpan favorit"
                      : isFavorite 
                        ? "Hapus dari favorit" 
                        : "Tambah ke favorit"
                    }
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