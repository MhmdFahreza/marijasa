"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/app/components/ui/breadcrumb";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Checkbox } from "@/app/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Vendors } from "@/app/data/dataVendor";
import SiteFooter from "@/app/footer";
import { LoaderTwo } from "@/app/components/transition/loader";
import { Calendar, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";

function getServiceCategory(tags: string[]): string {
    const firstTag = tags[0]?.toLowerCase() || "";

    if (firstTag.includes("ac")) return "ac";
    if (firstTag.includes("listrik")) return "listrik";
    if (firstTag.includes("pembersihan") || firstTag.includes("cleaning")) return "cleaning";
    if (firstTag.includes("ledeng") || firstTag.includes("pipa")) return "plumbing";
    if (firstTag.includes("sedot")) return "sedot-wc";
    if (firstTag.includes("kebun") || firstTag.includes("taman")) return "taman";
    if (firstTag.includes("mebel") || firstTag.includes("furnitur")) return "furniture";
    if (firstTag.includes("interior")) return "interior";
    if (firstTag.includes("ventilasi") || firstTag.includes("exhaust")) return "ventilasi";
    if (firstTag.includes("atap")) return "atap";
    if (firstTag.includes("kaca")) return "kaca-film";
    if (firstTag.includes("cctv") || firstTag.includes("smart")) return "cctv";

    return "general";
}

export default function VendorFormPage() {
    const params = useParams();
    const router = useRouter();
    const prefersReduced = useReducedMotion();
    const [leaving, setLeaving] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);
    if (!mounted) {
        return null;
    }

    const vendorId = params.vendorId as string;
    const vendor = Vendors.find((v) => v.id === vendorId);

    const handleNavigation = async (path: string) => {
        setLeaving(true);
        await new Promise((r) => setTimeout(r, prefersReduced ? 0 : 220));
        router.push(path);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Form submitted:", formData);
        alert("Pesanan berhasil dikirim! Kami akan menghubungi Anda segera.");
    };

    if (!vendor) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Vendor Tidak Ditemukan</h1>
                    <Button onClick={() => handleNavigation("/jasa")}>Kembali ke Daftar Jasa</Button>
                </div>
            </div>
        );
    }

    const serviceCategory = getServiceCategory(vendor.tags);

    return (
        <>
            <motion.main
                className="min-h-screen w-full max-w-4xl mx-auto px-4 py-6"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: prefersReduced ? 0 : 0.25, ease: "easeOut" }}
                suppressHydrationWarning
            >
                {/* Breadcrumb */}
                <div className="mb-6">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <motion.span whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                                        <Link href="/" onClick={(e) => { e.preventDefault(); handleNavigation("/"); }}>
                                            Home
                                        </Link>
                                    </motion.span>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <motion.span whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                                        <Link href="/jasa" onClick={(e) => { e.preventDefault(); handleNavigation("/jasa"); }}>
                                            Jasa
                                        </Link>
                                    </motion.span>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <motion.span whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                                        <Link
                                            href={`/jasa/detailjasa/${vendorId}`}
                                            onClick={(e) => { e.preventDefault(); handleNavigation(`/jasa/detailjasa/${vendorId}`); }}
                                        >
                                            {vendor.name}
                                        </Link>
                                    </motion.span>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Form Pemesanan</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                {/* Vendor Info */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={vendor.avatar ?? ""} alt={vendor.name} />
                                <AvatarFallback>
                                    {vendor.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="text-xl font-bold">{vendor.name}</h2>
                                <p className="text-sm text-muted-foreground">{vendor.tags.join(" • ")}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Form Pemesanan Layanan</CardTitle>
                        <CardDescription>
                            Lengkapi formulir di bawah untuk memesan layanan {vendor.tags[0]}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6" suppressHydrationWarning>
                            {/* Data Pelanggan - Umum untuk semua */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Data Pelanggan
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nama Lengkap *</Label>
                                        <Input
                                            id="name"
                                            placeholder="Masukkan nama lengkap"
                                            required
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone">No. Telepon *</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="08xxxxxxxxxx"
                                            required
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="email@example.com"
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="gpsLocation">Lokasi GPS *</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="gpsLocation"
                                            placeholder="Contoh: -6.200000, 106.816666 atau link Google Maps"
                                            required
                                            onChange={(e) => setFormData({ ...formData, gpsLocation: e.target.value })}
                                            className="flex-1"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                if (navigator.geolocation) {
                                                    navigator.geolocation.getCurrentPosition(
                                                        (position) => {
                                                            const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
                                                            setFormData({ ...formData, gpsLocation: coords });
                                                            const input = document.getElementById('gpsLocation') as HTMLInputElement;
                                                            if (input) input.value = coords;
                                                        },
                                                        (error) => {
                                                            alert('Tidak dapat mengakses lokasi. Pastikan izin lokasi diaktifkan.');
                                                        }
                                                    );
                                                } else {
                                                    alert('Browser Anda tidak mendukung GPS');
                                                }
                                            }}
                                        >
                                            📍 Gunakan Lokasi Saya
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Wajib diisi untuk memastikan vendor menemukan lokasi Anda dengan tepat
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address">Alamat Lengkap *</Label>
                                    <Textarea
                                        id="address"
                                        placeholder="Masukkan alamat lengkap termasuk nomor rumah, RT/RW, kelurahan, kecamatan"
                                        rows={3}
                                        required
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Form Spesifik berdasarkan Kategori */}
                            <ServiceSpecificForm
                                category={serviceCategory}
                                formData={formData}
                                setFormData={setFormData}
                            />

                            {/* Jadwal */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Jadwal Layanan
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="date">Tanggal Pengerjaan *</Label>
                                        <Input
                                            id="date"
                                            type="date"
                                            required
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="time">Waktu Pengerjaan *</Label>
                                        <Select onValueChange={(value) => setFormData({ ...formData, time: value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih waktu" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="08:00-10:00">08:00 - 10:00</SelectItem>
                                                <SelectItem value="10:00-12:00">10:00 - 12:00</SelectItem>
                                                <SelectItem value="13:00-15:00">13:00 - 15:00</SelectItem>
                                                <SelectItem value="15:00-17:00">15:00 - 17:00</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Catatan Tambahan */}
                            <div className="space-y-2">
                                <Label htmlFor="notes">Catatan Tambahan</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Informasi tambahan yang perlu diketahui vendor..."
                                    rows={4}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => handleNavigation(`/jasa/detailjasa/${vendorId}`)}
                                >
                                    Batal
                                </Button>
                                <Button type="submit" className="flex-1">
                                    Kirim Pesanan
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div className="mt-10">
                    <SiteFooter />
                </div>
            </motion.main>

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

// Component untuk form spesifik berdasarkan kategori
function ServiceSpecificForm({
    category,
    formData,
    setFormData
}: {
    category: string;
    formData: any;
    setFormData: (data: any) => void;
}) {
    switch (category) {
        case "ac":
            return <ACServiceForm formData={formData} setFormData={setFormData} />;
        case "listrik":
            return <ElectricalServiceForm formData={formData} setFormData={setFormData} />;
        case "cleaning":
            return <CleaningServiceForm formData={formData} setFormData={setFormData} />;
        case "plumbing":
            return <PlumbingServiceForm formData={formData} setFormData={setFormData} />;
        case "sedot-wc":
            return <SedotWCServiceForm formData={formData} setFormData={setFormData} />;
        case "taman":
            return <GardenServiceForm formData={formData} setFormData={setFormData} />;
        case "furniture":
            return <FurnitureServiceForm formData={formData} setFormData={setFormData} />;
        case "interior":
            return <InteriorServiceForm formData={formData} setFormData={setFormData} />;
        case "ventilasi":
            return <VentilationServiceForm formData={formData} setFormData={setFormData} />;
        case "atap":
            return <RoofServiceForm formData={formData} setFormData={setFormData} />;
        case "kaca-film":
            return <WindowFilmServiceForm formData={formData} setFormData={setFormData} />;
        case "cctv":
            return <CCTVServiceForm formData={formData} setFormData={setFormData} />;
        default:
            return <GeneralServiceForm formData={formData} setFormData={setFormData} />;
    }
}

// Form Layanan AC
function ACServiceForm({ formData, setFormData }: any) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detail Layanan AC</h3>

            <div className="space-y-2">
                <Label>Jenis Layanan *</Label>
                <RadioGroup onValueChange={(value) => setFormData({ ...formData, serviceType: value })}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="instalasi" id="instalasi" />
                        <Label htmlFor="instalasi">Instalasi AC Baru</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="service" id="service" />
                        <Label htmlFor="service">Service/Perbaikan</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cuci" id="cuci" />
                        <Label htmlFor="cuci">Cuci AC</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="bongkar" id="bongkar" />
                        <Label htmlFor="bongkar">Bongkar Pasang</Label>
                    </div>
                </RadioGroup>
            </div>

            <div className="space-y-2">
                <Label htmlFor="acType">Tipe AC *</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, acType: value })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih tipe AC" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="split">Split</SelectItem>
                        <SelectItem value="cassette">Cassette</SelectItem>
                        <SelectItem value="standing">Standing/Floor</SelectItem>
                        <SelectItem value="central">Central</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="acCount">Jumlah Unit *</Label>
                <Input
                    id="acCount"
                    type="number"
                    min="1"
                    placeholder="Jumlah unit AC"
                    onChange={(e) => setFormData({ ...formData, acCount: e.target.value })}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="acPk">Kapasitas (PK) *</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, acPk: value })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih kapasitas" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="0.5">0.5 PK</SelectItem>
                        <SelectItem value="0.75">0.75 PK</SelectItem>
                        <SelectItem value="1">1 PK</SelectItem>
                        <SelectItem value="1.5">1.5 PK</SelectItem>
                        <SelectItem value="2">2 PK</SelectItem>
                        <SelectItem value="2.5">2.5 PK</SelectItem>
                        <SelectItem value="3">3 PK</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

// Form Layanan Listrik
function ElectricalServiceForm({ formData, setFormData }: any) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detail Layanan Listrik</h3>

            <div className="space-y-2">
                <Label>Jenis Pekerjaan *</Label>
                <div className="space-y-2">
                    {["Instalasi Baru", "Perbaikan", "Penambahan Titik Listrik", "Pemasangan Panel", "Ganti MCB"].map((item) => (
                        <div key={item} className="flex items-center space-x-2">
                            <Checkbox
                                id={item.toLowerCase().replace(/\s/g, "-")}
                                onCheckedChange={(checked) => {
                                    const current = formData.electricalWork || [];
                                    if (checked) {
                                        setFormData({ ...formData, electricalWork: [...current, item] });
                                    } else {
                                        setFormData({ ...formData, electricalWork: current.filter((i: string) => i !== item) });
                                    }
                                }}
                            />
                            <Label htmlFor={item.toLowerCase().replace(/\s/g, "-")}>{item}</Label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="buildingType">Tipe Bangunan *</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, buildingType: value })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih tipe bangunan" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="rumah">Rumah Tinggal</SelectItem>
                        <SelectItem value="ruko">Ruko</SelectItem>
                        <SelectItem value="kantor">Kantor</SelectItem>
                        <SelectItem value="gudang">Gudang</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="powerCapacity">Daya Listrik Rumah *</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, powerCapacity: value })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih daya" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="900">900 VA</SelectItem>
                        <SelectItem value="1300">1300 VA</SelectItem>
                        <SelectItem value="2200">2200 VA</SelectItem>
                        <SelectItem value="3500">3500 VA</SelectItem>
                        <SelectItem value="5500">5500 VA</SelectItem>
                        <SelectItem value="7700">7700 VA</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

// Form Layanan Cleaning
function CleaningServiceForm({ formData, setFormData }: any) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detail Layanan Pembersihan</h3>

            <div className="space-y-2">
                <Label>Jenis Layanan *</Label>
                <RadioGroup onValueChange={(value) => setFormData({ ...formData, cleaningType: value })}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="general" id="general" />
                        <Label htmlFor="general">General Cleaning</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="deep" id="deep" />
                        <Label htmlFor="deep">Deep Cleaning</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="post-reno" id="post-reno" />
                        <Label htmlFor="post-reno">Post Renovasi</Label>
                    </div>
                </RadioGroup>
            </div>

            <div className="space-y-2">
                <Label htmlFor="propertyType">Tipe Properti *</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, propertyType: value })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih tipe properti" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="apartment">Apartemen</SelectItem>
                        <SelectItem value="house">Rumah</SelectItem>
                        <SelectItem value="office">Kantor</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="areaSize">Luas Area (m²) *</Label>
                <Input
                    id="areaSize"
                    type="number"
                    placeholder="Contoh: 50"
                    onChange={(e) => setFormData({ ...formData, areaSize: e.target.value })}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="rooms">Jumlah Ruangan *</Label>
                <Input
                    id="rooms"
                    type="number"
                    placeholder="Jumlah ruangan"
                    onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
                />
            </div>

            <div className="space-y-2">
                <Label>Area yang Dibersihkan</Label>
                {["Kamar Tidur", "Kamar Mandi", "Ruang Tamu", "Dapur", "Balkon"].map((area) => (
                    <div key={area} className="flex items-center space-x-2">
                        <Checkbox id={area.toLowerCase().replace(/\s/g, "-")} />
                        <Label htmlFor={area.toLowerCase().replace(/\s/g, "-")}>{area}</Label>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Form Layanan Plumbing
function PlumbingServiceForm({ formData, setFormData }: any) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detail Layanan Ledeng/Pipa</h3>

            <div className="space-y-2">
                <Label>Jenis Masalah *</Label>
                <div className="space-y-2">
                    {["Kebocoran Pipa", "Saluran Mampet", "Instalasi Baru", "Ganti Wastafel/Kloset", "Pompa Air"].map((item) => (
                        <div key={item} className="flex items-center space-x-2">
                            <Checkbox
                                id={item.toLowerCase().replace(/\s/g, "-")}
                                onCheckedChange={(checked) => {
                                    const current = formData.plumbingIssues || [];
                                    if (checked) {
                                        setFormData({ ...formData, plumbingIssues: [...current, item] });
                                    } else {
                                        setFormData({ ...formData, plumbingIssues: current.filter((i: string) => i !== item) });
                                    }
                                }}
                            />
                            <Label htmlFor={item.toLowerCase().replace(/\s/g, "-")}>{item}</Label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="urgency">Tingkat Urgensi *</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, urgency: value })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih urgensi" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="emergency">Darurat (dalam 24 jam)</SelectItem>
                        <SelectItem value="urgent">Mendesak (1-2 hari)</SelectItem>
                        <SelectItem value="normal">Normal (3-5 hari)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

// Form Sedot WC
function SedotWCServiceForm({ formData, setFormData }: any) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detail Layanan Sedot WC</h3>

            <div className="space-y-2">
                <Label htmlFor="wcCount">Jumlah WC/Septic Tank *</Label>
                <Input
                    id="wcCount"
                    type="number"
                    min="1"
                    placeholder="Jumlah WC"
                    onChange={(e) => setFormData({ ...formData, wcCount: e.target.value })}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="tankType">Tipe Septic Tank *</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, tankType: value })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih tipe" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="biotech">Biotech</SelectItem>
                        <SelectItem value="traditional">Konvensional</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="accessibility">Akses Truk *</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, accessibility: value })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih kondisi akses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="easy">Mudah (langsung ke lokasi)</SelectItem>
                        <SelectItem value="moderate">Sedang (perlu selang tambahan)</SelectItem>
                        <SelectItem value="difficult">Sulit (gang sempit)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

// Form Taman
function GardenServiceForm({ formData, setFormData }: any) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detail Layanan Taman</h3>

            <div className="space-y-2">
                <Label>Jenis Layanan *</Label>
                <div className="space-y-2">
                    {["Pembuatan Taman Baru", "Perawatan Rutin", "Pemangkasan", "Vertical Garden", "Landscape Design"].map((item) => (
                        <div key={item} className="flex items-center space-x-2">
                            <Checkbox
                                id={item.toLowerCase().replace(/\s/g, "-")}
                                onCheckedChange={(checked) => {
                                    const current = formData.gardenServices || [];
                                    if (checked) {
                                        setFormData({ ...formData, gardenServices: [...current, item] });
                                    } else {
                                        setFormData({ ...formData, gardenServices: current.filter((i: string) => i !== item) });
                                    }
                                }}
                            />
                            <Label htmlFor={item.toLowerCase().replace(/\s/g, "-")}>{item}</Label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="gardenSize">Luas Taman (m²) *</Label>
                <Input
                    id="gardenSize"
                    type="number"
                    placeholder="Luas area taman"
                    onChange={(e) => setFormData({ ...formData, gardenSize: e.target.value })}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="gardenStyle">Gaya Taman *</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, gardenStyle: value })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih gaya taman" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="minimalis">Minimalis</SelectItem>
                        <SelectItem value="tropis">Tropis</SelectItem>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="natural">Natural</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

// Form Furniture
function FurnitureServiceForm({ formData, setFormData }: any) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detail Pesanan Furniture</h3>

            <div className="space-y-2">
                <Label>Jenis Furniture *</Label>
                <div className="space-y-2">
                    {["Lemari", "Kitchen Set", "Rak TV", "Meja Kerja", "Tempat Tidur", "Rak Buku"].map((item) => (
                        <div key={item} className="flex items-center space-x-2">
                            <Checkbox
                                id={item.toLowerCase().replace(/\s/g, "-")}
                                onCheckedChange={(checked) => {
                                    const current = formData.furnitureTypes || [];
                                    if (checked) {
                                        setFormData({ ...formData, furnitureTypes: [...current, item] });
                                    } else {
                                        setFormData({ ...formData, furnitureTypes: current.filter((i: string) => i !== item) });
                                    }
                                }}
                            />
                            <Label htmlFor={item.toLowerCase().replace(/\s/g, "-")}>{item}</Label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="material">Material Utama *</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, material: value })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih material" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="kayu-jati">Kayu Jati</SelectItem>
                        <SelectItem value="kayu-mahoni">Kayu Mahoni</SelectItem>
                        <SelectItem value="mdf">MDF</SelectItem>
                        <SelectItem value="multiplek">Multiplek</SelectItem>
                        <SelectItem value="hpl">HPL</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="finishing">Finishing *</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, finishing: value })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih finishing" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="duco">Duco</SelectItem>
                        <SelectItem value="natural">Natural/Politur</SelectItem>
                        <SelectItem value="hpl">HPL</SelectItem>
                        <SelectItem value="melamine">Melamine</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="dimensions">Ukuran/Dimensi</Label>
                <Textarea
                    id="dimensions"
                    placeholder="Contoh: Lemari 200cm x 60cm x 180cm"
                    rows={2}
                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                />
            </div>
        </div>
    );
}

// Form Interior Design
function InteriorServiceForm({ formData, setFormData }: any) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detail Proyek Interior</h3>

            <div className="space-y-2">
                <Label htmlFor="projectType">Tipe Proyek *</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, projectType: value })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih tipe proyek" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="full-design">Full Design & Build</SelectItem>
                        <SelectItem value="design-only">Design Only</SelectItem>
                        <SelectItem value="renovation">Renovasi</SelectItem>
                        <SelectItem value="partial">Partial (beberapa ruangan)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Ruangan yang Dikerjakan *</Label>
                <div className="space-y-2">
                    {["Ruang Tamu", "Kamar Tidur", "Dapur", "Ruang Makan", "Ruang Kerja", "Kamar Mandi"].map((room) => (
                        <div key={room} className="flex items-center space-x-2">
                            <Checkbox
                                id={room.toLowerCase().replace(/\s/g, "-")}
                                onCheckedChange={(checked) => {
                                    const current = formData.rooms || [];
                                    if (checked) {
                                        setFormData({ ...formData, rooms: [...current, room] });
                                    } else {
                                        setFormData({ ...formData, rooms: current.filter((i: string) => i !== room) });
                                    }
                                }}
                            />
                            <Label htmlFor={room.toLowerCase().replace(/\s/g, "-")}>{room}</Label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="interiorStyle">Gaya Interior *</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, interiorStyle: value })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih gaya interior" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="minimalis">Minimalis</SelectItem>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="skandinavia">Skandinavia</SelectItem>
                        <SelectItem value="industrial">Industrial</SelectItem>
                        <SelectItem value="klasik">Klasik</SelectItem>
                        <SelectItem value="japanese">Japanese</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="budget">Estimasi Budget *</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, budget: value })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih range budget" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="<20jt">&lt; 20 Juta</SelectItem>
                        <SelectItem value="20-50jt">20 - 50 Juta</SelectItem>
                        <SelectItem value="50-100jt">50 - 100 Juta</SelectItem>
                        <SelectItem value=">100jt">&gt; 100 Juta</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

// Form Ventilasi
function VentilationServiceForm({ formData, setFormData }: any) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detail Layanan Ventilasi</h3>

            <div className="space-y-2">
                <Label htmlFor="ventType">Jenis Instalasi *</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, ventType: value })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="exhaust">Exhaust Fan</SelectItem>
                        <SelectItem value="blower">Blower</SelectItem>
                        <SelectItem value="ducting">Sistem Ducting</SelectItem>
                        <SelectItem value="industrial">Industrial Fan</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="location">Lokasi Pemasangan *</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, location: value })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih lokasi" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="dapur">Dapur</SelectItem>
                        <SelectItem value="kamar-mandi">Kamar Mandi</SelectItem>
                        <SelectItem value="gudang">Gudang</SelectItem>
                        <SelectItem value="pabrik">Pabrik/Produksi</SelectItem>
                        <SelectItem value="resto">Restoran</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="fanSize">Ukuran Fan *</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, fanSize: value })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih ukuran" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="8-inch">8 inch</SelectItem>
                        <SelectItem value="10-inch">10 inch</SelectItem>
                        <SelectItem value="12-inch">12 inch</SelectItem>
                        <SelectItem value="16-inch">16 inch</SelectItem>
                        <SelectItem value="20-inch">20 inch</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="quantity">Jumlah Unit *</Label>
                <Input
                    id="quantity"
                    type="number"
                    min="1"
                    placeholder="Jumlah unit"
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
            </div>
        </div>
    );
}

// Form Atap
function RoofServiceForm({ formData, setFormData }: any) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detail Layanan Atap</h3>

            <div className="space-y-2">
                <Label>Jenis Pekerjaan *</Label>
                <RadioGroup onValueChange={(value) => setFormData({ ...formData, roofWork: value })}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="perbaikan" id="perbaikan-atap" />
                        <Label htmlFor="perbaikan-atap">Perbaikan Bocor</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ganti-genteng" id="ganti-genteng" />
                        <Label htmlFor="ganti-genteng">Ganti Genteng</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="baja-ringan" id="baja-ringan" />
                        <Label htmlFor="baja-ringan">Instalasi Baja Ringan</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="kanopi" id="kanopi" />
                        <Label htmlFor="kanopi">Pembuatan Kanopi</Label>
                    </div>
                </RadioGroup>
            </div>

            <div className="space-y-2">
                <Label htmlFor="roofArea">Luas Area Atap (m²) *</Label>
                <Input
                    id="roofArea"
                    type="number"
                    placeholder="Luas area"
                    onChange={(e) => setFormData({ ...formData, roofArea: e.target.value })}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="roofMaterial">Material Atap/Genteng *</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, roofMaterial: value })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih material" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="genteng-tanah">Genteng Tanah</SelectItem>
                        <SelectItem value="genteng-metal">Genteng Metal</SelectItem>
                        <SelectItem value="asbes">Asbes</SelectItem>
                        <SelectItem value="spandek">Spandek</SelectItem>
                        <SelectItem value="polycarbonate">Polycarbonate</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="buildingStory">Tingkat Bangunan *</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, buildingStory: value })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih tingkat" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1-lantai">1 Lantai</SelectItem>
                        <SelectItem value="2-lantai">2 Lantai</SelectItem>
                        <SelectItem value="3-lantai">3 Lantai</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

// Form Kaca Film
function WindowFilmServiceForm({ formData, setFormData }: any) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detail Layanan Kaca Film</h3>

            <div className="space-y-2">
                <Label htmlFor="filmType">Tipe Kaca Film *</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, filmType: value })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih tipe" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="silver">Silver (heat rejection)</SelectItem>
                        <SelectItem value="black">Black (privacy)</SelectItem>
                        <SelectItem value="clear">Clear (UV protection)</SelectItem>
                        <SelectItem value="decorative">Decorative/Sandblast</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="darkness">Tingkat Kegelapan *</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, darkness: value })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih tingkat" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="20">20% (sangat gelap)</SelectItem>
                        <SelectItem value="40">40% (gelap)</SelectItem>
                        <SelectItem value="60">60% (medium)</SelectItem>
                        <SelectItem value="80">80% (terang)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="windowCount">Jumlah Kaca/Jendela *</Label>
                <Input
                    id="windowCount"
                    type="number"
                    min="1"
                    placeholder="Jumlah kaca"
                    onChange={(e) => setFormData({ ...formData, windowCount: e.target.value })}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="totalArea">Total Luas (m²) *</Label>
                <Input
                    id="totalArea"
                    type="number"
                    placeholder="Total luas kaca"
                    onChange={(e) => setFormData({ ...formData, totalArea: e.target.value })}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="buildingType">Tipe Bangunan *</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, buildingType: value })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih tipe" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="rumah">Rumah</SelectItem>
                        <SelectItem value="kantor">Kantor</SelectItem>
                        <SelectItem value="ruko">Ruko</SelectItem>
                        <SelectItem value="gedung">Gedung</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

// Form CCTV & Smart Home
function CCTVServiceForm({ formData, setFormData }: any) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detail Layanan CCTV & Smart Home</h3>

            <div className="space-y-2">
                <Label>Layanan yang Dibutuhkan *</Label>
                <div className="space-y-2">
                    {["CCTV", "Smart Lock", "Alarm System", "Smart Lighting", "Smart Home Integration"].map((service) => (
                        <div key={service} className="flex items-center space-x-2">
                            <Checkbox
                                id={service.toLowerCase().replace(/\s/g, "-")}
                                onCheckedChange={(checked) => {
                                    const current = formData.securityServices || [];
                                    if (checked) {
                                        setFormData({ ...formData, securityServices: [...current, service] });
                                    } else {
                                        setFormData({ ...formData, securityServices: current.filter((i: string) => i !== service) });
                                    }
                                }}
                            />
                            <Label htmlFor={service.toLowerCase().replace(/\s/g, "-")}>{service}</Label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="cctvCount">Jumlah Kamera CCTV *</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, cctvCount: value })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih jumlah" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="2">2 Kamera</SelectItem>
                        <SelectItem value="4">4 Kamera</SelectItem>
                        <SelectItem value="8">8 Kamera</SelectItem>
                        <SelectItem value="16">16 Kamera</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="cctvType">Tipe Kamera *</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, cctvType: value })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih tipe" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="analog">Analog HD</SelectItem>
                        <SelectItem value="ip">IP Camera</SelectItem>
                        <SelectItem value="wireless">Wireless</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="resolution">Resolusi *</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, resolution: value })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih resolusi" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="2mp">2MP (1080p)</SelectItem>
                        <SelectItem value="4mp">4MP (2K)</SelectItem>
                        <SelectItem value="8mp">8MP (4K)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="storage">Kapasitas Penyimpanan *</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, storage: value })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih kapasitas" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="500gb">500 GB</SelectItem>
                        <SelectItem value="1tb">1 TB</SelectItem>
                        <SelectItem value="2tb">2 TB</SelectItem>
                        <SelectItem value="4tb">4 TB</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                    id="remote-access"
                    onCheckedChange={(checked) => setFormData({ ...formData, remoteAccess: checked })}
                />
                <Label htmlFor="remote-access">Remote Access via HP/Internet</Label>
            </div>
        </div>
    );
}

// Form General untuk kategori lain
function GeneralServiceForm({ formData, setFormData }: any) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detail Layanan</h3>

            <div className="space-y-2">
                <Label htmlFor="serviceDescription">Deskripsi Pekerjaan *</Label>
                <Textarea
                    id="serviceDescription"
                    placeholder="Jelaskan detail pekerjaan yang dibutuhkan..."
                    rows={5}
                    required
                    onChange={(e) => setFormData({ ...formData, serviceDescription: e.target.value })}
                />
            </div>
        </div>
    );
}