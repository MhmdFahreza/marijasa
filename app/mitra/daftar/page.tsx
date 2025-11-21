"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import Image from "next/image";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/app/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { AspectRatio } from "@/app/components/ui/aspect-ratio";
import { LoaderTwo } from "@/app/components/transition/loader";
import CitySelect from "@/app/components/ui/city-select";
import { CITIES_ID } from "@/app/data/cities-id";
import {
    Upload,
    X,
    Plus,
    ImagePlus,
    AlertCircle,
    CheckCircle2,
    ArrowLeft,
} from "lucide-react";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import SiteFooter from "@/app/footer";

type ServiceTag = string;
type WorkImage = {
    id: string;
    file: File;
    preview: string;
};

export default function MitraDaftarPage() {
    const router = useRouter();
    const prefersReduced = useReducedMotion();
    const { t } = useTranslation();
    const [isNavigating, setIsNavigating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [namaMitra, setNamaMitra] = useState("");
    const [fotoProfil, setFotoProfil] = useState<File | null>(null);
    const [fotoProfilPreview, setFotoProfilPreview] = useState<string>("");
    const [jasaDitawarkan, setJasaDitawarkan] = useState<ServiceTag[]>([]);
    const [currentTag, setCurrentTag] = useState("");
    const [deskripsi, setDeskripsi] = useState("");
    const [hasilPekerjaan, setHasilPekerjaan] = useState<WorkImage[]>([]);
    const [lokasi, setLokasi] = useState<string[]>([]);
    const [currentLokasi, setCurrentLokasi] = useState("");
    const [mounted, setMounted] = useState(false);

    // Error state
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showSuccess, setShowSuccess] = useState(false);

    // ✅ Semua hooks dipanggil terlebih dahulu, SEBELUM kondisional apapun
    useEffect(() => {
        setMounted(true);
    }, []);

    const handleBackClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        setIsNavigating(true);
        await new Promise((r) => setTimeout(r, prefersReduced ? 0 : 220));
        router.push("/");
    };

    // Handle foto profil upload
    const handleFotoProfilChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setErrors((prev) => ({ ...prev, fotoProfil: "Ukuran file maksimal 5MB" }));
                return;
            }
            setFotoProfil(file);
            setFotoProfilPreview(URL.createObjectURL(file));
            setErrors((prev) => ({ ...prev, fotoProfil: "" }));
        }
    };

    // Handle jasa ditawarkan
    const handleAddTag = () => {
        if (currentTag.trim() && !jasaDitawarkan.includes(currentTag.trim())) {
            setJasaDitawarkan([...jasaDitawarkan, currentTag.trim()]);
            setCurrentTag("");
            setErrors((prev) => ({ ...prev, jasaDitawarkan: "" }));
        }
    };

    const handleRemoveTag = (tag: string) => {
        setJasaDitawarkan(jasaDitawarkan.filter((t) => t !== tag));
    };

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddTag();
        }
    };

    // Handle hasil pekerjaan upload
    const handleHasilPekerjaanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validFiles = files.filter((file) => {
            if (file.size > 5 * 1024 * 1024) {
                setErrors((prev) => ({
                    ...prev,
                    hasilPekerjaan: "Setiap file maksimal 5MB",
                }));
                return false;
            }
            return true;
        });

        if (hasilPekerjaan.length + validFiles.length > 10) {
            setErrors((prev) => ({
                ...prev,
                hasilPekerjaan: "Maksimal 10 foto",
            }));
            return;
        }

        const newImages: WorkImage[] = validFiles.map((file) => ({
            id: `${Date.now()}-${Math.random()}`,
            file,
            preview: URL.createObjectURL(file),
        }));

        setHasilPekerjaan([...hasilPekerjaan, ...newImages]);
        setErrors((prev) => ({ ...prev, hasilPekerjaan: "" }));
    };

    const handleRemoveHasilPekerjaan = (id: string) => {
        setHasilPekerjaan(hasilPekerjaan.filter((img) => img.id !== id));
    };

    // Handle lokasi
    const handleAddLokasi = () => {
        if (currentLokasi && !lokasi.includes(currentLokasi)) {
            setLokasi([...lokasi, currentLokasi]);
            setCurrentLokasi("");
            setErrors((prev) => ({ ...prev, lokasi: "" }));
        }
    };

    const handleRemoveLokasi = (city: string) => {
        setLokasi(lokasi.filter((l) => l !== city));
    };

    // Validation
    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!namaMitra.trim()) {
            newErrors.namaMitra = "Nama mitra wajib diisi";
        }

        if (!fotoProfil) {
            newErrors.fotoProfil = "Foto profil wajib diunggah";
        }

        if (jasaDitawarkan.length === 0) {
            newErrors.jasaDitawarkan = "Minimal 1 jasa harus ditambahkan";
        }

        if (!deskripsi.trim()) {
            newErrors.deskripsi = "Deskripsi wajib diisi";
        } else if (deskripsi.trim().length < 50) {
            newErrors.deskripsi = "Deskripsi minimal 50 karakter";
        }

        if (hasilPekerjaan.length === 0) {
            newErrors.hasilPekerjaan = "Minimal 1 foto hasil pekerjaan wajib diunggah";
        }

        if (lokasi.length === 0) {
            newErrors.lokasi = "Minimal 1 lokasi harus dipilih";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            // Scroll to first error
            const firstError = Object.keys(errors)[0];
            document.getElementById(firstError)?.scrollIntoView({ behavior: "smooth" });
            return;
        }

        setIsSubmitting(true);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Show success message
        setShowSuccess(true);
        setIsSubmitting(false);

        // Redirect after 2 seconds
        setTimeout(() => {
            router.push("/");
        }, 2000);
    };

    // ✅ Kondisional return di AKHIR, setelah semua hooks
    if (!mounted) {
        return null;
    }

    return (
        <>
            <motion.main
                className="min-h-[60vh] w-full max-w-4xl mx-auto px-4 py-6"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: prefersReduced ? 0 : 0.25, ease: "easeOut" }}
            >
                {/* Breadcrumb */}
                <div className="mb-6">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <motion.span whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                                        <Link href="/" onClick={handleBackClick}>
                                            Home
                                        </Link>
                                    </motion.span>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Pendaftaran Mitra</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                {/* Success Alert */}
                <AnimatePresence>
                    {showSuccess && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-6"
                        >
                            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800 dark:text-green-200">
                                    Pendaftaran berhasil! Anda akan dialihkan ke halaman utama...
                                </AlertDescription>
                            </Alert>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Form Card */}
                <Card className="rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 py-6">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.back()}
                                className="rounded-full"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <CardTitle className="text-2xl">Daftar Sebagai Mitra</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Lengkapi formulir di bawah untuk bergabung sebagai penyedia jasa
                                </p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* 1. Nama Mitra */}
                            <div id="namaMitra" className="space-y-2">
                                <Label htmlFor="nama-mitra" className="text-base font-semibold">
                                    Nama Mitra <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="nama-mitra"
                                    placeholder="Masukkan nama Anda atau nama usaha"
                                    value={namaMitra}
                                    onChange={(e) => {
                                        setNamaMitra(e.target.value);
                                        setErrors((prev) => ({ ...prev, namaMitra: "" }));
                                    }}
                                    className={`h-12 ${errors.namaMitra ? "border-destructive" : ""}`}
                                />
                                {errors.namaMitra && (
                                    <p className="text-sm text-destructive flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.namaMitra}
                                    </p>
                                )}
                            </div>

                            {/* 2. Foto Profil */}
                            <div id="fotoProfil" className="space-y-2">
                                <Label className="text-base font-semibold">
                                    Foto Profil <span className="text-destructive">*</span>
                                </Label>
                                <div className="flex flex-col sm:flex-row gap-4 items-start">
                                    {fotoProfilPreview ? (
                                        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-muted">
                                            <Image
                                                src={fotoProfilPreview}
                                                alt="Preview"
                                                fill
                                                className="object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFotoProfil(null);
                                                    setFotoProfilPreview("");
                                                }}
                                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-8 w-8 text-white" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label
                                            htmlFor="foto-profil-input"
                                            className="w-32 h-32 rounded-full border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                                        >
                                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                            <span className="text-xs text-center text-muted-foreground px-2">
                                                Upload Foto
                                            </span>
                                        </label>
                                    )}
                                    <input
                                        id="foto-profil-input"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFotoProfilChange}
                                        className="hidden"
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm text-muted-foreground">
                                            Upload foto profil Anda. Format: JPG, PNG. Maksimal 5MB.
                                        </p>
                                        {errors.fotoProfil && (
                                            <p className="text-sm text-destructive flex items-center gap-1 mt-2">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors.fotoProfil}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 3. Jasa yang Ditawarkan */}
                            <div id="jasaDitawarkan" className="space-y-2">
                                <Label htmlFor="jasa-input" className="text-base font-semibold">
                                    Jasa yang Ditawarkan <span className="text-destructive">*</span>
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="jasa-input"
                                        placeholder="Contoh: Fotografi, Videografi, Editing"
                                        value={currentTag}
                                        onChange={(e) => setCurrentTag(e.target.value)}
                                        onKeyDown={handleTagKeyDown}
                                        className="h-12"
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleAddTag}
                                        disabled={!currentTag.trim()}
                                        className="h-12 px-6"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Tambah
                                    </Button>
                                </div>
                                {jasaDitawarkan.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {jasaDitawarkan.map((tag) => (
                                            <Badge
                                                key={tag}
                                                variant="secondary"
                                                className="px-3 py-1.5 text-sm"
                                            >
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTag(tag)}
                                                    className="ml-2 hover:text-destructive"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                                {errors.jasaDitawarkan && (
                                    <p className="text-sm text-destructive flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.jasaDitawarkan}
                                    </p>
                                )}
                            </div>

                            {/* 4. Deskripsi */}
                            <div id="deskripsi" className="space-y-2">
                                <Label htmlFor="deskripsi-textarea" className="text-base font-semibold">
                                    Deskripsi <span className="text-destructive">*</span>
                                </Label>
                                <Textarea
                                    id="deskripsi-textarea"
                                    placeholder="Ceritakan tentang layanan Anda, pengalaman, keahlian, dan apa yang membuat Anda unik..."
                                    value={deskripsi}
                                    onChange={(e) => {
                                        setDeskripsi(e.target.value);
                                        setErrors((prev) => ({ ...prev, deskripsi: "" }));
                                    }}
                                    rows={6}
                                    className={errors.deskripsi ? "border-destructive" : ""}
                                />
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>{deskripsi.length} karakter (minimal 50)</span>
                                </div>
                                {errors.deskripsi && (
                                    <p className="text-sm text-destructive flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.deskripsi}
                                    </p>
                                )}
                            </div>

                            {/* 5. Hasil Pekerjaan */}
                            <div id="hasilPekerjaan" className="space-y-2">
                                <Label className="text-base font-semibold">
                                    Hasil Pekerjaan <span className="text-destructive">*</span>
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Upload foto portofolio pekerjaan Anda. Maksimal 10 foto, setiap foto
                                    maksimal 5MB.
                                </p>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                                    {hasilPekerjaan.map((img) => (
                                        <div key={img.id} className="relative group">
                                            <AspectRatio ratio={1}>
                                                <Image
                                                    src={img.preview}
                                                    alt="Hasil Pekerjaan"
                                                    fill
                                                    className="object-cover rounded-lg"
                                                />
                                            </AspectRatio>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveHasilPekerjaan(img.id)}
                                                className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}

                                    {hasilPekerjaan.length < 10 && (
                                        <label
                                            htmlFor="hasil-pekerjaan-input"
                                            className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                                        >
                                            <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                                            <span className="text-xs text-muted-foreground">
                                                Tambah Foto
                                            </span>
                                        </label>
                                    )}
                                </div>

                                <input
                                    id="hasil-pekerjaan-input"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleHasilPekerjaanChange}
                                    className="hidden"
                                />

                                {errors.hasilPekerjaan && (
                                    <p className="text-sm text-destructive flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.hasilPekerjaan}
                                    </p>
                                )}
                            </div>

                            {/* 6. Lokasi/Jangkauan Area */}
                            <div id="lokasi" className="space-y-2">
                                <Label className="text-base font-semibold">
                                    Lokasi/Jangkauan Area <span className="text-destructive">*</span>
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Pilih kota/daerah tempat Anda menyediakan layanan
                                </p>

                                <div className="flex gap-2">
                                    <CitySelect
                                        value={currentLokasi}
                                        onValueChange={setCurrentLokasi}
                                        placeholder="Pilih kota"
                                        cities={CITIES_ID}
                                        triggerClassName="flex-1"
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleAddLokasi}
                                        disabled={!currentLokasi}
                                        className="h-12 px-6"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Tambah
                                    </Button>
                                </div>

                                {lokasi.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {lokasi.map((city) => (
                                            <Badge
                                                key={city}
                                                variant="secondary"
                                                className="px-3 py-1.5 text-sm"
                                            >
                                                {city}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveLokasi(city)}
                                                    className="ml-2 hover:text-destructive"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {errors.lokasi && (
                                    <p className="text-sm text-destructive flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.lokasi}
                                    </p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="flex gap-4 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                    className="flex-1 h-12"
                                    disabled={isSubmitting}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 h-12"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="animate-spin mr-2">⏳</span>
                                            Mengirim...
                                        </>
                                    ) : (
                                        "Daftar Sekarang"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div className="mt-10">
                    <SiteFooter />
                </div>
            </motion.main>

            {/* Navigation Loader */}
            <AnimatePresence>
                {isNavigating && (
                    <motion.div
                        key="navigation-loader"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: prefersReduced ? 0 : 0.3 }}
                        className="fixed inset-0 z-[9999] bg-white dark:bg-neutral-950 flex items-center justify-center"
                    >
                        <LoaderTwo />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}