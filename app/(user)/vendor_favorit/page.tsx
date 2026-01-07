// app/vendor_favorit/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/app/components/ui/breadcrumb";
import { Card } from "@/app/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import { Heart, Star, ArrowRight, Sparkles, Package } from "lucide-react";
import SiteFooter from "@/app/footer";
import { LoaderTwo } from "@/app/components/transition/loader";
import { useAuth } from "@/app/components/contexts/AuthContext";

type FavoriteVendor = {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  avatar?: string;
  tags: string[];
  verified?: boolean;
  addedAt?: string;
};

export default function VendorFavoritPage() {
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  const { user, isAuthenticated } = useAuth();
  
  const [favorites, setFavorites] = useState<FavoriteVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  // Load favorites dari API
  const loadFavoritesFromAPI = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setFavorites([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/user/favorites', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || []);
      } else {
        console.error('Error loading favorites:', await response.text());
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    loadFavoritesFromAPI();
  }, [loadFavoritesFromAPI]);

  // Listen for favorites updates
  useEffect(() => {
    const handleFavoritesUpdate = () => {
      loadFavoritesFromAPI();
    };

    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);

    return () => {
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
    };
  }, [loadFavoritesFromAPI]);

  // Remove favorite handler
  const handleRemoveFavorite = useCallback(async (vendorId: string) => {
    if (!isAuthenticated || !user) return;

    // Tandai sebagai removing
    setRemovingIds(prev => new Set(prev).add(vendorId));

    // Hapus dari state langsung untuk UX yang lebih baik
    setFavorites(prev => prev.filter(v => v.id !== vendorId));

    try {
      const response = await fetch('/api/user/favorites/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ vendorId }),
      });

      if (!response.ok) {
        // Jika gagal, kembalikan ke state sebelumnya
        await loadFavoritesFromAPI();
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      // Jika error, kembalikan ke state sebelumnya
      await loadFavoritesFromAPI();
    } finally {
      // Clear removing state setelah animasi
      setTimeout(() => {
        setRemovingIds(prev => {
          const next = new Set(prev);
          next.delete(vendorId);
          return next;
        });
      }, 300);
    }
  }, [isAuthenticated, user, loadFavoritesFromAPI]);

  // Navigation handlers
  const handleViewProfile = useCallback((vendorId: string) => {
    setLeaving(true);
    setTimeout(() => {
      router.push(`/jasa/detailjasa/${vendorId}`);
    }, prefersReduced ? 50 : 200);
  }, [router, prefersReduced]);

  const handleHomeClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setLeaving(true);
    setTimeout(() => {
      router.push("/");
    }, prefersReduced ? 50 : 200);
  }, [router, prefersReduced]);

  const handleBrowseServices = useCallback(() => {
    setLeaving(true);
    setTimeout(() => {
      router.push("/jasa");
    }, prefersReduced ? 50 : 200);
  }, [router, prefersReduced]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderTwo />
      </div>
    );
  }

  // Redirect ke login jika tidak authenticated
  if (!isAuthenticated) {
    router.push('/login');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderTwo />
      </div>
    );
  }

  return (
    <>
      <motion.main
        className="min-h-[60vh] w-full max-w-7xl mx-auto px-4 py-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReduced ? 0 : 0.25, ease: "easeOut" }}
      >
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <motion.span whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                    <Link href="/" onClick={handleHomeClick}>Home</Link>
                  </motion.span>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Vendor Favorit</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#7CE0A8]/20 to-[#7CE0A8]/10">
              <Heart className="w-6 h-6 md:w-8 md:h-8 text-[#7CE0A8] fill-[#7CE0A8]" />
            </div>
            <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-[#7CE0A8] to-[#5CA68A] bg-clip-text text-transparent">
              Vendor Favorit Saya
            </h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground ml-14 md:ml-16">
            {favorites.length > 0
              ? `Anda memiliki ${favorites.length} vendor favorit`
              : "Belum ada vendor favorit yang tersimpan"}
          </p>
        </motion.div>

        {/* Content */}
        {favorites.length === 0 ? (
          // Empty State
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col items-center justify-center py-16 px-4"
          >
            <div className="relative mb-8">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-[#7CE0A8]/10 to-[#7CE0A8]/5 flex items-center justify-center">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-[#7CE0A8]/20 to-[#7CE0A8]/10 flex items-center justify-center">
                  <Heart className="w-12 h-12 md:w-16 md:h-16 text-[#7CE0A8]" />
                </div>
              </div>
              <motion.div
                className="absolute -top-2 -right-2"
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              >
                <Sparkles className="w-8 h-8 text-[#7CE0A8]" />
              </motion.div>
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3 text-center">
              Belum Ada Vendor Favorit
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mb-8 text-center max-w-md">
              Mulai tambahkan vendor favorit Anda dengan mengklik ikon hati pada vendor yang Anda sukai
            </p>

            <Button
              onClick={handleBrowseServices}
              className="bg-gradient-to-r from-[#7CE0A8] to-[#5CA68A] hover:from-[#6BCF97] hover:to-[#4A8D74] text-white px-8 py-6 rounded-xl text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              <Package className="w-5 h-5" />
              Jelajahi Layanan
              <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        ) : (
          // Vendor Grid
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.08,
                  delayChildren: 0.15,
                },
              },
            }}
          >
            <AnimatePresence mode="popLayout">
              {favorites.map((vendor) => (
                <motion.div
                  key={vendor.id}
                  layout
                  variants={{
                    hidden: { opacity: 0, scale: 0.9 },
                    show: { opacity: 1, scale: 1 },
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.8,
                    transition: { duration: 0.2 },
                  }}
                  transition={{
                    duration: prefersReduced ? 0 : 0.3,
                    ease: "easeOut",
                  }}
                >
                  <Card className="group relative overflow-hidden rounded-2xl border-2 border-transparent hover:border-[#7CE0A8]/30 transition-all duration-300 hover:shadow-xl">
                    {/* Gradient Background on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#7CE0A8]/0 to-[#7CE0A8]/0 group-hover:from-[#7CE0A8]/5 group-hover:to-[#5CA68A]/5 transition-all duration-300" />

                    <div className="relative p-5">
                      {/* Favorite Button */}
                      <button
                        onClick={() => handleRemoveFavorite(vendor.id)}
                        disabled={removingIds.has(vendor.id)}
                        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 dark:bg-neutral-800/90 shadow-md hover:shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 disabled:opacity-50"
                        aria-label="Hapus dari favorit"
                      >
                        <Heart className="w-5 h-5 text-[#7CE0A8] fill-[#7CE0A8]" />
                      </button>

                      {/* Avatar */}
                      <div className="flex justify-center mb-4">
                        <div className="hover:scale-105 transition-transform">
                          <Avatar className="w-20 h-20 md:w-24 md:h-24 border-4 border-[#7CE0A8]/20 shadow-lg">
                            <AvatarImage src={vendor.avatar} alt={vendor.name} />
                            <AvatarFallback className="bg-gradient-to-br from-[#7CE0A8] to-[#5CA68A] text-white text-xl font-bold">
                              {vendor.name
                                .split(" ")
                                .map(w => w[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>

                      {/* Vendor Info */}
                      <div className="text-center mb-4">
                        <h3 className="text-base md:text-lg font-bold text-foreground mb-2 line-clamp-2 min-h-[3rem]">
                          {vendor.name}
                        </h3>

                        {/* Rating */}
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(vendor.rating)
                                    ? "fill-[#7CE0A8] text-[#7CE0A8]"
                                    : "text-muted-foreground/30"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-semibold text-foreground">
                            {vendor.rating.toFixed(1)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({vendor.reviewCount})
                          </span>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap justify-center gap-1 mb-4">
                          {vendor.tags?.slice(0, 2).map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 text-[10px] md:text-xs rounded-full bg-[#7CE0A8]/10 text-[#7CE0A8] font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                          {vendor.tags && vendor.tags.length > 2 && (
                            <span className="px-2 py-1 text-[10px] md:text-xs rounded-full bg-[#7CE0A8]/10 text-[#7CE0A8] font-medium">
                              +{vendor.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* View Profile Button */}
                      <Button
                        onClick={() => handleViewProfile(vendor.id)}
                        className="w-full bg-gradient-to-r from-[#7CE0A8] to-[#5CA68A] hover:from-[#6BCF97] hover:to-[#4A8D74] text-white rounded-xl py-2.5 font-medium transition-all duration-300 flex items-center justify-center gap-2 group/btn"
                      >
                        Lihat Profil
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Footer */}
        <div className="mt-16">
          <SiteFooter />
        </div>
      </motion.main>

      {/* Navigation Loader */}
      <AnimatePresence>
        {leaving && (
          <motion.div
            key="route-leave"
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