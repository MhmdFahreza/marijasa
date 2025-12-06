"use client";

import { useMemo, useState, useCallback, memo, useEffect, useRef } from "react";
import { SlidersHorizontal, X, RotateCcw, Search } from "lucide-react";

import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/app/components/ui/select";
import { Button } from "@/app/components/ui/button";
import CitySelect from "@/app/components/ui/city-select";
import { CITIES_ID } from "@/app/data/cities-id";
import {
    Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger, SheetClose,
} from "@/app/components/ui/sheet";

import { PlaceholdersAndVanishInput } from "@/app/components/ui/placeholders-and-vanish-input";

// Optimasi: Pindahkan konstanta keluar komponen
const CATEGORY_LABELS: Record<string, string> = {
  listrik: "Tukang Listrik",
  ac: "Tukang AC",
  pembersihanrumah: "Tukang Pembersihan Rumah",
  ledeng: "Tukang Ledeng",
  sedotwc: "Tukang Sedot WC",
  kebun: "Tukang Kebun",
  furnitur: "Tukang Mebel",
};

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

// Optimasi: Komponen Chip yang terpisah dengan memo
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

// Optimasi: Pindahkan konstanta placeholders keluar komponen
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
    const [urutkan, setUrutkan] = useState<string>("");
    const [isSmallMobile, setIsSmallMobile] = useState(false);
    const [isTallMobile, setIsTallMobile] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);
    const sheetContentRef = useRef<HTMLDivElement>(null);

    // Deteksi ukuran layar - pisahkan small dan tall mobile
    useEffect(() => {
        const checkMobile = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            // Small devices (iPhone 5, SE) - width kecil DAN height kecil
            setIsSmallMobile(width <= 375 && height <= 667);
            
            // Tall devices (iPhone X+) - width kecil tapi height besar
            setIsTallMobile(width <= 414 && height > 667);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Optimasi: Gunakan useCallback untuk handler
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        console.log("query:", e.target.value);
    }, []);
    
    const handleSearchSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log("submitted search");
    }, []);

    const resetAll = useCallback(() => {
        onCategoryChange("");
        onCityChange("");
        onRatingChange("");
        setUrutkan("");
        onResetFilters();
        setSheetOpen(false);
    }, [onCategoryChange, onCityChange, onRatingChange, onResetFilters]);

    const handleSaveFilters = useCallback(() => {
        setSheetOpen(false);
    }, []);

    // Optimasi: useMemo untuk active chips
    const activeChips = useMemo(() => {
        const chips: { key: "kategori" | "kota" | "rating" | "urutkan"; label: string }[] = [];
        
        if (selectedCategory) {
            chips.push({ 
                key: "kategori", 
                label: CATEGORY_LABELS[selectedCategory] || selectedCategory 
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
    }, [selectedCategory, selectedCity, selectedRating, urutkan]);

    // Optimasi: useCallback untuk remove chip
    const removeChip = useCallback((key: "kategori" | "kota" | "rating" | "urutkan") => {
        switch (key) {
            case "kategori":
                onCategoryChange("");
                break;
            case "kota":
                onCityChange("");
                break;
            case "rating":
                onRatingChange("");
                break;
            case "urutkan":
                setUrutkan("");
                break;
        }
    }, [onCategoryChange, onCityChange, onRatingChange]);

    // Optimasi: Komponen Chips yang terpisah
    const Chips = useMemo(() => {
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

    return (
        <section aria-label="Filter jasa" className="mt-4 mb-6">
            {/* DESKTOP/TABLET (1024px ke atas) */}
            <div className="hidden lg:grid lg:grid-cols-12 items-center gap-2 lg:gap-3">
                {/* Kategori Select */}
                <div className="lg:col-span-2">
                    <Select
                        value={selectedCategory}
                        onValueChange={onCategoryChange}
                    >
                        <SelectTrigger className="h-11 rounded-xl px-4 text-base w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8] transition-colors duration-200">
                            <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] overflow-y-auto z-[100]">
                            <SelectItem value="listrik">Tukang Listrik</SelectItem>
                            <SelectItem value="ac">Tukang AC</SelectItem>
                            <SelectItem value="pembersihanrumah">Tukang Pembersihan Rumah</SelectItem>
                            <SelectItem value="ledeng">Tukang Ledeng</SelectItem>
                            <SelectItem value="sedotwc">Tukang Sedot WC</SelectItem>
                            <SelectItem value="kebun">Tukang Kebun</SelectItem>
                            <SelectItem value="furnitur">Tukang Mebel</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* CitySelect */}
                <div className="lg:col-span-2">
                    <CitySelect
                        value={selectedCity}
                        onValueChange={onCityChange}
                        cities={CITIES_ID}
                        placeholder="Pilih kota"
                        triggerClassName="h-11 rounded-xl px-4 text-base w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8] transition-colors duration-200"
                        contentClassName="z-[100]"
                    />
                </div>

                {/* Rating Select */}
                <div className="lg:col-span-2">
                    <Select
                        value={selectedRating}
                        onValueChange={onRatingChange}
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

            {/* TABLET (768px - 1023px) - Layout sama dengan Desktop */}
            <div className="hidden md:grid lg:hidden grid-cols-12 items-center gap-2">
                {/* Kategori */}
                <div className="col-span-2">
                    <Select
                        value={selectedCategory}
                        onValueChange={onCategoryChange}
                    >
                        <SelectTrigger className="h-11 rounded-xl px-3 text-sm w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8] transition-colors duration-200">
                            <SelectValue placeholder="Kategori" />
                        </SelectTrigger>
                        <SelectContent className="z-[100]">
                            <SelectItem value="listrik">Tukang Listrik</SelectItem>
                            <SelectItem value="ac">Tukang AC</SelectItem>
                            <SelectItem value="pembersihanrumah">Tukang Pembersihan Rumah</SelectItem>
                            <SelectItem value="ledeng">Tukang Ledeng</SelectItem>
                            <SelectItem value="sedotwc">Tukang Sedot WC</SelectItem>
                            <SelectItem value="kebun">Tukang Kebun</SelectItem>
                            <SelectItem value="furnitur">Tukang Mebel</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Kota */}
                <div className="col-span-2">
                    <CitySelect
                        value={selectedCity}
                        onValueChange={onCityChange}
                        cities={CITIES_ID}
                        placeholder="Kota"
                        triggerClassName="h-11 rounded-xl px-3 text-sm w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8] transition-colors duration-200"
                        contentClassName="z-[100]"
                    />
                </div>

                {/* Rating */}
                <div className="col-span-2">
                    <Select
                        value={selectedRating}
                        onValueChange={onRatingChange}
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

                {/* Search Input */}
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

                {/* Urutkan */}
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
                {Chips}
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

                        {/* Konten utama - Conditional layout */}
                        <div className={`pr-2 ${isSmallMobile ? 'mt-3 space-y-4 flex-1 overflow-y-auto' : 'mt-2 space-y-3'}`}>
                            {/* Kategori */}
                            <div className="space-y-1.5">
                                <div className="text-sm font-medium text-gray-700">Kategori</div>
                                <Select
                                    value={selectedCategory}
                                    onValueChange={onCategoryChange}
                                >
                                    <SelectTrigger 
                                        className="h-12 rounded-xl px-4 text-base w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8] transition-colors duration-200"
                                        onClick={(e) => {
                                            // Prevent keyboard on mobile for select
                                            if (window.innerWidth < 768) {
                                                e.preventDefault();
                                            }
                                        }}
                                    >
                                        <SelectValue placeholder="Pilih kategori" />
                                    </SelectTrigger>
                                    <SelectContent 
                                        className="z-[9999]" 
                                        position="popper" 
                                        side="bottom"
                                        avoidCollisions={false}
                                        style={{ 
                                            width: 'var(--radix-select-trigger-width)',
                                            maxHeight: '200px'
                                        }}
                                    >
                                        <SelectItem value="listrik">Tukang Listrik</SelectItem>
                                        <SelectItem value="ac">Tukang AC</SelectItem>
                                        <SelectItem value="pembersihanrumah">Tukang Pembersihan Rumah</SelectItem>
                                        <SelectItem value="ledeng">Tukang Ledeng</SelectItem>
                                        <SelectItem value="sedotwc">Tukang Sedot WC</SelectItem>
                                        <SelectItem value="kebun">Tukang Kebun</SelectItem>
                                        <SelectItem value="furnitur">Tukang Mebel</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Lokasi */}
                            <div className="space-y-1.5">
                                <div className="text-sm font-medium text-gray-700">Lokasi</div>
                                <CitySelect
                                    value={selectedCity}
                                    onValueChange={onCityChange}
                                    cities={CITIES_ID}
                                    placeholder="Pilih kota"
                                    triggerClassName="h-12 rounded-xl px-4 text-base w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8] transition-colors duration-200"
                                    contentClassName="z-[9999]"
                                    onTriggerClick={(e) => {
                                        // Prevent keyboard on mobile for city select
                                        if (window.innerWidth < 768) {
                                            e.preventDefault();
                                        }
                                    }}
                                    avoidCollisions={false}
                                />
                            </div>

                            {/* Rating */}
                            <div className="space-y-1.5">
                                <div className="text-sm font-medium text-gray-700">Rating</div>
                                <Select
                                    value={selectedRating}
                                    onValueChange={onRatingChange}
                                >
                                    <SelectTrigger 
                                        className="h-12 rounded-xl px-4 text-base w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8] transition-colors duration-200"
                                        onClick={(e) => {
                                            // Prevent keyboard on mobile for select
                                            if (window.innerWidth < 768) {
                                                e.preventDefault();
                                            }
                                        }}
                                    >
                                        <SelectValue placeholder="Pilih rating" />
                                    </SelectTrigger>
                                    <SelectContent 
                                        className="z-[9999]" 
                                        position="popper" 
                                        side="bottom"
                                        avoidCollisions={false}
                                        style={{ 
                                            width: 'var(--radix-select-trigger-width)',
                                            maxHeight: '200px'
                                        }}
                                    >
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
                                    <SelectTrigger 
                                        className="h-12 rounded-xl px-4 text-base w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8] transition-colors duration-200"
                                        onClick={(e) => {
                                            // Prevent keyboard on mobile for select
                                            if (window.innerWidth < 768) {
                                                e.preventDefault();
                                            }
                                        }}
                                    >
                                        <SelectValue placeholder="Urutkan" />
                                    </SelectTrigger>
                                    <SelectContent 
                                        className="z-[9999]" 
                                        position="popper" 
                                        side="bottom"
                                        avoidCollisions={false}
                                        style={{ 
                                            width: 'var(--radix-select-trigger-width)',
                                            maxHeight: '200px',
                                            zIndex: 9999
                                        }}
                                    >
                                        <SelectItem value="terbaru">Terbaru</SelectItem>
                                        <SelectItem value="terdekat">Terdekat</SelectItem>
                                        <SelectItem value="rating">Rating Tertinggi</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Footer yang tetap di bawah */}
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
                {Chips}
            </div>

            {/* Tambahkan style untuk mencegah zoom dan keyboard issues */}
            <style jsx global>{`
                /* Mencegah zoom pada input di iOS */
                @media screen and (max-width: 768px) {
                    input[type="text"],
                    input[type="search"] {
                        font-size: 16px !important;
                    }
                    
                    /* Hide keyboard for select elements */
                    select {
                        font-size: 16px !important;
                    }
                }
                
                /* Untuk devices sangat kecil (iPhone 5, SE) - width <= 375px DAN height <= 667px */
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
                
                /* Untuk devices tall/panjang (iPhone X+) - height > 667px */
                @media screen and (max-width: 414px) and (min-height: 668px) {
                    /* Sheet content untuk tall mobile - compact spacing */
                    [data-radix-dialog-content] .space-y-3 > * + * {
                        margin-top: 12px !important;
                    }
                    
                    /* Kurangi padding untuk header */
                    [data-radix-dialog-content] h2 {
                        margin-bottom: 8px !important;
                    }
                }
                
                /* Fix for Radix Select dropdown positioning */
                [data-radix-popper-content-wrapper] {
                    z-index: 9999 !important;
                }
            `}</style>
        </section>
    );
}