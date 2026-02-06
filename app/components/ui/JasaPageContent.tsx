// app/jasa/JasaPageContent.tsx - CLIENT COMPONENT WITH ALL LOGIC
"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/app/components/ui/breadcrumb";
import VendorCard from "@/app/components/ui/vendor-card";
import SiteFooter from "@/app/(footer)/footer";
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
import { Search, Filter, MapPin, Star } from "lucide-react";
import { useAuth } from "@/app/components/contexts/AuthContext";
import { PopupLoginModal } from "@/app/components/ui/popup-login-modal";

const FilterBar = dynamic(() => import("@/app/components/ui/FilterBar"), { ssr: false });

interface Category {
  category_id: string;
  slug: string;
  name: string;
}

// ✅ Network detection helpers
const getNetworkSpeed = (): 'slow' | 'medium' | 'fast' => {
  if (typeof window === 'undefined') return 'medium';
  
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  if (!connection) return 'medium';
  
  const effectiveType = connection.effectiveType;
  
  if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'slow';
  if (effectiveType === '3g') return 'medium';
  return 'fast';
};

const getAdaptiveDebounceTime = (): number => {
  const speed = getNetworkSpeed();
  
  switch (speed) {
    case 'slow':
      return 400;
    case 'medium':
      return 250;
    case 'fast':
      return 150;
    default:
      return 200;
  }
};

const getMinLoadingDuration = (): number => {
  const speed = getNetworkSpeed();
  
  switch (speed) {
    case 'slow':
      return 200;
    case 'medium':
      return 150;
    case 'fast':
      return 100;
    default:
      return 150;
  }
};

// ✅ Skeleton Loading Component
const VendorCardSkeleton = () => (
  <div className="rounded-xl border border-border bg-card p-4 animate-pulse">
    <div className="flex flex-col md:flex-row gap-4">
      {/* Image skeleton */}
      <div className="w-full md:w-48 h-48 bg-muted rounded-lg" />
      
      {/* Content skeleton */}
      <div className="flex-1 space-y-3">
        <div className="h-6 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-4 bg-muted rounded w-2/3" />
        <div className="flex gap-2 mt-3">
          <div className="h-6 w-20 bg-muted rounded-full" />
          <div className="h-6 w-20 bg-muted rounded-full" />
        </div>
      </div>
    </div>
  </div>
);

const EmptyState = ({
  onResetFilters,
  selectedCategory,
  selectedCity,
  selectedRating,
  searchQuery,
  categoryMap
}: {
  onResetFilters: () => void;
  selectedCategory: string;
  selectedCity: string;
  selectedRating: string;
  searchQuery: string;
  categoryMap: Record<string, string>;
}) => {
  const getCategoryDisplayName = (category: string) => {
    return categoryMap[category] || category;
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

      {(selectedCategory || selectedCity || (selectedRating && selectedRating !== "semuarating") || searchQuery) && (
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
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#7CE0A8]/10 text-[#7CE0A8] text-sm font-medium">
                <Search className="w-3.5 h-3.5" />
                &quot;{searchQuery}&quot;
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

export default function JasaPageContent() {
  const prefersReduced = useReducedMotion();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  const [leaving, setLeaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedRating, setSelectedRating] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [displayLimit, setDisplayLimit] = useState<string>("10");
  
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  
  const [renderKey, setRenderKey] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const loadVendorsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigationStartTimeRef = useRef<number>(0);
  const requestIdRef = useRef<number>(0);
  const minLoadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch categories untuk mapping nama
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/master/categories');
        const data = await response.json();
        if (data.success && data.data) {
          const map: Record<string, string> = {};
          data.data.forEach((cat: Category) => {
            map[cat.slug] = cat.name;
          });
          setCategoryMap(map);
          console.log('[JasaPage] Category map loaded:', map);
        }
      } catch (error) {
        console.error('[JasaPage] Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Set filters from URL params on mount - HANYA SEKALI
  useEffect(() => {
    if (initialLoadDone) return;

    const kategori = searchParams?.get('kategori');
    const kota = searchParams?.get('kota');
    const rating = searchParams?.get('rating');
    const search = searchParams?.get('search');
    const limit = searchParams?.get('limit');
    
    console.log('[JasaPage] Initial URL params:', { kategori, kota, rating, search, limit });
    
    if (kategori) setSelectedCategory(kategori);
    if (kota) setSelectedCity(kota);
    if (rating) setSelectedRating(rating);
    if (search) setSearchQuery(search);
    if (limit) setDisplayLimit(limit);

    setInitialLoadDone(true);
  }, [searchParams, initialLoadDone]);

  // ✅ OPTIMIZED: Async vendor loading dengan smooth loading state
  useEffect(() => {
    if (!initialLoadDone) return;

    const loadVendors = async () => {
      // Generate unique request ID
      const currentRequestId = ++requestIdRef.current;
      
      // Cancel previous requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (loadVendorsTimeoutRef.current) {
        clearTimeout(loadVendorsTimeoutRef.current);
      }
      if (minLoadingTimeoutRef.current) {
        clearTimeout(minLoadingTimeoutRef.current);
      }

      abortControllerRef.current = new AbortController();

      try {
        // Show loading immediately
        setIsFilterLoading(true);
        
        const minLoadingDuration = getMinLoadingDuration();
        const loadingStartTime = performance.now();

        const params = new URLSearchParams();
        if (selectedCategory) params.set('kategori', selectedCategory);
        if (selectedCity) params.set('kota', selectedCity);
        if (selectedRating && selectedRating !== 'semuarating') {
          params.set('rating', selectedRating);
        }
        if (searchQuery) params.set('search', searchQuery);

        const queryString = params.toString();
        const url = `/api/vendors${queryString ? `?${queryString}` : ''}`;

        console.log(`[JasaPage] Request #${currentRequestId} - Loading vendors with URL:`, url);
        console.log(`[JasaPage] Network speed detected:`, getNetworkSpeed());

        const fetchStartTime = performance.now();

        const response = await fetch(url, {
          credentials: 'include',
          signal: abortControllerRef.current.signal,
        });

        // Check if this request is still the latest one
        if (currentRequestId !== requestIdRef.current) {
          console.log(`[JasaPage] Request #${currentRequestId} - Discarded (newer request exists)`);
          return;
        }

        if (response.ok) {
          const data = await response.json();
          const fetchDuration = performance.now() - fetchStartTime;
          
          console.log(`[JasaPage] Request #${currentRequestId} - Vendors loaded:`, data.vendors?.length || 0);
          console.log(`[JasaPage] Request #${currentRequestId} - Fetch duration: ${fetchDuration.toFixed(2)}ms`);
          
          // Calculate remaining time to meet minimum loading duration
          const elapsedTime = performance.now() - loadingStartTime;
          const remainingDelay = Math.max(0, minLoadingDuration - elapsedTime);
          
          if (remainingDelay > 0) {
            console.log(`[JasaPage] Request #${currentRequestId} - Adding ${remainingDelay.toFixed(2)}ms delay for smooth UX`);
            
            // Use timeout to ensure smooth transition
            await new Promise(resolve => {
              minLoadingTimeoutRef.current = setTimeout(resolve, remainingDelay);
            });
          }
          
          // Double-check request is still latest before updating state
          if (currentRequestId === requestIdRef.current) {
            setVendors(data.vendors || []);
            setRenderKey(prev => prev + 1);
            setIsFilterLoading(false);
            setIsLoading(false);
            console.log(`[JasaPage] Request #${currentRequestId} - State updated successfully`);
          } else {
            console.log(`[JasaPage] Request #${currentRequestId} - Discarded before state update`);
          }
        } else {
          console.error(`[JasaPage] Request #${currentRequestId} - Error:`, await response.text());
          if (currentRequestId === requestIdRef.current) {
            setVendors([]);
            setIsFilterLoading(false);
            setIsLoading(false);
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error(`[JasaPage] Request #${currentRequestId} - Error:`, error);
          if (currentRequestId === requestIdRef.current) {
            setVendors([]);
            setIsFilterLoading(false);
            setIsLoading(false);
          }
        } else {
          console.log(`[JasaPage] Request #${currentRequestId} - Aborted`);
        }
      }
    };

    // Use adaptive debounce time based on network speed
    const debounceTime = getAdaptiveDebounceTime();
    console.log(`[JasaPage] Scheduling vendor load with ${debounceTime}ms debounce`);

    loadVendorsTimeoutRef.current = setTimeout(() => {
      loadVendors();
    }, debounceTime);

    return () => {
      if (loadVendorsTimeoutRef.current) {
        clearTimeout(loadVendorsTimeoutRef.current);
      }
      if (minLoadingTimeoutRef.current) {
        clearTimeout(minLoadingTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedCategory, selectedCity, selectedRating, searchQuery, initialLoadDone]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedCity, selectedRating, searchQuery, displayLimit]);

  // Listen for favorite toggle event
  useEffect(() => {
    const handleFavoriteToggled = (event: CustomEvent) => {
      const { vendorId, isFavorite } = event.detail;
      
      setVendors(prevVendors => 
        prevVendors.map(vendor => 
          vendor.id === vendorId 
            ? { ...vendor, isFavorite } 
            : vendor
        )
      );
    };

    window.addEventListener('favoriteToggled', handleFavoriteToggled as EventListener);
    return () => window.removeEventListener('favoriteToggled', handleFavoriteToggled as EventListener);
  }, []);

  // Calculate items per page based on displayLimit
  const itemsPerPage = useMemo(() => {
    if (displayLimit === 'all') {
      return vendors.length || 1;
    }
    return parseInt(displayLimit) || 10;
  }, [displayLimit, vendors.length]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    if (displayLimit === 'all') {
      return 1;
    }
    return Math.max(1, Math.ceil(vendors.length / itemsPerPage));
  }, [vendors.length, itemsPerPage, displayLimit]);

  // Calculate current page vendors
  const { startIndex, endIndex, currentVendors } = useMemo(() => {
    if (displayLimit === 'all') {
      return { 
        startIndex: 0, 
        endIndex: vendors.length, 
        currentVendors: vendors 
      };
    }

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const current = vendors.slice(start, end);
    
    return { startIndex: start, endIndex: end, currentVendors: current };
  }, [currentPage, vendors, itemsPerPage, displayLimit]);

  // Auto-fix pagination if current page is out of bounds
  useEffect(() => {
    if (vendors.length > 0 && currentVendors.length === 0 && currentPage > 1) {
      console.log('[JasaPage] Current page out of bounds, resetting to page 1');
      setCurrentPage(1);
    }
  }, [vendors.length, currentVendors.length, currentPage]);

  // ✅ Async navigation handlers
  const handleHomeClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    navigationStartTimeRef.current = performance.now();
    setLeaving(true);
    
    const minDuration = prefersReduced ? 0 : getMinLoadingDuration();
    const navigationPromise = router.push("/");
    
    const elapsedTime = performance.now() - navigationStartTimeRef.current;
    const remainingTime = Math.max(0, minDuration - elapsedTime);
    
    if (remainingTime > 0) {
      await Promise.all([
        navigationPromise,
        new Promise(resolve => setTimeout(resolve, remainingTime))
      ]);
    } else {
      await navigationPromise;
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResetFilters = useCallback(async () => {
    console.log('[JasaPage] Resetting all filters...');
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (loadVendorsTimeoutRef.current) {
      clearTimeout(loadVendorsTimeoutRef.current);
    }
    if (minLoadingTimeoutRef.current) {
      clearTimeout(minLoadingTimeoutRef.current);
    }
    
    setIsFilterLoading(true);
    
    setSelectedCategory("");
    setSelectedCity("");
    setSelectedRating("");
    setSearchQuery("");
    setDisplayLimit("10");
    setCurrentPage(1);
    
    window.history.replaceState({}, '', '/jasa');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('[JasaPage] Filters reset complete');
  }, []);

  const handleLoginSuccess = async (email: string) => {
    setShowLoginModal(false);
    setIsTransitioning(true);
    
    const minDuration = getMinLoadingDuration();
    await new Promise(resolve => setTimeout(resolve, minDuration));
    
    window.location.reload(); 
  };

  const handleRegisterClick = async () => {
    setShowLoginModal(false);
    
    navigationStartTimeRef.current = performance.now();
    setIsTransitioning(true);
    
    const minDuration = prefersReduced ? 0 : getMinLoadingDuration();
    const navigationPromise = router.push('/register');
    
    const elapsedTime = performance.now() - navigationStartTimeRef.current;
    const remainingTime = Math.max(0, minDuration - elapsedTime);
    
    if (remainingTime > 0) {
      await Promise.all([
        navigationPromise,
        new Promise(resolve => setTimeout(resolve, remainingTime))
      ]);
    } else {
      await navigationPromise;
    }
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

  const vendorListKey = useMemo(() => {
    return `vendors-${selectedCategory}-${selectedCity}-${selectedRating}-${searchQuery}-${displayLimit}-${currentPage}-${renderKey}`;
  }, [selectedCategory, selectedCity, selectedRating, searchQuery, displayLimit, currentPage, renderKey]);

  const paginationInfo = useMemo(() => {
    if (vendors.length === 0) return "";
    
    if (displayLimit === 'all') {
      return `Menampilkan semua ${vendors.length} vendor`;
    }
    
    const start = startIndex + 1;
    const end = Math.min(endIndex, vendors.length);
    const limit = itemsPerPage;
    
    return `Menampilkan ${start}-${end} dari ${vendors.length} vendor (${limit} per halaman)`;
  }, [vendors.length, displayLimit, startIndex, endIndex, itemsPerPage]);

  // ✅ Calculate skeleton count based on display limit
  const skeletonCount = useMemo(() => {
    if (displayLimit === 'all') return 5;
    const limit = parseInt(displayLimit) || 10;
    return Math.min(limit, 10); // Max 10 skeletons untuk UX yang baik
  }, [displayLimit]);

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
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                displayLimit={displayLimit}
                onDisplayLimitChange={setDisplayLimit}
                onResetFilters={handleResetFilters}
              />
            </motion.div>

            {/* ✅ Loading State with Skeletons */}
            {isFilterLoading ? (
              <motion.section
                className="mt-6 space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {[...Array(skeletonCount)].map((_, index) => (
                  <VendorCardSkeleton key={`skeleton-${index}`} />
                ))}
              </motion.section>
            ) : (
              <motion.div
                key={vendorListKey}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {vendors.length === 0 ? (
                  <EmptyState
                    onResetFilters={handleResetFilters}
                    selectedCategory={selectedCategory}
                    selectedCity={selectedCity}
                    selectedRating={selectedRating}
                    searchQuery={searchQuery}
                    categoryMap={categoryMap}
                  />
                ) : (
                  <>
                    <motion.section
                      key={vendorListKey}
                      className="mt-6 space-y-4"
                      initial="hidden"
                      animate="show"
                      variants={{
                        hidden: { opacity: 0 },
                        show: {
                          opacity: 1,
                          transition: { staggerChildren: 0.05, delayChildren: 0.05 },
                        },
                      }}
                    >
                      {currentVendors.map((v, index) => (
                        <motion.div
                          key={`${v.vendor_id || v.id}-${index}-${renderKey}`}
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
                          />
                        </motion.div>
                      ))}
                    </motion.section>

                    {displayLimit !== 'all' && totalPages > 1 && (
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

                    {vendors.length > 0 && (
                      <div className="mt-4 text-center text-sm text-muted-foreground">
                        {paginationInfo}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            <div className="mt-10">
              <SiteFooter />
            </div>
          </>
        )}
      </motion.main>

      <PopupLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
        onRegisterClick={handleRegisterClick}
        title="Akses Semua Fitur"
        description="Login untuk menghubungi vendor favorit Anda"
      />

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