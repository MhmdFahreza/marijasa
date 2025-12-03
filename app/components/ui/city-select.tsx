"use client";

import * as React from "react";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/app/components/ui/select";

type CitySelectProps = {
    value?: string;
    onValueChange?: (v: string) => void;
    placeholder?: string;
    triggerClassName?: string;
    cities: string[];
};

// Batasi jumlah kota yang ditampilkan di awal
const INITIAL_DISPLAY_LIMIT = 30;

export default function CitySelect({
    value,
    onValueChange,
    placeholder = "Kota",
    triggerClassName,
    cities,
}: CitySelectProps) {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [displayCount, setDisplayCount] = React.useState(INITIAL_DISPLAY_LIMIT);
    const searchInputRef = React.useRef<HTMLInputElement>(null);
    
    // Urutkan kota sekali saja
    const sortedCities = React.useMemo(() => {
        return [...cities].sort((a, b) => a.localeCompare(b));
    }, [cities]);
    
    // Filter kota berdasarkan pencarian
    const filteredCities = React.useMemo(() => {
        if (!searchQuery.trim()) {
            return sortedCities;
        }
        
        const query = searchQuery.toLowerCase();
        return sortedCities.filter(city => 
            city.toLowerCase().includes(query)
        );
    }, [searchQuery, sortedCities]);
    
    // Kelompokkan kota berdasarkan huruf pertama (hanya untuk data yang ditampilkan)
    const displayedCities = React.useMemo(() => {
        const citiesToDisplay = filteredCities.slice(0, displayCount);
        const groups: { letter: string; cities: string[] }[] = [];
        let currentGroup: { letter: string; cities: string[] } | null = null;
        
        for (const city of citiesToDisplay) {
            const firstLetter = city.charAt(0).toUpperCase();
            
            if (!currentGroup || currentGroup.letter !== firstLetter) {
                currentGroup = { letter: firstLetter, cities: [] };
                groups.push(currentGroup);
            }
            
            currentGroup.cities.push(city);
        }
        
        return groups;
    }, [filteredCities, displayCount]);
    
    // Reset display count saat pencarian berubah
    React.useEffect(() => {
        setDisplayCount(INITIAL_DISPLAY_LIMIT);
    }, [searchQuery]);
    
    // Auto focus ke search input saat dropdown dibuka
    const handleOpenChange = React.useCallback((open: boolean) => {
        if (open && searchInputRef.current) {
            // Delay sedikit agar dropdown benar-benar terbuka
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
        }
    }, []);
    
    // Load lebih banyak kota saat scroll
    const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
        
        if (isAtBottom && displayCount < filteredCities.length) {
            setDisplayCount(prev => Math.min(prev + 30, filteredCities.length));
        }
    }, [displayCount, filteredCities.length]);
    
    return (
        <Select value={value} onValueChange={onValueChange} onOpenChange={handleOpenChange}>
            <SelectTrigger
                className={["h-12 rounded-xl px-4 text-base w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8] transition-all duration-200", triggerClassName]
                    .filter(Boolean)
                    .join(" ")}
                aria-label="Pilih kota"
            >
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            
            <SelectContent
                className="w-[min(90vw,680px)] p-0 max-h-[50vh]"
                align="start"
                position="popper"
                sideOffset={4}
            >
                {/* Search Bar */}
                <div className="sticky top-0 z-10 bg-popover p-3 border-b">
                    <div className="relative">
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari kota..."
                            className="w-full h-10 rounded-lg border px-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-[#7CE0A8]/50 focus:border-[#7CE0A8] transition-all duration-200"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <svg
                            aria-hidden
                            viewBox="0 0 24 24"
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60"
                        >
                            <path
                                d="M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                </div>
                
                {/* Cities List */}
                <div 
                    className="overflow-y-auto max-h-[calc(50vh-60px)]"
                    onScroll={handleScroll}
                >
                    {displayedCities.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            {searchQuery.trim() 
                                ? "Kota tidak ditemukan. Coba kata kunci lain." 
                                : "Tidak ada kota tersedia."}
                        </div>
                    ) : (
                        <div className="p-3">
                            {displayedCities.map((group) => (
                                <div key={group.letter} className="mb-4 last:mb-0">
                                    <div className="px-2 pb-2 mb-2 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-popover">
                                        {group.letter}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1">
                                        {group.cities.map((city) => (
                                            <SelectItem 
                                                key={city} 
                                                value={city}
                                                className="px-2 py-2 text-sm hover:bg-accent rounded-md transition-colors duration-150"
                                            >
                                                {city}
                                            </SelectItem>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            
                            {/* Loading indicator atau tombol load more */}
                            {displayCount < filteredCities.length && (
                                <div className="text-center py-3">
                                    <div className="inline-flex items-center justify-center text-xs text-muted-foreground animate-pulse">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                        Scroll untuk melihat lebih banyak
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </SelectContent>
        </Select>
    );
}