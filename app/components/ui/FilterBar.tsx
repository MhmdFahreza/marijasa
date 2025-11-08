"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

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

const LABELS = {
    kategori: {
        listrik: "Tukang Listrik",
        ac: "Paket Service AC",
        pembersihanrumah: "Pembersihan Rumah",
        ledeng: "Tukang Ledeng/Pipa",
        sedotwc: "Sedot WC",
        kebun: "Tukang Kebun",
        furnitur: "Mebel/Furnitur",
    } as Record<string, string>,
    rating: {
        "5": "Rating: Bintang 5",
        "4.5+": "Rating: 4.5+",
        "4+": "Rating: 4.0+",
        "3+": "Rating: 3.0+",
        "2+": "Rating: 2.0+",
        "1+": "Rating: 1.0+",
    } as Record<string, string>,
    urutkan: {
        terbaru: "Urutkan: Terbaru",
        terdekat: "Urutkan: Terdekat",
        termurah: "Urutkan: Termurah",
        rating: "Urutkan: Rating Tertinggi",
    } as Record<string, string>,
};

export default function FilterBar() {
    const [kategori, setKategori] = useState<string>("");
    const [kota, setKota] = useState<string>("");
    const [rating, setRating] = useState<string>("");
    const [urutkan, setUrutkan] = useState<string>("");


    const placeholders = [
        "Cari jasa kebersihan rumah",
        "Teknisi AC terdekat",
        "Tukang listrik 24 jam",
        "Jasa Pindahan",
        "Jasa perbaikan atap bocor",
    ];
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log("query:", e.target.value);
    };
    const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log("submitted search");
    };
    const [resetTick, setResetTick] = useState(0);

    const resetAll = () => {
        setKategori("");
        setKota("");
        setRating("");
        setUrutkan("");
        setResetTick(t => t + 1);   // jaga-jaga kalau ada komponen bandel
    };

    const activeChips = useMemo(() => {
        const chips: { key: "kategori" | "kota" | "rating" | "urutkan"; label: string }[] = [];
        if (kategori) chips.push({ key: "kategori", label: LABELS.kategori[kategori] ?? kategori });
        if (kota) chips.push({ key: "kota", label: kota });
        if (rating) chips.push({ key: "rating", label: LABELS.rating[rating] ?? `Rating: ${rating}` });
        if (urutkan) chips.push({ key: "urutkan", label: LABELS.urutkan[urutkan] ?? urutkan });
        return chips;
    }, [kategori, kota, rating, urutkan]);

    const removeChip = (key: "kategori" | "kota" | "rating" | "urutkan") => {
        if (key === "kategori") setKategori("");
        if (key === "kota") setKota("");
        if (key === "rating") setRating("");
        if (key === "urutkan") setUrutkan("");
    };


    const Chips = () =>
        activeChips.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
                {activeChips.map(chip => (
                    <span
                        key={chip.key}
                        className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1
                        text-secondary-foreground text-sm ring-1 ring-border hover:bg-secondary/90"
                    >
                        {chip.label}
                        <button
                            type="button"
                            aria-label={`Hapus ${chip.label}`}
                            onClick={() => removeChip(chip.key)}
                            className="grid place-items-center rounded-full p-0.5
               hover:bg-primary-foreground/20 focus-visible:outline-none"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </span>
                ))}
            </div>
        ) : null;

    return (
        <section aria-label="Filter jasa" className="mt-4 mb-6">
            {/* DESKTOP/TABLET */}
            <div className="hidden sm:grid sm:grid-cols-12 items-center gap-2 sm:gap-3">
                <div className="sm:col-span-2">
                    <Select
                        key={`m-kategori-${kategori ?? "none"}`}
                        value={kategori}
                        onValueChange={setKategori}
                    >
                        <SelectTrigger className="h-11 rounded-xl px-4 text-base w-full">
                            <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="listrik">Tukang Listrik</SelectItem>
                            <SelectItem value="ac">Paket Service AC</SelectItem>
                            <SelectItem value="pembersihanrumah">Pembersihan Rumah</SelectItem>
                            <SelectItem value="ledeng">Tukang Ledeng/Pipa</SelectItem>
                            <SelectItem value="sedotwc">Sedot WC</SelectItem>
                            <SelectItem value="kebun">Tukang Kebun</SelectItem>
                            <SelectItem value="furnitur">Mebel/Furnitur</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="sm:col-span-2">
                    <CitySelect
                        key={`m-kota-${kota ?? "none"}`}
                        value={kota}
                        onValueChange={setKota}
                        cities={CITIES_ID}
                        placeholder="Pilih kota"
                        triggerClassName="h-11 rounded-xl px-4 text-base w-full"
                    />
                </div>

                <div className="sm:col-span-2">
                    <Select
                        key={`m-rating-${rating ?? "none"}`}
                        value={rating}
                        onValueChange={setRating}
                    >
                        <SelectTrigger className="h-11 rounded-xl px-4 text-base w-full">
                            <SelectValue placeholder="Pilih rating" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">⭐ 5</SelectItem>
                            <SelectItem value="4+">⭐ 4.0 +</SelectItem>
                            <SelectItem value="3+">⭐ 3.0 +</SelectItem>
                            <SelectItem value="2+">⭐ 2.0 +</SelectItem>
                            <SelectItem value="1+">⭐ 1.0 +</SelectItem>
                            <SelectItem value="semuarating">Semua Rating</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="sm:col-span-4">
                    <PlaceholdersAndVanishInput
                        placeholders={placeholders}
                        onChange={handleSearchChange}
                        onSubmit={handleSearchSubmit}
                        className="h-12 rounded-xl border border-input bg-background text-foreground shadow-none w-full"
                        inputClassName="pl-4 pr-10 text-sm sm:text-base"
                        buttonClassName="h-8 w-8 rounded-md bg-muted/70 hover:bg-muted disabled:bg-muted"
                    />
                </div>

                <div className="sm:col-span-2">
                    <Select
                        key={`m-urutkan-${urutkan ?? "none"}`}
                        value={urutkan}
                        onValueChange={setUrutkan}
                    >
                        <SelectTrigger className="h-11 rounded-xl px-4 text-base w-full">
                            <SelectValue placeholder="Urutkan" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="terbaru">Terbaru</SelectItem>
                            <SelectItem value="terdekat">Terdekat</SelectItem>
                            <SelectItem value="rating">Rating Tertinggi</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Chips desktop/tablet tetap di bawah bar */}
            <div className="hidden sm:block">
                <Chips />
            </div>

            {/* MOBILE */}
            <div className="sm:hidden mt-2 flex items-center gap-2">
                <div className="flex-1">
                    <PlaceholdersAndVanishInput
                        placeholders={placeholders}
                        onChange={handleSearchChange}
                        onSubmit={handleSearchSubmit}
                        className="h-11 rounded-xl border border-input bg-background text-foreground shadow-none"
                        inputClassName="pl-3 pr-9 text-sm"
                        buttonClassName="h-7 w-7 rounded-md bg-muted/70 hover:bg-muted disabled:bg-muted"
                    />
                </div>

                <Sheet>
                    <SheetTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 rounded-xl p-0"
                            aria-label="Buka filter"
                            title="Filter"
                        >
                            <SlidersHorizontal className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>

                    <SheetContent side="bottom" className="max-h:[85vh] rounded-t-2xl p-4">
                        <SheetHeader>
                            <SheetTitle>Filter</SheetTitle>
                        </SheetHeader>

                        <div className="mt-3 space-y-4 overflow-y-auto">
                            <div className="space-y-2">
                                <div className="text-sm font-medium">Kategori</div>
                                <Select
                                    key={`m-kategori-${kategori}-${resetTick}`}
                                    value={kategori}
                                    onValueChange={setKategori}
                                >
                                    <SelectTrigger className="h-11 rounded-xl px-4 text-base w-full">
                                        <SelectValue placeholder="Pilih kategori" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="listrik">Tukang Listrik</SelectItem>
                                        <SelectItem value="ac">Paket Service AC</SelectItem>
                                        <SelectItem value="pembersihanrumah">Pembersihan Rumah</SelectItem>
                                        <SelectItem value="ledeng">Tukang Ledeng/Pipa</SelectItem>
                                        <SelectItem value="sedotwc">Sedot WC</SelectItem>
                                        <SelectItem value="kebun">Tukang Kebun</SelectItem>
                                        <SelectItem value="furnitur">Mebel/Furnitur</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <div className="text-sm font-medium">Lokasi</div>
                                <CitySelect
                                    key={`m-kota-${kota}-${resetTick}`}
                                    value={kota}                          // penting: controlled pakai ""
                                    onValueChange={setKota}
                                    cities={CITIES_ID}
                                    placeholder="Pilih kota"
                                    triggerClassName="h-11 rounded-xl px-4 text-base w-full"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="text-sm font-medium">Rating</div>
                                <Select
                                    key={`m-rating-${rating}-${resetTick}`}
                                    value={rating}
                                    onValueChange={setRating}
                                >
                                    <SelectTrigger className="h-11 rounded-xl px-4 text-base w-full">
                                        <SelectValue placeholder="Pilih rating" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">⭐ 5</SelectItem>
                                        <SelectItem value="4+">⭐ 4.0 +</SelectItem>
                                        <SelectItem value="3+">⭐ 3.0 +</SelectItem>
                                        <SelectItem value="2+">⭐ 2.0 +</SelectItem>
                                        <SelectItem value="1+">⭐ 1.0 +</SelectItem>
                                        <SelectItem value="semuarating">Semua Rating</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <div className="text-sm font-medium">Urutkan</div>
                                <Select
                                    key={`m-urutkan-${urutkan}-${resetTick}`}
                                    value={urutkan}
                                    onValueChange={setUrutkan}
                                >
                                    <SelectTrigger className="h-11 rounded-xl px-4 text-base w-full">
                                        <SelectValue placeholder="Urutkan" /> {/* benerin placeholder yang sebelumnya salah */}
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="terbaru">Terbaru</SelectItem>
                                        <SelectItem value="terdekat">Terdekat</SelectItem>
                                        <SelectItem value="rating">Rating Tertinggi</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Sesuai request: Sheet tetap punya Reset */}
                        <SheetFooter className="mt-4 gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-11 rounded-xl flex-1"
                                onClick={resetAll}
                            >
                                Reset
                            </Button>
                            <SheetClose asChild>
                                <Button type="button" className="h-11 rounded-xl flex-1">
                                    Simpan
                                </Button>
                            </SheetClose>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Chips mobile: di bawah search */}
            <div className="sm:hidden">
                <Chips />
            </div>
        </section>
    );
}
