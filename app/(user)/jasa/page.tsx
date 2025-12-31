// app/jasa/page.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/app/components/ui/breadcrumb";
import VendorCard from "@/app/components/ui/vendor-card";
import { getAllVendors } from "@/app/data/dataVendor";
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
import { Button } from "@/app/components/ui/button";
import { Search, Filter, MapPin, Star, AlertCircle } from "lucide-react";

const FilterBar = dynamic(() => import("@/app/components/ui/FilterBar"), { ssr: false });

const ITEMS_PER_PAGE = 10;

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  ac: ["tukang ac"],
  listrik: ["tukang listrik"],
  pembersihanrumah: ["tukang pembersihan rumah"],
  ledeng: ["tukang ledeng"],
  sedotwc: ["tukang sedot wc"],
  kebun: ["tukang kebun"],
  furnitur: ["tukang mebel"]
};

const isVendorInCategory = (vendor: any, category: string): boolean => {
  if (!category) return true;

  const keywords = CATEGORY_KEYWORDS[category] || [];
  if (keywords.length === 0) return true;

  const vendorTags = vendor.tags.map((tag: string) => tag.toLowerCase());
  const vendorSummary = vendor.summary.toLowerCase();

  return keywords.some(keyword => {
    const lowerKeyword = keyword.toLowerCase();
    const matchesInTags = vendorTags.some((tag: string) =>
      tag.includes(lowerKeyword) || lowerKeyword.includes(tag)
    );
    const matchesInSummary = vendorSummary.includes(lowerKeyword);

    return matchesInTags || matchesInSummary;
  });
};

const isVendorInCity = (vendor: any, city: string): boolean => {
  if (!city) return true;

  const lowerCity = city.toLowerCase();
  return vendor.serviceAreas?.some((area: string) =>
    area.toLowerCase().includes(lowerCity)
  ) || false;
};

const isVendorWithRating = (vendor: any, ratingFilter: string): boolean => {
  if (!ratingFilter || ratingFilter === "semuarating") return true;

  const vendorRating = vendor.rating;

  switch (ratingFilter) {
    case "5":
      return vendorRating >= 4.8;
    case "4+":
      return vendorRating >= 4.0 && vendorRating < 4.8;
    case "3+":
      return vendorRating >= 3.0 && vendorRating < 4.0;
    case "2+":
      return vendorRating >= 2.0 && vendorRating < 3.0;
    case "1+":
      return vendorRating >= 1.0 && vendorRating < 2.0;
    default:
      return true;
  }
};

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

      <div className="mb-8 max-w-md">
        <h3 className="text-lg font-semibold text-foreground mb-3">Coba salah satu dari ini:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
          <div className="p-3 rounded-lg bg-background border border-border hover:border-[#7CE0A8]/30 transition-colors">
            <p className="text-sm text-foreground/80">• Periksa ejaan kata kunci</p>
          </div>
          <div className="p-3 rounded-lg bg-background border border-border hover:border-[#7CE0A8]/30 transition-colors">
            <p className="text-sm text-foreground/80">• Kurangi jumlah filter</p>
          </div>
          <div className="p-3 rounded-lg bg-background border border-border hover:border-[#7CE0A8]/30 transition-colors">
            <p className="text-sm text-foreground/80">• Coba kategori yang berbeda</p>
          </div>
          <div className="p-3 rounded-lg bg-background border border-border hover:border-[#7CE0A8]/30 transition-colors">
            <p className="text-sm text-foreground/80">• Perluas area pencarian</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onResetFilters}
          className="px-8 py-3 bg-gradient-to-r from-[#7CE0A8] to-[#5CA68A] text-white font-medium rounded-xl hover:from-[#6BCF97] hover:to-[#4A8D74] transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          <Filter className="w-5 h-5" />
          Tampilkan Semua Jasa
        </button>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="px-8 py-3 bg-white dark:bg-neutral-800 border-2 border-[#7CE0A8] text-[#7CE0A8] font-medium rounded-xl hover:bg-[#7CE0A8]/5 transition-all duration-300"
        >
          Coba Filter Lainnya
        </button>
      </div>
    </motion.div>
  );
};

export default function JasaPage() {
  const prefersReduced = useReducedMotion();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [leaving, setLeaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedRating, setSelectedRating] = useState<string>("");

  // Load vendors dengan sync dari localStorage
  useEffect(() => {
    const loadVendors = () => {
      const allVendors = getAllVendors();
      setVendors(allVendors);
    };

    loadVendors();

    // Listen untuk vendor data updates
    const handleVendorUpdate = () => {
      loadVendors();
    };

    window.addEventListener('vendorDataUpdated', handleVendorUpdate);

    return () => {
      window.removeEventListener('vendorDataUpdated', handleVendorUpdate);
    };
  }, []);

  useEffect(() => {
    const kategori = searchParams?.get('kategori');
    
    if (kategori) {
      setSelectedCategory(kategori);
    }

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('userToken');
      setIsLoggedIn(!!token);
    }
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchParams]);

  const filteredVendors = useMemo(() => {
    let filtered = [...vendors];

    if (selectedCategory) {
      filtered = filtered.filter(vendor =>
        isVendorInCategory(vendor, selectedCategory)
      );
    }

    if (selectedCity) {
      filtered = filtered.filter(vendor =>
        isVendorInCity(vendor, selectedCity)
      );
    }

    if (selectedRating && selectedRating !== "semuarating") {
      filtered = filtered.filter(vendor =>
        isVendorWithRating(vendor, selectedRating)
      );
    }

    return filtered;
  }, [vendors, selectedCategory, selectedCity, selectedRating]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedCity, selectedRating]);

  const totalPages = Math.max(1, Math.ceil(filteredVendors.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentVendors = filteredVendors.slice(startIndex, endIndex);

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
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setShowLoginModal(false);
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

            {(selectedCategory || selectedCity || (selectedRating && selectedRating !== "semuarating")) && (
              <div className="mb-4 mt-2 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-muted-foreground">
                  Menampilkan <span className="font-semibold text-foreground">{filteredVendors.length}</span> dari{" "}
                  <span className="font-semibold text-foreground">{vendors.length}</span> jasa
                  {selectedCategory && (
                    <span className="ml-2">
                      • Kategori: <span className="font-semibold text-foreground">
                        {getCategoryDisplayName(selectedCategory)}
                      </span>
                    </span>
                  )}
                  {selectedCity && (
                    <span className="ml-2">
                      • Kota: <span className="font-semibold text-foreground">{selectedCity}</span>
                    </span>
                  )}
                  {selectedRating && selectedRating !== "semuarating" && (
                    <span className="ml-2">
                      • Rating: <span className="font-semibold text-foreground">
                        {selectedRating === "5" ? "5 Bintang" :
                          selectedRating === "4+" ? "4.0 ke atas" :
                            selectedRating === "3+" ? "3.0 ke atas" :
                              selectedRating === "2+" ? "2.0 ke atas" :
                                selectedRating === "1+" ? "1.0 ke atas" : selectedRating}
                      </span>
                    </span>
                  )}
                </div>

                <button
                  onClick={handleResetFilters}
                  className="text-sm text-primary hover:underline px-2 py-1 rounded hover:bg-primary/10"
                >
                  Reset semua filter
                </button>
              </div>
            )}

            {filteredVendors.length === 0 ? (
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
                        isLoggedIn={isLoggedIn}
                        onLoginRequired={() => setShowLoginModal(true)}
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