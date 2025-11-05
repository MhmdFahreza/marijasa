"use client";

import * as React from "react";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    SelectLabel,
    SelectSeparator,
    SelectGroup,
} from "@/app/components/ui/select";

type CitySelectProps = {
    value?: string;
    onValueChange?: (v: string) => void;
    placeholder?: string;
    triggerClassName?: string;
    cities: string[]; // list A–Z dari data/cities-id
};

/**
 * CitySelect
 * - Search di bagian atas dropdown
 * - Daftar kota dikelompokkan alfabet A–Z
 * - Navigasi keyboard tetap works (Radix Select)
 */
export default function CitySelect({
    value,
    onValueChange,
    placeholder = "Kota",
    triggerClassName,
    cities,
}: CitySelectProps) {
    const [query, setQuery] = React.useState("");

    const norm = (s: string) =>
        s
            .toLowerCase()
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "");

    const filtered = React.useMemo(() => {
        if (!query) return cities;
        const q = norm(query);
        return cities.filter((c) => norm(c).includes(q));
    }, [cities, query]);

    // group by first letter (A–Z). Other goes to "#"
    const grouped = React.useMemo(() => {
        const map = new Map<string, string[]>();
        for (const c of filtered) {
            const letter = /^[a-z]/i.test(c[0]) ? c[0].toUpperCase() : "#";
            if (!map.has(letter)) map.set(letter, []);
            map.get(letter)!.push(c);
        }
        // sort letters A–Z, then items inside each letter
        return Array.from(map.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([k, list]) => [k, list.sort((x, y) => x.localeCompare(y))] as const);
    }, [filtered]);

    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger
                className={["h-12 rounded-xl px-4 text-base w-full", triggerClassName]
                    .filter(Boolean)
                    .join(" ")}
                aria-label="Pilih kota"
            >
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>

            {/* Konten dropdown ala Sejasa */}
            <SelectContent
                // Lebar lebih lega + tinggi maksimum seperti modal list
                className="w-[min(90vw,680px)] p-0"
                align="start"
                position="popper"
            >
                {/* Header: search */}
                <div className="sticky top-0 z-10 bg-popover/95 backdrop-blur supports-[backdrop-filter]:bg-popover/70 p-3 border-b">
                    <div className="relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Cari kota"
                            className="w-full h-10 rounded-lg border px-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-ring/50"
                            // biar scroll wheel di input tidak menutup select
                            onKeyDown={(e) => e.stopPropagation()}
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

                <div className="max-h-[60vh] overflow-y-auto p-3">
                    {grouped.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            Nggak ketemu. Coba kata kunci lain.
                        </div>
                    ) : (
                        grouped.map(([letter, list]) => (
                            <SelectGroup key={letter}>                       { }
                                <SelectLabel className="px-1.5 pb-2 text-[11px] font-semibold text-muted-foreground/90">
                                    {letter}
                                </SelectLabel>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1">
                                    {list.map((city) => (
                                        <SelectItem
                                            key={city}
                                            value={city}
                                            className="rounded-md px-2 py-2 text-sm hover:bg-accent"
                                        >
                                            {city}
                                        </SelectItem>
                                    ))}
                                </div>

                                <SelectSeparator className="my-2" />
                            </SelectGroup>
                        ))
                    )}
                </div>
            </SelectContent>
        </Select>
    );
}
