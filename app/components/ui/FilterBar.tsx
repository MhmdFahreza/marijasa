// app/components/ui/FilterBar.tsx
"use client";

import { useMemo, useState, useCallback, memo, useEffect, useRef } from "react";
import { SlidersHorizontal, X, RotateCcw, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/app/components/ui/select";
import { Button } from "@/app/components/ui/button";
import CitySelect from "@/app/components/ui/city-select";
import {
    Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger, SheetClose,
} from "@/app/components/ui/sheet";

import { PlaceholdersAndVanishInput } from "@/app/components/ui/placeholders-and-vanish-input";

// Types
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

interface FilterBarProps {
    selectedCategory: string;
    onCategoryChange: (value: string) => void;
    selectedCity: string;
    onCityChange: (value: string) => void;
    selectedRating: string;
    onRatingChange: (value: string) => void;
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
    "Cari jasa kebersihan rumah",
    "Teknisi AC terdekat",
    "Tukang listrik 24 jam",
    "Jasa Pindahan",
    "Jasa perbaikan atap bocor",
];

export default function FilterBar({
    selectedCategory,
    onCategoryChange,
    selectedCity,
    onCityChange,
    selectedRating,
    onRatingChange,
    onResetFilters,
}: FilterBarProps) {
    const router = useRouter();
    const [urutkan, setUrutkan] = useState<string>("");
    const [isSmallMobile, setIsSmallMobile] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);
    const sheetContentRef = useRef<HTMLDivElement>(null);

    // Master data state
    const [cities, setCities] = useState<City[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoadingCities, setIsLoadingCities] = useState(true);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);

    // Fetch cities from API with abort controller
    useEffect(() => {
        const abortController = new AbortController();
        
        const fetchCities = async () => {
            try {
                setIsLoadingCities(true);
                const response = await fetch('/api/master/cities', {
                    signal: abortController.signal,
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch cities');
                }
                
                const data = await response.json();
                if (data.success && !abortController.signal.aborted) {
                    setCities(data.data);
                }
            } catch (error: any) {
                if (error.name !== 'AbortError') {
                    console.error('Error fetching cities:', error);
                }
            } finally {
                if (!abortController.signal.aborted) {
                    setIsLoadingCities(false);
                }
            }
        };

        fetchCities();
        
        return () => {
            abortController.abort();
        };
    }, []);

    // Fetch categories from API with abort controller
    useEffect(() => {
        const abortController = new AbortController();
        
        const fetchCategories = async () => {
            try {
                setIsLoadingCategories(true);
                const response = await fetch('/api/master/categories', {
                    signal: abortController.signal,
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch categories');
                }
                
                const data = await response.json();
                if (data.success && !abortController.signal.aborted) {
                    setCategories(data.data);
                }
            } catch (error: any) {
                if (error.name !== 'AbortError') {
                    console.error('Error fetching categories:', error);
                }
            } finally {
                if (!abortController.signal.aborted) {
                    setIsLoadingCategories(false);
                }
            }
        };

        fetchCategories();
        
        return () => {
            abortController.abort();
        };
    }, []);

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

    // Get category label from slug - optimized with useMemo
    const categoryMap = useMemo(() => {
        return categories.reduce((acc, cat) => {
            acc[cat.slug] = cat.name;
            return acc;
        }, {} as Record<string, string>);
    }, [categories]);

    const getCategoryLabel = useCallback((slug: string) => {
        return categoryMap[slug] || slug;
    }, [categoryMap]);

    // Update URL function - debounced
    const updateURL = useCallback((category: string, city: string, rating: string) => {
        const params = new URLSearchParams();

        if (category) {
            params.set('kategori', category);
        }
        if (city) {
            params.set('kota', city);
        }
        if (rating && rating !== 'semuarating') {
            params.set('rating', rating);
        }

        const queryString = params.toString();
        const newURL = queryString ? `/jasa?${queryString}` : '/jasa';

        // Use replace instead of push to avoid history pollution
        router.replace(newURL, { scroll: false });
    }, [router]);

    const handleCategoryChange = useCallback((value: string) => {
        // Batch state updates
        requestAnimationFrame(() => {
            onCategoryChange(value);
            updateURL(value, selectedCity, selectedRating);
        });
    }, [onCategoryChange, selectedCity, selectedRating, updateURL]);

    const handleCityChange = useCallback((value: string) => {
        requestAnimationFrame(() => {
            onCityChange(value);
            updateURL(selectedCategory, value, selectedRating);
        });
    }, [onCityChange, selectedCategory, selectedRating, updateURL]);

    const handleRatingChange = useCallback((value: string) => {
        requestAnimationFrame(() => {
            onRatingChange(value);
            updateURL(selectedCategory, selectedCity, value);
        });
    }, [onRatingChange, selectedCategory, selectedCity, updateURL]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        console.log("query:", e.target.value);
    }, []);

    const handleSearchSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log("submitted search");
    }, []);

    const resetAll = useCallback(() => {
        // Batch all resets together
        requestAnimationFrame(() => {
            onCategoryChange("");
            onCityChange("");
            onRatingChange("");
            setUrutkan("");
            onResetFilters();
            setSheetOpen(false);
            router.replace('/jasa', { scroll: false });
        });
    }, [onCategoryChange, onCityChange, onRatingChange, onResetFilters, router]);

    const handleSaveFilters = useCallback(() => {
        setSheetOpen(false);
    }, []);

    // Active chips - memoized to prevent unnecessary recalculations
    const activeChips = useMemo(() => {
        const chips: { key: "kategori" | "kota" | "rating" | "urutkan"; label: string }[] = [];

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

        if (urutkan) {
            chips.push({
                key: "urutkan",
                label: `Urutkan: ${urutkan}`
            });
        }

        return chips;
    }, [selectedCategory, selectedCity, selectedRating, urutkan, getCategoryLabel]);

    const removeChip = useCallback((key: "kategori" | "kota" | "rating" | "urutkan") => {
        requestAnimationFrame(() => {
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
                case "urutkan":
                    setUrutkan("");
                    break;
            }
        });
    }, [handleCategoryChange, handleCityChange, handleRatingChange]);

    // Memoized chips component
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

    // Memoized city names
    const cityNames = useMemo(() => cities.map(c => c.name), [cities]);

    // Loading placeholder component
    const LoadingSelect = () => (
        <div className="flex items-center justify-center h-11 rounded-xl border border-input bg-muted px-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
    );

    return (
        <section aria-label="Filter jasa" className="mt-4 mb-6">
            {/* DESKTOP/TABLET (1024px ke atas) */}
            <div className="hidden lg:grid lg:grid-cols-12 items-center gap-2 lg:gap-3">
                {/* Kategori Select */}
                <div className="lg:col-span-2">
                    {isLoadingCategories ? (
                        <LoadingSelect />
                    ) : (
                        <Select
                            value={selectedCategory}
                            onValueChange={handleCategoryChange}
                        >
                            <SelectTrigger className="h-11 rounded-xl px-4 text-base w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8] transition-colors duration-200">
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
                    )}
                </div>

                {/* CitySelect */}
                <div className="lg:col-span-2">
                    {isLoadingCities ? (
                        <LoadingSelect />
                    ) : (
                        <CitySelect
                            value={selectedCity}
                            onValueChange={handleCityChange}
                            cities={cityNames}
                            placeholder="Pilih kota"
                            triggerClassName="h-11 rounded-xl px-4 text-base w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8] transition-colors duration-200"
                            contentClassName="z-[100]"
                        />
                    )}
                </div>

                {/* Rating Select */}
                <div className="lg:col-span-2">
                    <Select
                        value={selectedRating}
                        onValueChange={handleRatingChange}
                    >
                        <SelectTrigger className="h-11 rounded-xl px-4 text-base w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8] transition-colors duration-200">
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

                {/* Search Input */}
                <div className="lg:col-span-4">
                    <PlaceholdersAndVanishInput
                        placeholders={PLACEHOLDERS}
                        onChange={handleSearchChange}
                        onSubmit={handleSearchSubmit}
                        className="h-12 rounded-xl border border-input bg-background text-foreground shadow-none w-full focus-within:ring-2 focus-within:ring-[#7CE0A8] focus-within:border-[#7CE0A8] transition-all duration-200"
                        inputClassName="pl-4 pr-10 text-sm lg:text-base"
                        buttonClassName="h-8 w-8 rounded-md bg-[#7CE0A8] hover:bg-[#5CA68A] text-white transition-colors"
                    />
                </div>

                {/* Urutkan Select */}
                <div className="lg:col-span-2">
                    <Select
                        value={urutkan}
                        onValueChange={setUrutkan}
                    >
                        <SelectTrigger className="h-11 rounded-xl px-4 text-base w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8] transition-colors duration-200">
                            <SelectValue placeholder="Urutkan" />
                        </SelectTrigger>
                        <SelectContent className="z-[100]">
                            <SelectItem value="terbaru">Terbaru</SelectItem>
                            <SelectItem value="terdekat">Terdekat</SelectItem>
                            <SelectItem value="rating">Rating Tertinggi</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* TABLET (768px - 1023px) */}
            <div className="hidden md:grid lg:hidden grid-cols-12 items-center gap-2">
                <div className="col-span-2">
                    {isLoadingCategories ? (
                        <LoadingSelect />
                    ) : (
                        <Select
                            value={selectedCategory}
                            onValueChange={handleCategoryChange}
                        >
                            <SelectTrigger className="h-11 rounded-xl px-3 text-sm w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8] transition-colors duration-200">
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
                    )}
                </div>

                <div className="col-span-2">
                    {isLoadingCities ? (
                        <LoadingSelect />
                    ) : (
                        <CitySelect
                            value={selectedCity}
                            onValueChange={handleCityChange}
                            cities={cityNames}
                            placeholder="Kota"
                            triggerClassName="h-11 rounded-xl px-3 text-sm w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8] transition-colors duration-200"
                            contentClassName="z-[100]"
                        />
                    )}
                </div>

                <div className="col-span-2">
                    <Select
                        value={selectedRating}
                        onValueChange={handleRatingChange}
                    >
                        <SelectTrigger className="h-11 rounded-xl px-3 text-sm w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8] transition-colors duration-200">
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
                    <PlaceholdersAndVanishInput
                        placeholders={PLACEHOLDERS}
                        onChange={handleSearchChange}
                        onSubmit={handleSearchSubmit}
                        className="h-11 rounded-xl border border-input bg-background text-foreground shadow-none w-full focus-within:ring-2 focus-within:ring-[#7CE0A8] focus-within:border-[#7CE0A8] transition-all duration-200"
                        inputClassName="pl-3 pr-9 text-sm"
                        buttonClassName="h-7 w-7 rounded-md bg-[#7CE0A8] hover:bg-[#5CA68A] text-white transition-colors"
                    />
                </div>

                <div className="col-span-2">
                    <Select
                        value={urutkan}
                        onValueChange={setUrutkan}
                    >
                        <SelectTrigger className="h-11 rounded-xl px-3 text-sm w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8] transition-colors duration-200">
                            <SelectValue placeholder="Urutkan" />
                        </SelectTrigger>
                        <SelectContent className="z-[100]">
                            <SelectItem value="terbaru">Terbaru</SelectItem>
                            <SelectItem value="terdekat">Terdekat</SelectItem>
                            <SelectItem value="rating">Rating</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Chips desktop/tablet */}
            <div className="hidden md:block">
                {ChipsComponent}
            </div>

            {/* MOBILE (di bawah 768px) */}
            <div className="md:hidden mt-2 flex items-center gap-2">
                <div className="flex-1">
                    <PlaceholdersAndVanishInput
                        placeholders={PLACEHOLDERS}
                        onChange={handleSearchChange}
                        onSubmit={handleSearchSubmit}
                        className="h-11 rounded-xl border border-input bg-background text-foreground shadow-none focus-within:ring-2 focus-within:ring-[#7CE0A8] focus-within:border-[#7CE0A8] transition-all duration-200"
                        inputClassName="pl-3 pr-9 text-sm"
                        buttonClassName="h-7 w-7 rounded-md bg-[#7CE0A8] hover:bg-[#5CA68A] text-white transition-colors"
                    />
                </div>

                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 rounded-xl p-0 border-[#7CE0A8]/30 hover:border-[#7CE0A8] hover:bg-[#7CE0A8]/5 transition-colors duration-200"
                            aria-label="Buka filter"
                            title="Filter"
                        >
                            <SlidersHorizontal className="h-5 w-5 text-[#7CE0A8]" />
                        </Button>
                    </SheetTrigger>

                    <SheetContent
                        side="bottom"
                        className="rounded-t-2xl p-4 flex flex-col"
                        style={{
                            height: isSmallMobile ? '85vh' : 'auto',
                            maxHeight: '85vh'
                        }}
                        ref={sheetContentRef}
                    >
                        <SheetHeader className="flex-shrink-0">
                            <SheetTitle className="text-[#7CE0A8] text-center">Filter</SheetTitle>
                        </SheetHeader>

                        <div className={`pr-2 ${isSmallMobile ? 'mt-3 space-y-4 flex-1 overflow-y-auto' : 'mt-2 space-y-3'}`}>
                            {/* Kategori */}
                            <div className="space-y-1.5">
                                <div className="text-sm font-medium text-gray-700">Kategori</div>
                                {isLoadingCategories ? (
                                    <div className="flex items-center justify-center h-12 rounded-xl border border-input bg-muted">
                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                        <span className="ml-2 text-sm text-muted-foreground">Memuat...</span>
                                    </div>
                                ) : (
                                    <Select
                                        value={selectedCategory}
                                        onValueChange={handleCategoryChange}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl px-4 text-base w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8] transition-colors duration-200">
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
                                )}
                            </div>

                            {/* Lokasi */}
                            <div className="space-y-1.5">
                                <div className="text-sm font-medium text-gray-700">Lokasi</div>
                                {isLoadingCities ? (
                                    <div className="flex items-center justify-center h-12 rounded-xl border border-input bg-muted">
                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                        <span className="ml-2 text-sm text-muted-foreground">Memuat...</span>
                                    </div>
                                ) : (
                                    <CitySelect
                                        value={selectedCity}
                                        onValueChange={handleCityChange}
                                        cities={cityNames}
                                        placeholder="Pilih kota"
                                        triggerClassName="h-12 rounded-xl px-4 text-base w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8] transition-colors duration-200"
                                        contentClassName="z-[9999]"
                                        avoidCollisions={false}
                                    />
                                )}
                            </div>

                            {/* Rating */}
                            <div className="space-y-1.5">
                                <div className="text-sm font-medium text-gray-700">Rating</div>
                                <Select
                                    value={selectedRating}
                                    onValueChange={handleRatingChange}
                                >
                                    <SelectTrigger className="h-12 rounded-xl px-4 text-base w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8] transition-colors duration-200">
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

                            {/* Urutkan */}
                            <div className="space-y-1.5">
                                <div className="text-sm font-medium text-gray-700">Urutkan</div>
                                <Select
                                    value={urutkan}
                                    onValueChange={setUrutkan}
                                >
                                    <SelectTrigger className="h-12 rounded-xl px-4 text-base w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8] transition-colors duration-200">
                                        <SelectValue placeholder="Urutkan" />
                                    </SelectTrigger>
                                    <SelectContent className="z-[9999]" position="popper" side="bottom" avoidCollisions={false}>
                                        <SelectItem value="terbaru">Terbaru</SelectItem>
                                        <SelectItem value="terdekat">Terdekat</SelectItem>
                                        <SelectItem value="rating">Rating Tertinggi</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <SheetFooter className={`pt-3 border-t border-gray-200 flex-shrink-0 ${isSmallMobile ? 'mt-3' : 'mt-3'}`}>
                            <div className="flex gap-2 w-full">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-12 rounded-xl flex-1 border-[#7CE0A8] text-[#7CE0A8] hover:bg-[#7CE0A8]/5 transition-colors duration-200"
                                    onClick={resetAll}
                                >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Reset
                                </Button>
                                <SheetClose asChild>
                                    <Button
                                        type="button"
                                        className="h-12 rounded-xl flex-1 bg-gradient-to-r from-[#7CE0A8] to-[#5CA68A] text-white hover:from-[#6BCF97] hover:to-[#4A8D74] transition-all duration-200"
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