"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/app/components/ui/breadcrumb";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Send } from "lucide-react";
import { Vendors } from "@/app/data/dataVendor";
import SiteFooter from "@/app/footer";
import { LoaderTwo } from "@/app/components/transition/loader";
import { LoginForm } from "@/app/components/ui/login-form";
import { Star, CheckCircle2, Heart, MapPin, Phone, MessageCircle, AlertCircle } from "lucide-react";

type GalleryImage = {
  src: string;
  alt: string;
};

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  const [leaving, setLeaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("layanan");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  const vendorId = params.vendorId as string;
  const vendor = Vendors.find((v) => v.id === vendorId);

  // Cek status login saat komponen dimount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('userToken');
      const userData = localStorage.getItem('user');
      setIsLoggedIn(!!token);

      // Load favorites from localStorage
      const savedFavorites = localStorage.getItem('favorites');
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    }
  }, []);

  // Simpan favorites ke localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('favorites', JSON.stringify(favorites));
    }
  }, [favorites]);

  const handleNavigation = async (path: string) => {
    setLeaving(true);
    await new Promise((r) => setTimeout(r, prefersReduced ? 0 : 220));
    router.push(path);
  };

  const scrollToSection = (sectionId: string) => {
    setActiveTab(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    }
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setShowLoginModal(false);
  };

  const handleFavoriteClick = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    if (vendorId) {
      if (favorites.includes(vendorId)) {
        // Remove from favorites
        setFavorites(prev => prev.filter(id => id !== vendorId));
      } else {
        // Add to favorites
        setFavorites(prev => [...prev, vendorId]);
      }
    }
  };

  const handlePesanSekarang = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    handleNavigation(`/jasa/detailjasa/${vendorId}/form`);
  };

  const handleChatClick = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    handleNavigation(`/chat/${vendorId}`);
  };

  const isFavorite = vendorId ? favorites.includes(vendorId) : false;

  const tabs = [
    { id: "layanan", label: "Layanan" },
    { id: "hasil-pekerjaan", label: "Hasil Pekerjaan" },
    { id: "ulasan", label: "Ulasan" },
  ];

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Vendor Tidak Ditemukan</h1>
          <p className="text-muted-foreground mb-4">Vendor yang Anda cari tidak tersedia</p>
          <Button onClick={() => handleNavigation("/jasa")}>Kembali ke Daftar Jasa</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.main
        className="min-h-screen w-full max-w-7xl mx-auto px-4 py-6 pb-24 lg:pb-6"
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
                    <Link href="/" onClick={(e) => { e.preventDefault(); handleNavigation("/"); }}>
                      Home
                    </Link>
                  </motion.span>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <motion.span whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                    <Link href="/jasa" onClick={(e) => { e.preventDefault(); handleNavigation("/jasa"); }}>
                      Jasa
                    </Link>
                  </motion.span>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{vendor.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header Section */}
        <Card className="mb-6">
          <CardHeader className="p-4 md:p-6">
            <div className="flex gap-3 md:gap-6">
              <Avatar className="h-16 w-16 md:h-32 md:w-32 flex-shrink-0">
                <AvatarImage src={vendor.avatar ?? ""} alt={vendor.name} />
                <AvatarFallback className="text-lg md:text-3xl">
                  {vendor.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h1 className="text-lg md:text-3xl font-bold">{vendor.name}</h1>
                      {vendor.verified && (
                        <span className="inline-flex items-center gap-1 text-xs md:text-sm font-medium text-primary flex-shrink-0">
                          <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" />
                          Verified
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-3 md:mb-4 flex-wrap">
                      <RatingStars value={vendor.rating} />
                      <span className="font-semibold text-sm md:text-base">{vendor.rating.toFixed(1)}</span>
                      <span className="text-muted-foreground text-xs md:text-sm">({vendor.reviewCount} ulasan)</span>
                    </div>

                    <p className="text-muted-foreground leading-relaxed text-sm md:text-base">{vendor.summary}</p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={isFavorite ? "Hapus dari favorit" : "Simpan ke favorit"}
                    className={`flex-shrink-0 ${isFavorite ? 'text-red-500' : ''}`}
                    onClick={handleFavoriteClick}
                  >
                    <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 sticky top-0 bg-white z-10">
              <nav className="flex space-x-8" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => scrollToSection(tab.id)}
                    className={`
                      py-4 px-1 border-b-2 font-medium text-sm transition-colors
                      ${activeTab === tab.id
                        ? "border-pink-500 text-pink-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }
                    `}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Layanan */}
            <div id="layanan">
              <Card>
                <CardHeader>
                  <CardTitle>Layanan yang tersedia</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {vendor.tags.map((tag: string, i: number) => (
                      <Badge key={i} variant="outline" className="px-3 py-1">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Jangkauan Layanan */}
            <Card>
              <CardHeader>
                <CardTitle>Jangkauan layanan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {vendor.serviceAreas.map((area: string, i: number) => (
                    <Badge key={i} variant="outline" className="px-3 py-1">
                      {area}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Hasil Pekerjaan */}
            <div id="hasil-pekerjaan">
              {vendor.gallery && vendor.gallery.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Hasil Pekerjaan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {vendor.gallery.map((img: GalleryImage, i: number) => (
                        <motion.div
                          key={i}
                          className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.2 }}
                        >
                          <img
                            src={img.src}
                            alt={img.alt}
                            className="w-full h-full object-cover"
                          />
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Hasil Pekerjaan</CardTitle>
                  </CardHeader>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">Belum ada hasil pekerjaan yang ditampilkan</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Ulasan */}
            <div id="ulasan">
              <Card>
                <CardHeader>
                  <CardTitle>Ulasan</CardTitle>
                  <div className="flex items-center gap-2 mt-4">
                    <RatingStars value={vendor.rating} size="lg" />
                    <span className="text-xl font-bold">{vendor.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">
                      ({vendor.reviewCount} ulasan)
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Sample Review 1 */}
                    <div className="pb-6 border-b last:border-b-0">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12 bg-gray-200">
                          <AvatarFallback className="text-gray-600">A</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="mb-3">
                            <h4 className="font-semibold text-base mb-2">Anonymous</h4>
                            <div className="flex items-center gap-2 mb-3">
                              <RatingStars value={5} size="sm" />
                              <span className="text-xs text-muted-foreground">24 Jul 2025</span>
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed">Sangat baik 👍</p>
                        </div>
                      </div>
                    </div>

                    {/* Sample Review 2 */}
                    <div className="pb-6 border-b last:border-b-0">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12 bg-gray-200">
                          <AvatarFallback className="text-gray-600">A</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="mb-3">
                            <h4 className="font-semibold text-base mb-2">Anonymous</h4>
                            <div className="flex items-center gap-2 mb-3">
                              <RatingStars value={5} size="sm" />
                              <span className="text-xs text-muted-foreground">15 Jun 2024</span>
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed">Pekerjaan bersih</p>
                        </div>
                      </div>
                    </div>

                    {/* Sample Review 3 */}
                    <div className="pb-6 border-b last:border-b-0">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12 bg-gray-200">
                          <AvatarFallback className="text-gray-600">I</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="mb-3">
                            <h4 className="font-semibold text-base mb-2">Isabella</h4>
                            <div className="flex items-center gap-2 mb-3">
                              <RatingStars value={5} size="sm" />
                              <span className="text-xs text-muted-foreground">05 Jun 2024</span>
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed">Puas</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column - Action Sidebar (Desktop) */}
          <div className="hidden lg:block lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Dapatkan Penawaran</CardTitle>
                <p className="text-sm text-muted-foreground text-justify">
                  Ingin mendapatkan informasi lebih lanjut atau perkiraan harga? Pilih yang Anda inginkan di bawah ini untuk memulai pesan atau chat.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  size="lg"
                  className="w-full bg-[#7CE0A8] text-white hover:bg-[#5CA68A] shadow-lg rounded-lg transition duration-300"
                  onClick={handlePesanSekarang}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Pesan Sekarang
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Atau
                    </span>
                  </div>
                </div>

                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 rounded-lg transition duration-300"
                  onClick={handleChatClick}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Chat dengan Vendor
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-10">
          <SiteFooter />
        </div>

        {/* Floating Action Buttons (Mobile & Tablet) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50">
          <div className="max-w-7xl mx-auto flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 rounded-lg transition duration-300"
              onClick={handleChatClick}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Chat
            </Button>
            <Button
              className="flex-1 bg-[#7CE0A8] text-white hover:bg-[#5CA68A] shadow-lg rounded-lg transition duration-300"
              onClick={handlePesanSekarang}
            >
              <Send className="mr-2 h-4 w-4" />
              Pesan Sekarang
            </Button>
          </div>
        </div>
      </motion.main>

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Login Diperlukan
            </DialogTitle>
            <DialogDescription>
              Anda perlu login untuk mengakses fitur ini. Silakan masuk ke akun Anda terlebih dahulu.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <LoginForm userType="user" onSuccess={handleLoginSuccess} />
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <Button
                variant="link"
                className="p-0 h-auto text-[#7CE0A8] hover:text-[#6bcb96]"
                onClick={() => {
                  setShowLoginModal(false);
                  router.push('/register');
                }}
              >
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {leaving && (
          <motion.div
            key="route-leave"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.5 }}
            className="fixed inset-0 z-[9999] bg-white dark:bg-neutral-950 flex items-center justify-center"
          >
            <LoaderTwo />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function RatingStars({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const total = 5;

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-4 w-4",
    lg: "h-6 w-6"
  };

  return (
    <div className="flex items-center">
      {Array.from({ length: total }).map((_, i: number) => {
        const filled = i < full || (i === full && half);
        return (
          <Star
            key={i}
            className={`${sizeClasses[size]} ${filled ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`}
            aria-hidden="true"
          />
        );
      })}
      <span className="sr-only">{value} dari 5</span>
    </div>
  );
}