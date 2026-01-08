// app/components/ui/city-select.tsx
"use client";

import * as React from "react";
import { X } from "lucide-react";
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
    contentClassName?: string;
    avoidCollisions?: boolean;
};

const INITIAL_DISPLAY_LIMIT = 100;

export default function CitySelect({
    value,
    onValueChange,
    placeholder = "Kota",
    triggerClassName,
    cities,
    contentClassName,
    avoidCollisions = true,
}: CitySelectProps) {
    const [displayCount, setDisplayCount] = React.useState(INITIAL_DISPLAY_LIMIT);
    const [isMobile, setIsMobile] = React.useState(false);
    const [isOpen, setIsOpen] = React.useState(false);

    // Detect mobile screen size
    React.useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Reset when dropdown is closed
    React.useEffect(() => {
        if (!isOpen) {
            setDisplayCount(INITIAL_DISPLAY_LIMIT);
        }
    }, [isOpen]);

    // Handle open change
    const handleOpenChange = React.useCallback((open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setDisplayCount(INITIAL_DISPLAY_LIMIT);
        }
    }, []);

    // Sort cities alphabetically
    const sortedCities = React.useMemo(() => {
        return [...cities].sort((a, b) => a.localeCompare(b));
    }, [cities]);

    // Group cities by first letter
    const displayedCities = React.useMemo(() => {
        const citiesToDisplay = sortedCities.slice(0, displayCount);
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
    }, [sortedCities, displayCount]);

    // Load more cities when scrolling down
    const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;

        if (isAtBottom && displayCount < sortedCities.length) {
            setDisplayCount((prev) => Math.min(prev + 100, sortedCities.length));
        }
    }, [displayCount, sortedCities.length]);

    // Handle selecting a city - instant update
    const handleSelectCity = React.useCallback((city: string) => {
        if (onValueChange) {
            // Close immediately for instant feel
            setIsOpen(false);
            // Update value
            onValueChange(city);
        }
    }, [onValueChange]);

    const getListHeight = React.useCallback(() => {
        if (!isMobile) return "400px";
        return "calc(80vh - 120px)";
    }, [isMobile]);

    return (
        <Select
            value={value}
            onValueChange={onValueChange}
            onOpenChange={handleOpenChange}
            open={isOpen}
        >
            <SelectTrigger
                className={`h-12 rounded-xl px-4 text-base w-full focus:ring-[#7CE0A8] focus:border-[#7CE0A8] transition-all duration-200 ${triggerClassName || ""}`}
                aria-label="Pilih kota"
                onClick={() => setIsOpen(true)}
            >
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>

            <SelectContent
                className={`${contentClassName || ""} ${isMobile ? "z-[9999]" : ""}`}
                align="start"
                position="popper"
                sideOffset={isMobile ? 0 : 4}
                avoidCollisions={avoidCollisions}
                style={
                    isMobile
                        ? {
                              width: "calc(100vw - 32px)",
                              maxWidth: "calc(100vw - 32px)",
                              left: "16px",
                              right: "16px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              maxHeight: "80vh",
                              zIndex: 9999,
                              overflow: "hidden",
                          }
                        : {}
                }
            >
                {/* Title untuk mobile */}
                {isMobile && (
                    <div className="sticky top-0 z-10 bg-popover p-3 border-b">
                        <div className="flex items-center justify-between">
                            <div className="text-lg font-semibold">Pilih Kota</div>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Cities List */}
                <div
                    className="overflow-y-auto"
                    style={{
                        maxHeight: getListHeight(),
                    }}
                    onScroll={handleScroll}
                >
                    {displayedCities.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            Tidak ada kota tersedia.
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
                                                className="px-2 py-2 text-sm hover:bg-accent rounded-md transition-colors duration-150 select-none cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectCity(city);
                                                }}
                                            >
                                                {city}
                                            </SelectItem>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {/* Loading indicator */}
                            {displayCount < sortedCities.length && (
                                <div className="text-center py-3">
                                    <div className="inline-flex items-center justify-center text-xs text-muted-foreground">
                                        <svg className="w-4 h-4 mr-2 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                        Scroll untuk lebih banyak
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