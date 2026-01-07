// app/jasa/page.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/app/components/ui/breadcrumb";
import VendorCard from "@/app/components/ui/vendor-card";
import SiteFooter from "@/app/footer";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderTwo } from "@/app/components/transition/loader";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/app/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { LoginForm } from "@/app/components/ui/login-form";
import { Search, Filter, MapPin, Star, AlertCircle } from "lucide-react";
import { useAuth } from "@/app/components/contexts/AuthContext";

const FilterBar = dynamic(() => import("@/app/components/ui/FilterBar"), { ssr: false });

const ITEMS_PER_PAGE = 10;

const EmptyState = ({
  onResetFilters,
  selectedCategory,
  selectedCity,
  selectedRating
}: {
  onResetFilters: () => void;
  selectedCategory: string;
  selectedCity: string;
  selectedRating: string;
}) => {
  const getCategoryDisplayName = (category: string) => {
    const names: Record<string, string> = {
      "ac": "Tukang AC",
      "listrik": "Tukang Listrik",
      "pembersihanrumah": "Tukang Pembersihan Rumah",
      "ledeng": "Tukang Ledeng",
      "sedotwc": "Tukang Sedot WC",
      "kebun": "Tukang Kebun",
      "furnitur": "Tukang Mebel"
    };
    return names[category] || category;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="relative mb-8">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#7CE0A8]/10 to-[#7CE0A8]/5 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#7CE0A8]/20 to-[#7CE0A8]/10 flex items-center justify-center">
            <Search className="w-12 h-12 text-[#7CE0A8]" />
          </div>
        </div>

        <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-white dark:bg-neutral-800 border-2 border-[#7CE0A8]/20 flex items-center justify-center shadow-lg">
          <Filter className="w-5 h-5 text-[#7CE0A8]" />
        </div>
        <div className="absolute -bottom-2 -left-2 w-10 h-10 rounded-full bg-white dark:bg-neutral-800 border-2 border-[#7CE0A8]/20 flex items-center justify-center shadow-lg">
          <MapPin className="w-4 h-4 text-[#7CE0A8]" />
        </div>
      </div>

      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
        Tidak Ada Jasa Ditemukan
      </h2>

      <p className="text-muted-foreground text-lg mb-6 max-w-md">
        Maaf, kami tidak menemukan jasa yang sesuai dengan kriteria pencarian Anda.
      </p>

      {(selectedCategory || selectedCity || (selectedRating && selectedRating !== "semuarating")) && (
        <div className="mb-8 p-4 bg-gradient-to-r from-[#7CE0A8]/5 to-transparent rounded-xl border border-[#7CE0A8]/10">
          <p className="text-sm text-foreground/70 mb-2">Filter yang aktif:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {selectedCategory && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#7CE0A8]/10 text-[#7CE0A8] text-sm font-medium">
                <Filter className="w-3.5 h-3.5" />
                {getCategoryDisplayName(selectedCategory)}
              </span>
            )}
            {selectedCity && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#7CE0A8]/10 text-[#7CE0A8] text-sm font-medium">
                <MapPin className="w-3.5 h-3.5" />
                {selectedCity}
              </span>
            )}
            {selectedRating && selectedRating !== "semuarating" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#7CE0A8]/10 text-[#7CE0A8] text-sm font-medium">
                <Star className="w-3.5 h-3.5" />
                {selectedRating === "5" ? "5 Bintang" :
                  selectedRating === "4+" ? "4.0+ Rating" :
                    selectedRating === "3+" ? "3.0+ Rating" :
                      selectedRating === "2+" ? "2.0+ Rating" :
                        selectedRating === "1+" ? "1.0+ Rating" : selectedRating}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onResetFilters}
          className="px-8 py-3 bg-gradient-to-r from-[#7CE0A8] to-[#5CA68A] text-white font-medium rounded-xl hover:from-[#6BCF97] hover:to-[#4A8D74] transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          <Filter className="w-5 h-5" />
          Tampilkan Semua Jasa
        </button>
      </div>
    </motion.div>
  );
};

export default function JasaPage() {
  const prefersReduced = useReducedMotion();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  const [leaving, setLeaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedRating, setSelectedRating] = useState<string>("");

  // Load vendors dari API
  useEffect(() => {
    const loadVendors = async () => {
      try {
        setIsLoading(true);

        // Build query params
        const params = new URLSearchParams();
        if (selectedCategory) params.set('kategori', selectedCategory);
        if (selectedCity) params.set('kota', selectedCity);
        if (selectedRating && selectedRating !== 'semuarating') {
          params.set('rating', selectedRating);
        }

        const queryString = params.toString();
        const url = `/api/vendors${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setVendors(data.vendors || []);
        } else {
          console.error('Error loading vendors:', await response.text());
          setVendors([]);
        }
      } catch (error) {
        console.error('Error loading vendors:', error);
        setVendors([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadVendors();
  }, [selectedCategory, selectedCity, selectedRating]);

  // Set category from URL params
  useEffect(() => {
    const kategori = searchParams?.get('kategori');
    if (kategori) {
      setSelectedCategory(kategori);
    }
  }, [searchParams]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedCity, selectedRating]);

  const totalPages = Math.max(1, Math.ceil(vendors.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentVendors = vendors.slice(startIndex, endIndex);

  const handleHomeClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setLeaving(true);
    await new Promise((r) => setTimeout(r, prefersReduced ? 0 : 300));
    router.push("/");
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResetFilters = () => {
    setSelectedCategory("");
    setSelectedCity("");
    setSelectedRating("");
    setCurrentPage(1);
    router.push('/jasa', { scroll: false });
  };

  const handleLoginSuccess = async (email: string) => {
    setIsTransitioning(true);

    if (typeof window !== 'undefined') {
      localStorage.setItem('pendingLoginEmail', email);
    }

    await new Promise((r) => setTimeout(r, prefersReduced ? 0 : 500));
    router.push(`/login/otp?email=${encodeURIComponent(email)}`);
  };

  const handleRegisterClick = async () => {
    setShowLoginModal(false);
    setIsTransitioning(true);
    await new Promise((r) => setTimeout(r, prefersReduced ? 0 : 500));
    router.push('/register');
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={currentPage === 1}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 3) {
        items.push(<PaginationEllipsis key="ellipsis-start" />);
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 2) {
        items.push(<PaginationEllipsis key="ellipsis-end" />);
      }

      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              onClick={() => handlePageChange(totalPages)}
              isActive={currentPage === totalPages}
              className="cursor-pointer"
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  return (
    <>
      <motion.main
        className="min-h-[60vh] w-full max-w-7xl mx-auto px-4 py-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReduced ? 0 : 0.25, ease: "easeOut" }}
      >
        <div className="mb-4">
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
                <BreadcrumbPage>Jasa</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <LoaderTwo />
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReduced ? 0 : 0.25 }}
            >
              <FilterBar
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedCity={selectedCity}
                onCityChange={setSelectedCity}
                selectedRating={selectedRating}
                onRatingChange={setSelectedRating}
                onResetFilters={handleResetFilters}
              />
            </motion.div>

            {vendors.length === 0 ? (
              <EmptyState
                onResetFilters={handleResetFilters}
                selectedCategory={selectedCategory}
                selectedCity={selectedCity}
                selectedRating={selectedRating}
              />
            ) : (
              <>
                <motion.section
                  key={`${selectedCategory}-${selectedCity}-${selectedRating}-${currentPage}`}
                  className="mt-6 space-y-4"
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: { staggerChildren: 0.06, delayChildren: 0.05 },
                    },
                  }}
                >
                  {currentVendors.map((v) => (
                    <motion.div
                      key={v.id}
                      variants={{
                        hidden: { opacity: 0, y: 12 },
                        show: { opacity: 1, y: 0 },
                      }}
                      transition={{ duration: prefersReduced ? 0 : 0.25, ease: "easeOut" }}
                    >
                      <VendorCard
                        vendor={v}
                        isLoggedIn={isAuthenticated}
                        onLoginRequired={() => setShowLoginModal(true)}
                        userId={user?.id}
                      />
                    </motion.div>
                  ))}
                </motion.section>

                {totalPages > 1 && (
                  <motion.div
                    className="mt-8 mb-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Pagination>
                      <PaginationContent>
                        <PaginationPrevious
                          onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                        {renderPaginationItems()}
                        <PaginationNext
                          onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationContent>
                    </Pagination>
                  </motion.div>
                )}
              </>
            )}

            <div className="mt-10">
              <SiteFooter />
            </div>
          </>
        )}
      </motion.main>

      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-[440px] md:max-w-[480px] p-0 overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 dark:from-neutral-900 dark:to-neutral-950 max-h-[90vh] overflow-y-auto">
          {/* Decorative gradient background */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#7CE0A8]/10 to-transparent rounded-full -z-0 blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-tr from-[#7CE0A8]/10 to-transparent rounded-full -z-0 blur-3xl"></div>

          <DialogHeader className="relative z-10 p-4 sm:p-5 md:p-6 pb-3 sm:pb-4">
            <div className="flex items-start gap-2.5 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#7CE0A8]/20 to-[#7CE0A8]/10 flex-shrink-0">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[#7CE0A8]" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-700 dark:from-white dark:via-neutral-100 dark:to-neutral-300 bg-clip-text text-transparent">
                  Login Diperlukan
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-0.5 sm:mt-1">
                  Silakan masuk untuk mengakses fitur ini
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="relative z-10 px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6">
            <LoginForm
              userType="user"
              onSuccess={handleLoginSuccess}
              onRegisterClick={handleRegisterClick}
            />
          </div>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {(leaving || isTransitioning) && (
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