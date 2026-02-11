// app/components/ui/FilterBar.tsx 
"use client";

import { useMemo, useState, useCallback, memo, useEffect, useRef } from "react";
import { SlidersHorizontal, X, RotateCcw, Loader2 } from "lucide-react";

import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/app/components/ui/select";
import { Button } from "@/app/components/ui/button";
import CitySelect from "@/app/components/ui/city-select";
import {
    Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger, SheetClose,
} from "@/app/components/ui/sheet";

import { PlaceholdersAndVanishInput } from "@/app/components/ui/placeholders-and-vanish-input";

interface City {
  city_id: string;
  name: string;
  province: string;
}

interface Category {
  category_id: string;
  slug: string;
  name: string;
  icon?: string;
}

const RATING_LABELS: Record<string, string> = {
    "5": "⭐ 5",
    "4+": "⭐ 4.0+",
    "3+": "⭐ 3.0+",
    "2+": "⭐ 2.0+",
    "1+": "⭐ 1.0+",
    "semuarating": "Semua Rating",
};

const DISPLAY_LIMITS = [
    { value: "5", label: "Tampilkan: 5" },
    { value: "10", label: "Tampilkan: 10" },
    { value: "20", label: "Tampilkan: 20" },
    { value: "50", label: "Tampilkan: 50" },
    { value: "100", label: "Tampilkan: 100" },
    { value: "all", label: "Tampilkan: Semua" },
];

interface FilterBarProps {
    selectedCategory: string;
    onCategoryChange: (value: string) => void;
    selectedCity: string;
    onCityChange: (value: string) => void;
    selectedRating: string;
    onRatingChange: (value: string) => void;
    searchQuery: string;
    onSearchChange: (value: string) => void;
    displayLimit: string;
    onDisplayLimitChange: (value: string) => void;
    onResetFilters: () => void;
}

const Chip = memo(({
    label,
    onRemove
}: {
    label: string;
    onRemove: () => void
}) => (
    <span className="inline-flex items-center gap-2 rounded-full bg-[#7CE0A8]/10 px-3 py-1.5
        text-[#7CE0A8] text-sm font-medium ring-1 ring-[#7CE0A8]/20 hover:bg-[#7CE0A8]/15 transition-colors">
        {label}
        <button
            type="button"
            aria-label={`Hapus ${label}`}
            onClick={onRemove}
            className="grid place-items-center rounded-full p-0.5 hover:bg-[#7CE0A8]/20 focus-visible:outline-none"
        >
            <X className="h-3.5 w-3.5" />
        </button>
    </span>
));

Chip.displayName = "Chip";

const PLACEHOLDERS = [
    "Cari nama vendor atau layanan...",
    "Contoh: Tukang AC Profesional",
    "Contoh: Service AC 24 Jam",
    "Contoh: Perbaikan Listrik",
    "Cari berdasarkan jangkauan layanan...",
];

// ✅ Loading Indicator Component
const LoadingIndicator = memo(() => (
    <div className="flex items-center justify-center gap-2 py-2 text-[#7CE0A8]">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm font-medium">Memuat data...</span>
    </div>
));

LoadingIndicator.displayName = "LoadingIndicator";

export default function FilterBar({
    selectedCategory,
    onCategoryChange,
    selectedCity,
    onCityChange,
    selectedRating,
    onRatingChange,
    searchQuery,
    onSearchChange,
    displayLimit,
    onDisplayLimitChange,
    onResetFilters,
}: FilterBarProps) {
    const [isSmallMobile, setIsSmallMobile] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
    const [isProcessing, setIsProcessing] = useState(false);

    // Master data state
    const [cities, setCities] = useState<City[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [dataReady, setDataReady] = useState(false);

    // Refs untuk debounce
    const categoryDebounceRef = useRef<NodeJS.Timeout | null>(null);
    const cityDebounceRef = useRef<NodeJS.Timeout | null>(null);
    const ratingDebounceRef = useRef<NodeJS.Timeout | null>(null);
    const limitDebounceRef = useRef<NodeJS.Timeout | null>(null);
    const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch master data
    useEffect(() => {
        const abortController = new AbortController();
        
        Promise.all([
            fetch('/api/master/cities', { signal: abortController.signal }).then(r => r.json()),
            fetch('/api/master/categories', { signal: abortController.signal }).then(r => r.json())
        ])
        .then(([citiesData, categoriesData]) => {
            if (!abortController.signal.aborted) {
                if (citiesData.success) setCities(citiesData.data);
                if (categoriesData.success) {
                    setCategories(categoriesData.data);
                    console.log('[FilterBar] Categories loaded:', categoriesData.data.map((c: Category) => ({ slug: c.slug, name: c.name })));
                }
                setDataReady(true);
            }
        })
        .catch(error => {
            if (error.name !== 'AbortError') {
                console.error('Error fetching master data:', error);
                setDataReady(true);
            }
        });
        
        return () => abortController.abort();
    }, []);

    // Sync local search with prop
    useEffect(() => {
        setLocalSearchQuery(searchQuery);
    }, [searchQuery]);

    // Deteksi ukuran layar
    useEffect(() => {
        const checkMobile = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            setIsSmallMobile(width <= 375 && height <= 667);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Category map - slug to name
    const categoryMap = useMemo(() => {
        return categories.reduce((acc, cat) => {
            acc[cat.slug] = cat.name;
            return acc;
        }, {} as Record<string, string>);
    }, [categories]);

    const getCategoryLabel = useCallback((slug: string) => {
        return categoryMap[slug] || slug;
    }, [categoryMap]);

    // Update URL without reload
    const updateURL = useCallback((category: string, city: string, rating: string, search: string, limit: string) => {
        const params = new URLSearchParams();

        if (category) params.set('kategori', category);
        if (city) params.set('kota', city);
        if (rating && rating !== 'semuarating') params.set('rating', rating);
        if (search) params.set('search', search);
        if (limit && limit !== '10') params.set('limit', limit);

        const queryString = params.toString();
        const newURL = queryString ? `/jasa?${queryString}` : '/jasa';

        window.history.replaceState({}, '', newURL);
    }, []);

    // ✅ Show processing indicator
    const showProcessingIndicator = useCallback(() => {
        setIsProcessing(true);
        
        // Clear previous timeout
        if (processingTimeoutRef.current) {
            clearTimeout(processingTimeoutRef.current);
        }
        
        // Auto hide after 5 seconds (safety timeout)
        processingTimeoutRef.current = setTimeout(() => {
            setIsProcessing(false);
        }, 5000);
    }, []);

    // ✅ Hide processing indicator
    const hideProcessingIndicator = useCallback(() => {
        if (processingTimeoutRef.current) {
            clearTimeout(processingTimeoutRef.current);
        }
        setIsProcessing(false);
    }, []);

    // ✅ OPTIMIZED: Async handlers with loading feedback
    const handleCategoryChange = useCallback((value: string) => {
        console.log('[FilterBar] Category change initiated:', value);
        
        showProcessingIndicator();
        
        if (categoryDebounceRef.current) {
            clearTimeout(categoryDebounceRef.current);
        }

        categoryDebounceRef.current = setTimeout(() => {
            console.log('[FilterBar] Category applied:', value);
            onCategoryChange(value);
            updateURL(value, selectedCity, selectedRating, searchQuery, displayLimit);
            
            setTimeout(hideProcessingIndicator, 300);
        }, 100);
    }, [onCategoryChange, selectedCity, selectedRating, searchQuery, displayLimit, updateURL, showProcessingIndicator, hideProcessingIndicator]);

    const handleCityChange = useCallback((value: string) => {
        console.log('[FilterBar] City change initiated:', value);
        
        showProcessingIndicator();
        
        if (cityDebounceRef.current) {
            clearTimeout(cityDebounceRef.current);
        }

        cityDebounceRef.current = setTimeout(() => {
            console.log('[FilterBar] City applied:', value);
            onCityChange(value);
            updateURL(selectedCategory, value, selectedRating, searchQuery, displayLimit);
            
            setTimeout(hideProcessingIndicator, 300);
        }, 100);
    }, [onCityChange, selectedCategory, selectedRating, searchQuery, displayLimit, updateURL, showProcessingIndicator, hideProcessingIndicator]);

    const handleRatingChange = useCallback((value: string) => {
        console.log('[FilterBar] Rating change initiated:', value);
        
        showProcessingIndicator();
        
        if (ratingDebounceRef.current) {
            clearTimeout(ratingDebounceRef.current);
        }

        ratingDebounceRef.current = setTimeout(() => {
            console.log('[FilterBar] Rating applied:', value);
            onRatingChange(value);
            updateURL(selectedCategory, selectedCity, value, searchQuery, displayLimit);
            
            setTimeout(hideProcessingIndicator, 300);
        }, 100);
    }, [onRatingChange, selectedCategory, selectedCity, searchQuery, displayLimit, updateURL, showProcessingIndicator, hideProcessingIndicator]);

    const handleDisplayLimitChange = useCallback((value: string) => {
        console.log('[FilterBar] Display limit change initiated:', value);
        
        showProcessingIndicator();
        
        if (limitDebounceRef.current) {
            clearTimeout(limitDebounceRef.current);
        }

        limitDebounceRef.current = setTimeout(() => {
            console.log('[FilterBar] Display limit applied:', value);
            onDisplayLimitChange(value);
            updateURL(selectedCategory, selectedCity, selectedRating, searchQuery, value);
            
            setTimeout(hideProcessingIndicator, 300);
        }, 100);
    }, [onDisplayLimitChange, selectedCategory, selectedCity, selectedRating, searchQuery, updateURL, showProcessingIndicator, hideProcessingIndicator]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalSearchQuery(e.target.value);
    }, []);

    const handleSearchSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log('[FilterBar] Search submitted:', localSearchQuery);
        
        showProcessingIndicator();
        
        onSearchChange(localSearchQuery);
        updateURL(selectedCategory, selectedCity, selectedRating, localSearchQuery, displayLimit);
        
        setTimeout(hideProcessingIndicator, 300);
    }, [localSearchQuery, onSearchChange, selectedCategory, selectedCity, selectedRating, displayLimit, updateURL, showProcessingIndicator, hideProcessingIndicator]);

    const resetAll = useCallback(() => {
        console.log('[FilterBar] Resetting all filters');
        
        showProcessingIndicator();
        
        // Clear all timeouts
        if (categoryDebounceRef.current) clearTimeout(categoryDebounceRef.current);
        if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current);
        if (ratingDebounceRef.current) clearTimeout(ratingDebounceRef.current);
        if (limitDebounceRef.current) clearTimeout(limitDebounceRef.current);

        onCategoryChange("");
        onCityChange("");
        onRatingChange("");
        onSearchChange("");
        onDisplayLimitChange("10");
        setLocalSearchQuery("");
        onResetFilters();
        setSheetOpen(false);
        window.history.replaceState({}, '', '/jasa');
        
        setTimeout(hideProcessingIndicator, 300);
    }, [onCategoryChange, onCityChange, onRatingChange, onSearchChange, onDisplayLimitChange, onResetFilters, showProcessingIndicator, hideProcessingIndicator]);

    const handleSaveFilters = useCallback(() => {
        setSheetOpen(false);
    }, []);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (categoryDebounceRef.current) clearTimeout(categoryDebounceRef.current);
            if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current);
            if (ratingDebounceRef.current) clearTimeout(ratingDebounceRef.current);
            if (limitDebounceRef.current) clearTimeout(limitDebounceRef.current);
            if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
        };
    }, []);

    // Active chips
    const activeChips = useMemo(() => {
        const chips: { key: "kategori" | "kota" | "rating" | "search" | "limit"; label: string }[] = [];

        if (selectedCategory) {
            chips.push({
                key: "kategori",
                label: getCategoryLabel(selectedCategory)
            });
        }

        if (selectedCity) {
            chips.push({
                key: "kota",
                label: selectedCity
            });
        }

        if (selectedRating && selectedRating !== "semuarating") {
            chips.push({
                key: "rating",
                label: RATING_LABELS[selectedRating] || `Rating: ${selectedRating}`
            });
        }

        if (searchQuery) {
            chips.push({
                key: "search",
                label: `Pencarian: ${searchQuery}`
            });
        }

        if (displayLimit && displayLimit !== "10") {
            const limitLabel = DISPLAY_LIMITS.find(l => l.value === displayLimit)?.label || `Tampilkan: ${displayLimit}`;
            chips.push({
                key: "limit",
                label: limitLabel
            });
        }

        return chips;
    }, [selectedCategory, selectedCity, selectedRating, searchQuery, displayLimit, getCategoryLabel]);

    const removeChip = useCallback((key: "kategori" | "kota" | "rating" | "search" | "limit") => {
        showProcessingIndicator();
        
        switch (key) {
            case "kategori":
                handleCategoryChange("");
                break;
            case "kota":
                handleCityChange("");
                break;
            case "rating":
                handleRatingChange("");
                break;
            case "search":
                setLocalSearchQuery("");
                onSearchChange("");
                updateURL(selectedCategory, selectedCity, selectedRating, "", displayLimit);
                setTimeout(hideProcessingIndicator, 300);
                break;
            case "limit":
                handleDisplayLimitChange("10");
                break;
        }
    }, [handleCategoryChange, handleCityChange, handleRatingChange, handleDisplayLimitChange, onSearchChange, updateURL, selectedCategory, selectedCity, selectedRating, displayLimit, showProcessingIndicator, hideProcessingIndicator]);

    // Chips component
    const ChipsComponent = useMemo(() => {
        if (activeChips.length === 0) return null;

        return (
            <div className="mt-3 flex flex-wrap items-center gap-2">
                {activeChips.map(chip => (
                    <Chip
                        key={chip.key}
                        label={chip.label}
                        onRemove={() => removeChip(chip.key)}
                    />
                ))}
                <button
                    type="button"
                    onClick={resetAll}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#7CE0A8] to-[#5CA68A] px-4 py-1.5 text-white text-sm font-medium hover:from-[#6BCF97] hover:to-[#4A8D74] transition-all shadow-md hover:shadow-lg ml-2"
                >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset semua
                </button>
            </div>
        );
    }, [activeChips, removeChip, resetAll]);

    // City names
    const cityNames = useMemo(() => cities.map(c => c.name), [cities]);

    // Show skeleton/placeholder saat data belum ready
    if (!dataReady) {
        return (
            <section aria-label="Filter jasa" className="mt-4 mb-6">
                <div className="hidden lg:grid lg:grid-cols-12 items-center gap-2 lg:gap-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className={`${i === 3 ? 'lg:col-span-4' : 'lg:col-span-2'}`}>
                            <div className="h-11 rounded-xl bg-muted animate-pulse" />
                        </div>
                    ))}
                </div>
                <div className="hidden md:grid lg:hidden grid-cols-12 items-center gap-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className={`${i === 3 ? 'col-span-4' : 'col-span-2'}`}>
                            <div className="h-11 rounded-xl bg-muted animate-pulse" />
                        </div>
                    ))}
                </div>
                <div className="md:hidden mt-2 flex items-center gap-2">
                    <div className="flex-1 h-11 rounded-xl bg-muted animate-pulse" />
                    <div className="h-11 w-11 rounded-xl bg-muted animate-pulse" />
                </div>
            </section>
        );
    }

    return (
        <section aria-label="Filter jasa" className="mt-4 mb-6">
            {/* ✅ Processing Indicator */}
            {isProcessing && <LoadingIndicator />}
            
            {/* DESKTOP/TABLET (1024px+) */}
            <div className="hidden lg:grid lg:grid-cols-12 items-center gap-2 lg:gap-3">
                {/* Kategori */}
                <div className="lg:col-span-2">
                    <Select
                        value={selectedCategory}
                        onValueChange={handleCategoryChange}
                        disabled={isProcessing}
                    >
                        <SelectTrigger className="h-11 rounded-xl px-4 text-base w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8] transition-all disabled:opacity-60">
                            <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] overflow-y-auto z-[100]">
                            {categories.map((cat) => (
                                <SelectItem key={cat.category_id} value={cat.slug}>
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Kota */}
                <div className="lg:col-span-2">
                    <CitySelect
                        value={selectedCity}
                        onValueChange={handleCityChange}
                        cities={cityNames}
                        placeholder="Pilih kota"
                        triggerClassName={`h-11 rounded-xl px-4 text-base w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8] transition-all ${isProcessing ? 'opacity-60 pointer-events-none' : ''}`}
                        contentClassName="z-[100]"
                    />
                </div>

                {/* Rating */}
                <div className="lg:col-span-2">
                    <Select
                        value={selectedRating}
                        onValueChange={handleRatingChange}
                        disabled={isProcessing}
                    >
                        <SelectTrigger className="h-11 rounded-xl px-4 text-base w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8] transition-all disabled:opacity-60">
                            <SelectValue placeholder="Pilih rating" />
                        </SelectTrigger>
                        <SelectContent className="z-[100]">
                            <SelectItem value="5">⭐ 5</SelectItem>
                            <SelectItem value="4+">⭐ 4.0+</SelectItem>
                            <SelectItem value="3+">⭐ 3.0+</SelectItem>
                            <SelectItem value="2+">⭐ 2.0+</SelectItem>
                            <SelectItem value="1+">⭐ 1.0+</SelectItem>
                            <SelectItem value="semuarating">Semua Rating</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Search */}
                <div className="lg:col-span-4">
                    <div className={isProcessing ? 'pointer-events-none opacity-60' : ''}>
                        <PlaceholdersAndVanishInput
                            placeholders={PLACEHOLDERS}
                            onChange={handleSearchChange}
                            onSubmit={handleSearchSubmit}
                            value={localSearchQuery}
                            className="h-12 rounded-xl border border-input bg-background text-foreground shadow-none w-full focus-within:ring-2 focus-within:ring-[#7CE0A8] focus-within:border-[#7CE0A8] transition-all"
                            inputClassName="pl-4 pr-10 text-sm lg:text-base"
                            buttonClassName="h-8 w-8 rounded-md bg-[#7CE0A8] hover:bg-[#5CA68A] text-white transition-all"
                        />
                    </div>
                </div>

                {/* Tampilkan */}
                <div className="lg:col-span-2">
                    <Select
                        value={displayLimit}
                        onValueChange={handleDisplayLimitChange}
                        disabled={isProcessing}
                    >
                        <SelectTrigger className="h-11 rounded-xl px-4 text-base w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8] transition-all disabled:opacity-60">
                            <SelectValue placeholder="Tampilkan" />
                        </SelectTrigger>
                        <SelectContent className="z-[100]">
                            {DISPLAY_LIMITS.map((limit) => (
                                <SelectItem key={limit.value} value={limit.value}>
                                    {limit.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* TABLET (768px - 1023px) */}
            <div className="hidden md:grid lg:hidden grid-cols-12 items-center gap-2">
                <div className="col-span-2">
                    <Select value={selectedCategory} onValueChange={handleCategoryChange} disabled={isProcessing}>
                        <SelectTrigger className="h-11 rounded-xl px-3 text-sm w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8] transition-all disabled:opacity-60">
                            <SelectValue placeholder="Kategori" />
                        </SelectTrigger>
                        <SelectContent className="z-[100]">
                            {categories.map((cat) => (
                                <SelectItem key={cat.category_id} value={cat.slug}>
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="col-span-2">
                    <CitySelect
                        value={selectedCity}
                        onValueChange={handleCityChange}
                        cities={cityNames}
                        placeholder="Kota"
                        triggerClassName={`h-11 rounded-xl px-3 text-sm w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8] transition-all ${isProcessing ? 'opacity-60 pointer-events-none' : ''}`}
                        contentClassName="z-[100]"
                    />
                </div>

                <div className="col-span-2">
                    <Select value={selectedRating} onValueChange={handleRatingChange} disabled={isProcessing}>
                        <SelectTrigger className="h-11 rounded-xl px-3 text-sm w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8] transition-all disabled:opacity-60">
                            <SelectValue placeholder="Rating" />
                        </SelectTrigger>
                        <SelectContent className="z-[100]">
                            <SelectItem value="5">⭐ 5</SelectItem>
                            <SelectItem value="4+">⭐ 4.0+</SelectItem>
                            <SelectItem value="3+">⭐ 3.0+</SelectItem>
                            <SelectItem value="2+">⭐ 2.0+</SelectItem>
                            <SelectItem value="1+">⭐ 1.0+</SelectItem>
                            <SelectItem value="semuarating">Semua</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="col-span-4">
                    <div className={isProcessing ? 'pointer-events-none opacity-60' : ''}>
                        <PlaceholdersAndVanishInput
                            placeholders={PLACEHOLDERS}
                            onChange={handleSearchChange}
                            onSubmit={handleSearchSubmit}
                            value={localSearchQuery}
                            className="h-11 rounded-xl border border-input bg-background text-foreground shadow-none w-full focus-within:ring-2 focus-within:ring-[#7CE0A8] focus-within:border-[#7CE0A8] transition-all"
                            inputClassName="pl-3 pr-9 text-sm"
                            buttonClassName="h-7 w-7 rounded-md bg-[#7CE0A8] hover:bg-[#5CA68A] text-white transition-all"
                        />
                    </div>
                </div>

                <div className="col-span-2">
                    <Select value={displayLimit} onValueChange={handleDisplayLimitChange} disabled={isProcessing}>
                        <SelectTrigger className="h-11 rounded-xl px-3 text-sm w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8] transition-all disabled:opacity-60">
                            <SelectValue placeholder="Tampilkan" />
                        </SelectTrigger>
                        <SelectContent className="z-[100]">
                            {DISPLAY_LIMITS.map((limit) => (
                                <SelectItem key={limit.value} value={limit.value}>
                                    {limit.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Chips desktop/tablet */}
            <div className="hidden md:block">
                {ChipsComponent}
            </div>

            {/* MOBILE (< 768px) */}
            <div className="md:hidden mt-2 flex items-center gap-2">
                <div className={`flex-1 ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}>
                    <PlaceholdersAndVanishInput
                        placeholders={PLACEHOLDERS}
                        onChange={handleSearchChange}
                        onSubmit={handleSearchSubmit}
                        value={localSearchQuery}
                        className="h-11 rounded-xl border border-input bg-background text-foreground shadow-none focus-within:ring-2 focus-within:ring-[#7CE0A8] focus-within:border-[#7CE0A8] transition-all"
                        inputClassName="pl-3 pr-9 text-sm"
                        buttonClassName="h-7 w-7 rounded-md bg-[#7CE0A8] hover:bg-[#5CA68A] text-white transition-all"
                    />
                </div>

                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 rounded-xl p-0 border-[#7CE0A8]/30 hover:border-[#7CE0A8] hover:bg-[#7CE0A8]/5 transition-all disabled:opacity-60"
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <Loader2 className="h-5 w-5 text-[#7CE0A8] animate-spin" />
                            ) : (
                                <SlidersHorizontal className="h-5 w-5 text-[#7CE0A8]" />
                            )}
                        </Button>
                    </SheetTrigger>

                    <SheetContent
                        side="bottom"
                        className="rounded-t-2xl p-4 flex flex-col"
                        style={{
                            height: isSmallMobile ? '85vh' : 'auto',
                            maxHeight: '85vh'
                        }}
                    >
                        <SheetHeader className="flex-shrink-0">
                            <SheetTitle className="text-[#7CE0A8] text-center">Filter</SheetTitle>
                        </SheetHeader>

                        <div className={`pr-2 ${isSmallMobile ? 'mt-3 space-y-4 flex-1 overflow-y-auto' : 'mt-2 space-y-3'}`}>
                            {/* Kategori */}
                            <div className="space-y-1.5">
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Kategori</div>
                                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                                    <SelectTrigger className="h-12 rounded-xl px-4 text-base w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8]">
                                        <SelectValue placeholder="Pilih kategori" />
                                    </SelectTrigger>
                                    <SelectContent className="z-[9999]" position="popper" side="bottom" avoidCollisions={false}>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.category_id} value={cat.slug}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Lokasi */}
                            <div className="space-y-1.5">
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Lokasi</div>
                                <CitySelect
                                    value={selectedCity}
                                    onValueChange={handleCityChange}
                                    cities={cityNames}
                                    placeholder="Pilih kota"
                                    triggerClassName="h-12 rounded-xl px-4 text-base w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8]"
                                    contentClassName="z-[9999]"
                                    avoidCollisions={false}
                                />
                            </div>

                            {/* Rating */}
                            <div className="space-y-1.5">
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Rating</div>
                                <Select value={selectedRating} onValueChange={handleRatingChange}>
                                    <SelectTrigger className="h-12 rounded-xl px-4 text-base w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8]">
                                        <SelectValue placeholder="Pilih rating" />
                                    </SelectTrigger>
                                    <SelectContent className="z-[9999]" position="popper" side="bottom" avoidCollisions={false}>
                                        <SelectItem value="5">⭐ 5</SelectItem>
                                        <SelectItem value="4+">⭐ 4.0+</SelectItem>
                                        <SelectItem value="3+">⭐ 3.0+</SelectItem>
                                        <SelectItem value="2+">⭐ 2.0+</SelectItem>
                                        <SelectItem value="1+">⭐ 1.0+</SelectItem>
                                        <SelectItem value="semuarating">Semua Rating</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Tampilkan */}
                            <div className="space-y-1.5">
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Tampilkan</div>
                                <Select value={displayLimit} onValueChange={handleDisplayLimitChange}>
                                    <SelectTrigger className="h-12 rounded-xl px-4 text-base w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8]">
                                        <SelectValue placeholder="Tampilkan" />
                                    </SelectTrigger>
                                    <SelectContent className="z-[9999]" position="popper" side="bottom" avoidCollisions={false}>
                                        {DISPLAY_LIMITS.map((limit) => (
                                            <SelectItem key={limit.value} value={limit.value}>
                                                {limit.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <SheetFooter className={`pt-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 ${isSmallMobile ? 'mt-3' : 'mt-3'}`}>
                            <div className="flex gap-2 w-full">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-12 rounded-xl flex-1 border-[#7CE0A8] text-[#7CE0A8] hover:bg-[#7CE0A8]/5 transition-all"
                                    onClick={resetAll}
                                    disabled={isProcessing}
                                >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Reset
                                </Button>
                                <SheetClose asChild>
                                    <Button
                                        type="button"
                                        className="h-12 rounded-xl flex-1 bg-gradient-to-r from-[#7CE0A8] to-[#5CA68A] text-white hover:from-[#6BCF97] hover:to-[#4A8D74] transition-all"
                                        onClick={handleSaveFilters}
                                    >
                                        Simpan
                                    </Button>
                                </SheetClose>
                            </div>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Chips mobile */}
            <div className="md:hidden">
                {ChipsComponent}
            </div>

            <style jsx global>{`
                @media screen and (max-width: 768px) {
                    input[type="text"],
                    input[type="search"] {
                        font-size: 16px !important;
                    }
                    
                    select {
                        font-size: 16px !important;
                    }
                }
                
                @media screen and (max-width: 375px) and (max-height: 667px) {
                    .text-sm {
                        font-size: 13px !important;
                    }
                    
                    .text-base {
                        font-size: 14px !important;
                    }
                    
                    .h-12 {
                        height: 42px !important;
                    }
                    
                    .space-y-4 > * + * {
                        margin-top: 10px !important;
                    }
                }
                
                [data-radix-popper-content-wrapper] {
                    z-index: 9999 !important;
                }
            `}</style>
        </section>
    );
}