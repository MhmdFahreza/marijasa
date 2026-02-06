// app/components/ui/vendor-card.tsx
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
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
  isFavorite?: boolean;
};

interface VendorCardProps {
  vendor: Vendor;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
  userId?: string;
}

export default function VendorCard({ vendor, isLoggedIn, onLoginRequired }: VendorCardProps) {
  const { id, name, verified, rating, reviewCount, tags, summary, gallery, avatar } = vendor;
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isFavorite, setIsFavorite] = useState(vendor.isFavorite || false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Update local state when vendor prop changes
  useEffect(() => {
    setIsFavorite(vendor.isFavorite || false);
  }, [vendor.isFavorite]);

  const handleToggleFavorite = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Check login first
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }

    // Prevent double-click
    if (isProcessing) return;

    // Optimistic update - instant UI feedback
    const previousState = isFavorite;
    setIsFavorite(!isFavorite);
    setIsProcessing(true);
    setIsAnimating(true);

    try {
      const endpoint = previousState ? '/api/user/favorites/remove' : '/api/user/favorites/add';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ vendorId: id }),
      });

      if (response.ok) {
        // Dispatch event untuk update vendor lain
        window.dispatchEvent(new CustomEvent('favoriteToggled', { 
          detail: { vendorId: id, isFavorite: !previousState }
        }));
      } else if (response.status === 401) {
        // Revert on auth failure
        setIsFavorite(previousState);
        onLoginRequired();
      } else {
        // Revert on error
        setIsFavorite(previousState);
        const error = await response.json();
        console.error('Error toggling favorite:', error);
      }
    } catch (error) {
      // Revert on network error
      setIsFavorite(previousState);
      console.error('Network error toggling favorite:', error);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setIsAnimating(false), 300);
    }
  }, [id, isFavorite, isLoggedIn, onLoginRequired, isProcessing]);

  const handleViewProfile = useCallback(() => {
    setIsNavigating(true);
    setTimeout(() => {
      router.push(`/jasa/detailjasa/${id}`);
    }, prefersReduced ? 50 : 250);
  }, [router, id, prefersReduced]);

  const handleOrderNow = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
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
      <Card className="w-full overflow-hidden rounded-2xl md:rounded-3xl transition-all duration-200 hover:shadow-md">
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
              {/* Avatar - Mobile & Tablet/Desktop */}
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 shrink-0 ring-2 ring-offset-2 ring-[#7CE0A8]/20">
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
                {/* MOBILE LAYOUT: Vertical stack dengan favorite button di kanan */}
                <div className="md:hidden">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    {/* Kiri: Nama + Verified */}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-sm font-semibold leading-tight line-clamp-1 mb-0.5">
                        {name}
                      </h2>
                      {verified && <Check className="text-primary" />}
                    </div>

                    {/* Kanan: Favorite button */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={handleToggleFavorite}
                            disabled={isProcessing}
                            className="shrink-0 h-7 w-7 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all duration-200 flex items-center justify-center active:scale-95 relative disabled:opacity-70"
                            aria-label={isFavorite ? "Hapus dari favorit" : "Tambah ke favorit"}
                          >
                            <motion.div
                              animate={isAnimating ? { scale: [1, 1.3, 1] } : {}}
                              transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                              <Heart
                                className={`h-4 w-4 transition-all duration-200 ${
                                  isFavorite
                                    ? "text-[#7CE0A8] fill-[#7CE0A8] scale-110"
                                    : "text-muted-foreground scale-100"
                                }`}
                              />
                            </motion.div>
                            {isAnimating && (
                              <motion.span
                                initial={{ opacity: 0.6, scale: 0.8 }}
                                animate={{ opacity: 0, scale: 2.5 }}
                                transition={{ duration: 0.4 }}
                                className="absolute inset-0 rounded-full bg-[#7CE0A8]/30"
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

                  {/* Rating - langsung dibawah nama */}
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1.5">
                    <RatingStars value={rating} size="sm" />
                    <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
                    <span>({reviewCount})</span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 items-center mb-2">
                    {tags.slice(0, 2).map((t, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="rounded-full px-1.5 py-0 text-[9px] leading-none h-4"
                      >
                        {t}
                      </Badge>
                    ))}
                    {tags.length > 2 && (
                      <span className="text-[9px] text-blue-500 font-medium">
                        +{tags.length - 2} lainnya
                      </span>
                    )}
                  </div>

                  {/* Deskripsi */}
                  <p className="text-[11px] text-foreground/80 leading-relaxed line-clamp-2 mb-2">
                    {summary}
                  </p>

                  {/* Tombol aksi */}
                  <div className="flex gap-1.5">
                    <Button
                      className="flex-1 px-2 py-1 h-7 bg-[#7CE0A8] text-white hover:bg-[#5CA68A] text-[10px] font-medium whitespace-nowrap transition-all"
                      onClick={handleOrderNow}
                    >
                      Pesan Sekarang
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 px-2 py-1 h-7 text-[10px] font-medium whitespace-nowrap transition-all"
                      onClick={handleViewProfile}
                    >
                      Lihat Profil
                    </Button>
                  </div>
                </div>

                {/* TABLET/DESKTOP LAYOUT: Original layout */}
                <div className="hidden md:block">
                  <div className="flex items-start justify-between gap-1.5 mb-1">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <h2 className="text-base md:text-2xl font-semibold leading-tight line-clamp-1">
                          {name}
                        </h2>
                        {verified && <Check className="text-primary shrink-0" />}
                      </div>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1.5 text-sm md:text-base text-muted-foreground mb-2">
                    <RatingStars value={rating} size="sm" />
                    <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
                    <span>({reviewCount})</span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 items-center mb-2">
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
                  <p className="text-sm md:text-base text-foreground/80 leading-relaxed line-clamp-5">
                    {summary}
                  </p>
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
                      disabled={isProcessing}
                      className="self-end p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all duration-200 relative active:scale-95 disabled:opacity-70"
                      aria-label={isFavorite ? "Hapus dari favorit" : "Tambah ke favorit"}
                    >
                      <motion.div
                        animate={isAnimating ? { scale: [1, 1.3, 1] } : {}}
                        transition={{ duration: 0.3, ease: "easeOut" }}
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
                          animate={{ opacity: 0, scale: 2.5 }}
                          transition={{ duration: 0.4 }}
                          className="absolute inset-0 rounded-full bg-[#7CE0A8]/30"
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
                  className="min-w-[150px] px-4 bg-[#7CE0A8] text-white hover:bg-[#5CA68A] transition-all"
                  onClick={handleOrderNow}
                >
                  Pesan Sekarang
                </Button>
                <Button
                  variant="outline"
                  className="min-w-[130px] px-4 transition-all"
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
                          className="w-[96px] lg:w-[120px] xl:w-[140px] shrink-0 group"
                        >
                          <AspectRatio ratio={1}>
                            <Image
                              src={img.src}
                              alt={img.alt}
                              fill
                              unoptimized
                              className="rounded-md object-cover transition-transform duration-200 group-hover:scale-105"
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
      className={`inline-flex items-center gap-0.5 text-[9px] sm:text-xs md:text-sm font-medium ${className ?? ""}`}
    >
      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
      Verified
    </span>
  );
}