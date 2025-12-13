"use client";

import React, { useRef, ReactNode, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";

import { IconUpload } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
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
    PlugZap,
    AirVent,
    Brush,
    ShowerHead,
    Toilet,
    Trees,
    Armchair,
    Eye,
    EyeOff,
    Camera,
    FileText,
    Building,
    User,
    Phone,
    Mail,
    MapPin,
    Lock,
    ShieldCheck,
    ZoomIn,
    ZoomOut,
    Minus,
    FileUser,
} from "lucide-react";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import SiteFooter from "@/app/footer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/app/components/ui/dialog";
import { Slider } from "@/app/components/ui/slider";

type ServiceTag = string;
type WorkImage = {
    id: string;
    file: File;
    preview: string; // Data URL (base64)
    displayName: string;
};

type ServiceCategory = {
    id: string;
    name: string;
    icon: ReactNode;
    defaultServices: string[];
};

type DocumentFile = {
    file: File | null;
    displayName: string;
    preview?: string;
};

const SERVICE_CATEGORIES: ServiceCategory[] = [
    {
        id: "ac",
        name: "Tukang AC",
        icon: (
            <div className="flex justify-center">
                <AirVent className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 text-sky-500" />
            </div>
        ),
        defaultServices: ["Instalasi AC Baru", "Perbaikan AC", "Cuci AC", "Bongkar Pasang AC"]
    },
    {
        id: "electrical",
        name: "Tukang Listrik",
        icon: (
            <div className="flex justify-center">
                <PlugZap className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 text-yellow-500" />
            </div>
        ),
        defaultServices: ["Instalasi Listrik Baru", "Perbaikan", "Penambahan Titik Listrik", "Pemasangan Panel", "Ganti MCB"]
    },
    {
        id: "cleaning",
        name: "Tukang Pembersihan Rumah",
        icon: (
            <div className="flex justify-center">
                <Brush className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 text-emerald-500" />
            </div>
        ),
        defaultServices: ["Pembersihan Rutin", "Pembersihan Mendalam", "Pembersihan Renovasi", "Pindahan"]
    },
    {
        id: "plumbing",
        name: "Tukang Ledeng",
        icon: (
            <div className="flex justify-center">
                <ShowerHead className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 text-cyan-500" />
            </div>
        ),
        defaultServices: ["Instalasi Pipa", "Perbaikan Kebocoran", "Pelancaran Saluran Mampet", "Pemasangan Sanitary Fixture", "Instalasi water heater"]
    },
    {
        id: "sedot-wc",
        name: "Tukang Sedot WC",
        icon: (
            <div className="flex justify-center">
                <Toilet className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 text-indigo-500" />
            </div>
        ),
        defaultServices: ["Penyedotan Septictank", "Inspeksi", "Pelancaran Saluran WC"]
    },
    {
        id: "garden",
        name: "Tukang Kebun",
        icon: (
            <div className="flex justify-center">
                <Trees className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 text-green-600" />
            </div>
        ),
        defaultServices: ["Pembuatan Taman Baru", "Perawatan Rutin", "Pemangkasan", "Perawatan Rumput", "Pengendalian Hama Tanaman"]
    },
    {
        id: "furniture",
        name: "Tukang Mebel",
        icon: (
            <div className="flex justify-center">
                <Armchair className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 text-amber-600" />
            </div>
        ),
        defaultServices: ["Pembuatan Furnitur", "Restorasi Furnitur Lama", "Bongkar Pasang", "Produksi Furnitur Dekoratif", "Pemeliharaan Furnitur"]
    }
];

// Fungsi untuk generate nama file acak
const generateRandomFileName = (originalFile: File): string => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalFile.name.split('.').pop() ||
        (originalFile.type.includes('pdf') ? 'pdf' :
            originalFile.type.includes('jpeg') ? 'jpg' :
                originalFile.type.includes('png') ? 'png' : 'jpg');

    return `doc_${timestamp}_${randomString}.${extension}`;
};

// Fungsi untuk membaca file sebagai Data URL (base64)
const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export default function MitraDaftarPage() {
    const router = useRouter();
    const prefersReduced = useReducedMotion();
    const { t } = useTranslation();
    const [isNavigating, setIsNavigating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showKtpCropModal, setShowKtpCropModal] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState<Crop>({
        unit: 'px',
        width: 853,
        height: 540,
        x: 0,
        y: 0
    });
    const [zoom, setZoom] = useState(1);
    const imageRef = useRef<HTMLImageElement>(null);

    // Form state - Step 1 (Daftar Mitra)
    const [namaMitra, setNamaMitra] = useState("");
    const [fotoProfil, setFotoProfil] = useState<File | null>(null);
    const [fotoProfilPreview, setFotoProfilPreview] = useState<string>("");
    const [kategoriJasa, setKategoriJasa] = useState<string>("");
    const [jasaDitawarkan, setJasaDitawarkan] = useState<ServiceTag[]>([]);
    const [currentTag, setCurrentTag] = useState("");
    const [deskripsi, setDeskripsi] = useState("");
    const [hasilPekerjaan, setHasilPekerjaan] = useState<WorkImage[]>([]);
    const [lokasi, setLokasi] = useState<string[]>([]);
    const [currentLokasi, setCurrentLokasi] = useState("");

    // Form state - Step 2 (Data Pribadi) - menggunakan DocumentFile type
    const [email, setEmail] = useState("");
    const [telepon, setTelepon] = useState("");
    const [alamat, setAlamat] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [fotoKTP, setFotoKTP] = useState<DocumentFile>({ file: null, displayName: "" });
    const [fotoKTPPreview, setFotoKTPPreview] = useState<string>("");
    const [fotoDenganKTP, setFotoDenganKTP] = useState<DocumentFile>({ file: null, displayName: "" });
    const [skck, setSkck] = useState<DocumentFile>({ file: null, displayName: "" });
    const [siup, setSiup] = useState<DocumentFile>({ file: null, displayName: "" });
    const [cv, setCv] = useState<DocumentFile>({ file: null, displayName: "" });
    const [tipeMitra, setTipeMitra] = useState<"individu" | "perusahaan">("individu");

    // Error state
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showSuccess, setShowSuccess] = useState(false);
    const [isClient, setIsClient] = useState(false);

    // Track step completion
    const [step1Completed, setStep1Completed] = useState(false);
    const [step2Completed, setStep2Completed] = useState(false);

    // Set isClient to true on mount (client-side only)
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Check if step 1 is completed
    useEffect(() => {
        const isStep1Complete = namaMitra.trim() !== "" &&
            fotoProfil !== null &&
            kategoriJasa !== "" &&
            jasaDitawarkan.length > 0 &&
            deskripsi.trim().length >= 50 &&
            hasilPekerjaan.length > 0 &&
            lokasi.length > 0;

        setStep1Completed(isStep1Complete);
    }, [namaMitra, fotoProfil, kategoriJasa, jasaDitawarkan, deskripsi, hasilPekerjaan, lokasi]);

    // Check if step 2 is completed
    useEffect(() => {
        const isStep2Complete = email.trim() !== "" &&
            /^\S+@\S+\.\S+$/.test(email) &&
            telepon.trim() !== "" &&
            /^[0-9]{10,13}$/.test(telepon.replace(/\D/g, '')) &&
            alamat.trim() !== "" &&
            password.length >= 8 &&
            /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password) &&
            confirmPassword === password &&
            fotoKTP.file !== null &&
            fotoDenganKTP.file !== null &&
            skck.file !== null &&
            ((tipeMitra === "perusahaan" && siup.file !== null) || 
             (tipeMitra === "individu" && cv.file !== null));

        setStep2Completed(isStep2Complete);
    }, [email, telepon, alamat, password, confirmPassword, fotoKTP, fotoDenganKTP, skck, siup, cv, tipeMitra]);

    // Reset dokumen ketika tipe mitra berubah
    useEffect(() => {
        // Reset dokumen saat tipe mitra berubah
        if (fotoKTPPreview) URL.revokeObjectURL(fotoKTPPreview);
        setFotoKTP({ file: null, displayName: "" });
        setFotoKTPPreview("");
        setFotoDenganKTP({ file: null, displayName: "" });
        setSkck({ file: null, displayName: "" });
        setSiup({ file: null, displayName: "" });
        setCv({ file: null, displayName: "" });

        // Reset errors related to documents
        setErrors(prev => ({
            ...prev,
            fotoKTP: "",
            fotoDenganKTP: "",
            skck: "",
            siup: "",
            cv: ""
        }));
    }, [tipeMitra]);

    // Auto-populate services when category is selected
    useEffect(() => {
        if (kategoriJasa) {
            const category = SERVICE_CATEGORIES.find(cat => cat.id === kategoriJasa);
            if (category) {
                setJasaDitawarkan(category.defaultServices);
            }
        }
    }, [kategoriJasa]);

    // Cleanup URLs on unmount
    useEffect(() => {
        return () => {
            if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
        };
    }, [cropImageSrc]);

    const handleBackClick = useCallback(async (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        setIsNavigating(true);
        await new Promise((r) => setTimeout(r, prefersReduced ? 0 : 220));
        router.push("/");
    }, [router, prefersReduced]);

    // Step 1 handlers
    const handleFotoProfilChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setErrors((prev) => ({ ...prev, fotoProfil: "Ukuran file maksimal 5MB" }));
                return;
            }
            setFotoProfil(file);
            const dataUrl = await readFileAsDataURL(file);
            setFotoProfilPreview(dataUrl);
            setErrors((prev) => ({ ...prev, fotoProfil: "" }));
        }
    }, []);

    const handleAddTag = useCallback(() => {
        if (currentTag.trim() && !jasaDitawarkan.includes(currentTag.trim())) {
            setJasaDitawarkan([...jasaDitawarkan, currentTag.trim()]);
            setCurrentTag("");
            setErrors((prev) => ({ ...prev, jasaDitawarkan: "" }));
        }
    }, [currentTag, jasaDitawarkan]);

    const handleRemoveTag = useCallback((tag: string) => {
        setJasaDitawarkan(jasaDitawarkan.filter((t) => t !== tag));
    }, [jasaDitawarkan]);

    const handleTagKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddTag();
        }
    }, [handleAddTag]);

    const handleHasilPekerjaanChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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

        const newImages: WorkImage[] = [];
        for (const file of validFiles) {
            const dataUrl = await readFileAsDataURL(file);
            newImages.push({
                id: `${Date.now()}-${Math.random()}`,
                file,
                preview: dataUrl,
                displayName: generateRandomFileName(file)
            });
        }

        setHasilPekerjaan([...hasilPekerjaan, ...newImages]);
        setErrors((prev) => ({ ...prev, hasilPekerjaan: "" }));
    }, [hasilPekerjaan]);

    const handleRemoveHasilPekerjaan = useCallback((id: string) => {
        setHasilPekerjaan(prev => prev.filter((img) => img.id !== id));
    }, []);

    const handleAddLokasi = useCallback(() => {
        if (currentLokasi && !lokasi.includes(currentLokasi)) {
            setLokasi([...lokasi, currentLokasi]);
            setCurrentLokasi("");
            setErrors((prev) => ({ ...prev, lokasi: "" }));
        }
    }, [currentLokasi, lokasi]);

    const handleRemoveLokasi = useCallback((city: string) => {
        setLokasi(lokasi.filter((l) => l !== city));
    }, [lokasi]);

    // Step 2 handlers
    const handleFotoKTPChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setErrors((prev) => ({ ...prev, fotoKTP: "Ukuran file maksimal 5MB" }));
                return;
            }
            // Set image for cropping
            if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
            const previewUrl = URL.createObjectURL(file);
            setCropImageSrc(previewUrl);
            setZoom(1); // Reset zoom
            setShowKtpCropModal(true);
            setErrors((prev) => ({ ...prev, fotoKTP: "" }));
        }
    }, [cropImageSrc]);

    const handleCropComplete = useCallback(async () => {
        if (!cropImageSrc || !imageRef.current) {
            setShowKtpCropModal(false);
            setCropImageSrc(null);
            return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const image = imageRef.current;

        if (!image || !ctx) {
            setShowKtpCropModal(false);
            setCropImageSrc(null);
            return;
        }

        // Calculate actual crop dimensions based on zoom
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        canvas.width = crop.width;
        canvas.height = crop.height;

        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width,
            crop.height
        );

        canvas.toBlob(async (blob) => {
            if (blob) {
                if (fotoKTPPreview) URL.revokeObjectURL(fotoKTPPreview);
                const croppedFile = new File([blob], "ktp-cropped.jpg", { type: "image/jpeg" });
                const displayName = generateRandomFileName(croppedFile);
                const dataUrl = await readFileAsDataURL(croppedFile);
                setFotoKTP({ file: croppedFile, displayName, preview: dataUrl });
                setFotoKTPPreview(dataUrl);
            }
        }, 'image/jpeg', 0.95);

        setShowKtpCropModal(false);
        setCropImageSrc(null);
        setZoom(1); // Reset zoom
    }, [cropImageSrc, crop, fotoKTPPreview]);

    const handleFotoDenganKTPChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setErrors((prev) => ({ ...prev, fotoDenganKTP: "Ukuran file maksimal 5MB" }));
                return;
            }
            const displayName = generateRandomFileName(file);
            const dataUrl = await readFileAsDataURL(file);
            setFotoDenganKTP({ file, displayName, preview: dataUrl });
            setErrors((prev) => ({ ...prev, fotoDenganKTP: "" }));
        }
    }, []);

    const handleSkckChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setErrors((prev) => ({ ...prev, skck: "Ukuran file maksimal 5MB" }));
                return;
            }
            const displayName = generateRandomFileName(file);
            setSkck({ file, displayName });
            setErrors((prev) => ({ ...prev, skck: "" }));
        }
    }, []);

    const handleSiupChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setErrors((prev) => ({ ...prev, siup: "Ukuran file maksimal 5MB" }));
                return;
            }
            const displayName = generateRandomFileName(file);
            setSiup({ file, displayName });
            setErrors((prev) => ({ ...prev, siup: "" }));
        }
    }, []);

    const handleCvChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setErrors((prev) => ({ ...prev, cv: "Ukuran file maksimal 5MB" }));
                return;
            }
            const displayName = generateRandomFileName(file);
            setCv({ file, displayName });
            setErrors((prev) => ({ ...prev, cv: "" }));
        }
    }, []);

    // Handler untuk menghapus dokumen
    const handleRemoveFotoKTP = useCallback(() => {
        setFotoKTP({ file: null, displayName: "" });
        setFotoKTPPreview("");
    }, []);

    const handleRemoveFotoDenganKTP = useCallback(() => {
        setFotoDenganKTP({ file: null, displayName: "" });
    }, []);

    const handleRemoveSkck = useCallback(() => {
        setSkck({ file: null, displayName: "" });
    }, []);

    const handleRemoveSiup = useCallback(() => {
        setSiup({ file: null, displayName: "" });
    }, []);

    const handleRemoveCv = useCallback(() => {
        setCv({ file: null, displayName: "" });
    }, []);

    // Zoom handlers
    const handleZoomIn = useCallback(() => {
        setZoom(prev => Math.min(prev + 0.1, 3));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoom(prev => Math.max(prev - 0.1, 0.5));
    }, []);

    // Validation
    const validateStep1 = useCallback(() => {
        const newErrors: Record<string, string> = {};

        if (!namaMitra.trim()) {
            newErrors.namaMitra = "Nama mitra wajib diisi";
        }

        if (!fotoProfil) {
            newErrors.fotoProfil = "Foto profil wajib diunggah";
        }

        if (!kategoriJasa) {
            newErrors.kategoriJasa = "Kategori jasa wajib dipilih";
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
    }, [namaMitra, fotoProfil, kategoriJasa, jasaDitawarkan, deskripsi, hasilPekerjaan, lokasi]);

    const validateStep2 = useCallback(() => {
        const newErrors: Record<string, string> = {};

        if (!email.trim()) {
            newErrors.email = "Email wajib diisi";
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Format email tidak valid";
        }

        if (!telepon.trim()) {
            newErrors.telepon = "Nomor telepon wajib diisi";
        } else if (!/^[0-9]{10,13}$/.test(telepon.replace(/\D/g, ''))) {
            newErrors.telepon = "Format nomor telepon tidak valid";
        }

        if (!alamat.trim()) {
            newErrors.alamat = "Alamat wajib diisi";
        }

        if (!password) {
            newErrors.password = "Password wajib diisi";
        } else if (password.length < 8) {
            newErrors.password = "Password minimal 8 karakter";
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            newErrors.password = "Password harus mengandung huruf besar, huruf kecil, dan angka";
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = "Konfirmasi password wajib diisi";
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = "Password tidak cocok";
        }

        if (!fotoKTP.file) {
            newErrors.fotoKTP = "Foto KTP wajib diunggah";
        }

        if (!fotoDenganKTP.file) {
            newErrors.fotoDenganKTP = "Foto dengan KTP wajib diunggah";
        }

        if (!skck.file) {
            newErrors.skck = "SKCK wajib diunggah";
        }

        if (tipeMitra === "perusahaan" && !siup.file) {
            newErrors.siup = "SIUP wajib diunggah untuk perusahaan";
        }

        if (tipeMitra === "individu" && !cv.file) {
            newErrors.cv = "CV wajib diunggah untuk freelancer/pekerja mandiri";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [email, telepon, alamat, password, confirmPassword, fotoKTP, fotoDenganKTP, skck, siup, cv, tipeMitra]);

    // Handle step navigation
    const handleNextStep = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (validateStep1()) {
            setCurrentStep(2);
            setStep1Completed(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            const firstError = Object.keys(errors)[0];
            const element = document.getElementById(firstError);
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }
    }, [validateStep1, errors]);

    const handlePrevStep = useCallback(() => {
        setCurrentStep(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // Handle final submit
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateStep2()) {
            const firstError = Object.keys(errors)[0];
            const element = document.getElementById(firstError);
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
            }
            return;
        }

        setIsSubmitting(true);

        // Prepare form data
        const formData = new FormData();
        formData.append("namaMitra", namaMitra);
        if (fotoProfil) formData.append("fotoProfil", fotoProfil);
        formData.append("kategoriJasa", kategoriJasa);
        formData.append("jasaDitawarkan", JSON.stringify(jasaDitawarkan));
        formData.append("deskripsi", deskripsi);
        formData.append("lokasi", JSON.stringify(lokasi));
        formData.append("email", email);
        formData.append("telepon", telepon);
        formData.append("alamat", alamat);
        formData.append("password", password);
        formData.append("tipeMitra", tipeMitra);
        if (fotoKTP.file) formData.append("fotoKTP", fotoKTP.file);
        if (fotoDenganKTP.file) formData.append("fotoDenganKTP", fotoDenganKTP.file);
        if (skck.file) formData.append("skck", skck.file);
        if (siup.file) formData.append("siup", siup.file);
        if (cv.file) formData.append("cv", cv.file);

        // Upload hasil pekerjaan
        hasilPekerjaan.forEach((img, index) => {
            formData.append(`hasilPekerjaan_${index}`, img.file);
        });

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Show success message
        setShowSuccess(true);
        setIsSubmitting(false);
        setStep2Completed(true);

        // Redirect after 2 seconds
        setTimeout(() => {
            router.push("/mitra/dashboard");
        }, 2000);
    }, [validateStep2, errors, namaMitra, fotoProfil, kategoriJasa, jasaDitawarkan, deskripsi, lokasi, email, telepon, alamat, password, tipeMitra, fotoKTP, fotoDenganKTP, skck, siup, cv, hasilPekerjaan, router]);

    // Untuk menghindari hydration mismatch, kita tidak render apa-apa di server untuk bagian yang menggunakan URL.createObjectURL
    if (!isClient) {
        return (
            <div className="min-h-[60vh] w-full max-w-4xl mx-auto px-4 py-6">
                <div className="mb-6">
                    <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="mb-8">
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-[400px] bg-gray-200 rounded animate-pulse"></div>
            </div>
        );
    }

    return (
        <>
            <main className="min-h-[60vh] w-full max-w-4xl mx-auto px-4 py-6">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Link href="/" onClick={handleBackClick} className="hover:text-[#7CE0A8]">
                                        Home
                                    </Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Pendaftaran Mitra</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-center">
                        <div className="flex items-center space-x-4">
                            {/* Step 1 */}
                            <div className={`flex items-center ${currentStep === 1 ? 'text-[#7CE0A8]' : step1Completed ? 'text-[#7CE0A8]' : 'text-gray-400'}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${currentStep === 1 ? 'border-[#7CE0A8] bg-[#7CE0A8]/20' : step1Completed ? 'border-[#7CE0A8] bg-[#7CE0A8]/10' : 'border-gray-300 bg-gray-100'}`}>
                                    {step1Completed && currentStep !== 1 ? (
                                        <CheckCircle2 className="h-5 w-5 text-[#7CE0A8]" />
                                    ) : (
                                        "1"
                                    )}
                                </div>
                                <span className="ml-2 font-medium">Daftar Mitra</span>
                            </div>

                            {/* Connector Line */}
                            <div className={`w-16 h-0.5 ${currentStep === 2 || step1Completed ? 'bg-[#7CE0A8]' : 'bg-gray-300'}`}></div>

                            {/* Step 2 */}
                            <div className={`flex items-center ${currentStep === 2 ? 'text-[#7CE0A8]' : step2Completed ? 'text-[#7CE0A8]' : 'text-gray-400'}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${currentStep === 2 ? 'border-[#7CE0A8] bg-[#7CE0A8]/20' : step2Completed ? 'border-[#7CE0A8] bg-[#7CE0A8]/10' : 'border-gray-300 bg-gray-100'}`}>
                                    {step2Completed && currentStep !== 2 ? (
                                        <CheckCircle2 className="h-5 w-5 text-[#7CE0A8]" />
                                    ) : (
                                        "2"
                                    )}
                                </div>
                                <span className="ml-2 font-medium">Data Pribadi</span>
                            </div>
                        </div>
                    </div>
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
                            <Alert className="border-[#7CE0A8] bg-[#7CE0A8]/10 dark:bg-[#7CE0A8]/20">
                                <CheckCircle2 className="h-4 w-4 text-[#7CE0A8]" />
                                <AlertDescription className="text-[#5AB88A] dark:text-[#7CE0A8]">
                                    Pendaftaran berhasil! Anda akan dialihkan ke dashboard mitra...
                                </AlertDescription>
                            </Alert>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Step 1: Daftar Mitra */}
                {currentStep === 1 && (
                    <Card className="rounded-2xl overflow-hidden border-[#7CE0A8]/20">
                        <CardHeader className="bg-gradient-to-r from-[#7CE0A8]/10 to-[#7CE0A8]/5 py-6">
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => router.back()}
                                    className="rounded-full hover:bg-[#7CE0A8]/20 hover:text-[#7CE0A8]"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <div>
                                    <CardTitle className="text-2xl text-[#7CE0A8]">Daftar Mitra</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Lengkapi informasi jasa yang akan Anda tawarkan
                                    </p>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6">
                            <form onSubmit={handleNextStep} className="space-y-8">
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
                                        className={`h-12 focus-visible:ring-[#7CE0A8] ${errors.namaMitra ? "border-destructive" : ""}`}
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
                                            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-[#7CE0A8]/30">
                                                <img
                                                    src={fotoProfilPreview}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
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
                                                className="w-32 h-32 rounded-full border-2 border-dashed border-[#7CE0A8]/50 flex flex-col items-center justify-center cursor-pointer hover:border-[#7CE0A8] hover:bg-[#7CE0A8]/5 transition-colors"
                                            >
                                                <User className="h-8 w-8 text-[#7CE0A8] mb-2" />
                                                <span className="text-xs text-center text-[#7CE0A8] px-2">
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

                                {/* 3. Kategori Jasa */}
                                <div id="kategoriJasa" className="space-y-2">
                                    <Label className="text-base font-semibold">
                                        Kategori Jasa <span className="text-destructive">*</span>
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Pilih kategori jasa yang ingin Anda tawarkan
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {SERVICE_CATEGORIES.map((category) => (
                                            <button
                                                key={category.id}
                                                type="button"
                                                onClick={() => {
                                                    setKategoriJasa(category.id);
                                                    setErrors((prev) => ({ ...prev, kategoriJasa: "" }));
                                                }}
                                                className={`p-4 rounded-lg border-2 transition-all ${kategoriJasa === category.id
                                                    ? "border-[#7CE0A8] bg-[#7CE0A8]/10"
                                                    : "border-muted hover:border-[#7CE0A8]/50"
                                                    }`}
                                            >
                                                <div className="text-3xl mb-2">{category.icon}</div>
                                                <div className="text-sm font-medium text-center">
                                                    {category.name}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    {errors.kategoriJasa && (
                                        <p className="text-sm text-destructive flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {errors.kategoriJasa}
                                        </p>
                                    )}
                                </div>

                                {/* 4. Jasa yang Ditawarkan */}
                                <div id="jasaDitawarkan" className="space-y-2">
                                    <Label htmlFor="jasa-input" className="text-base font-semibold">
                                        Layanan yang Ditawarkan <span className="text-destructive">*</span>
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        {kategoriJasa
                                            ? "Layanan default sudah ditambahkan. Anda bisa menambah atau menghapus layanan."
                                            : "Pilih kategori jasa terlebih dahulu untuk melihat layanan default."}
                                    </p>
                                    <div className="flex gap-2">
                                        <Input
                                            id="jasa-input"
                                            placeholder="Tambahkan layanan baru"
                                            value={currentTag}
                                            onChange={(e) => setCurrentTag(e.target.value)}
                                            onKeyDown={handleTagKeyDown}
                                            className="h-12 focus-visible:ring-[#7CE0A8]"
                                            disabled={!kategoriJasa}
                                        />
                                        <Button
                                            type="button"
                                            onClick={handleAddTag}
                                            disabled={!currentTag.trim() || !kategoriJasa}
                                            className="h-12 px-6 bg-[#7CE0A8] hover:bg-[#6BC999] text-white"
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
                                                    className="px-3 py-1.5 text-sm bg-[#7CE0A8]/20 text-[#5AB88A] hover:bg-[#7CE0A8]/30 border-[#7CE0A8]/30"
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

                                {/* 5. Deskripsi */}
                                <div id="deskripsi" className="space-y-2">
                                    <Label htmlFor="deskripsi-textarea" className="text-base font-semibold">
                                        Deskripsi Mitra <span className="text-destructive">*</span>
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
                                        className={`focus-visible:ring-[#7CE0A8] ${errors.deskripsi ? "border-destructive" : ""}`}
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

                                {/* 6. Hasil Pekerjaan */}
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
                                                    <img
                                                        src={img.preview}
                                                        alt="Hasil Pekerjaan"
                                                        className="object-cover w-full h-full rounded-lg border-2 border-[#7CE0A8]/20"
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
                                                className="aspect-square border-2 border-dashed border-[#7CE0A8]/50 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#7CE0A8] hover:bg-[#7CE0A8]/5 transition-colors"
                                            >
                                                <ImagePlus className="h-8 w-8 text-[#7CE0A8] mb-2" />
                                                <span className="text-xs text-[#7CE0A8]">
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

                                {/* 7. Lokasi/Jangkauan Area */}
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
                                            triggerClassName="flex-1 focus:ring-[#7CE0A8]"
                                        />
                                        <Button
                                            type="button"
                                            onClick={handleAddLokasi}
                                            disabled={!currentLokasi}
                                            className="h-12 px-6 bg-[#7CE0A8] hover:bg-[#6BC999] text-white"
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
                                                    className="px-3 py-1.5 text-sm bg-[#7CE0A8]/20 text-[#5AB88A] hover:bg-[#7CE0A8]/30 border-[#7CE0A8]/30"
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
                                        className="flex-1 h-12 border-[#7CE0A8]/50 text-[#7CE0A8] hover:bg-[#7CE0A8]/10"
                                        disabled={isSubmitting}
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 h-12 bg-[#7CE0A8] hover:bg-[#6BC999] text-white"
                                        disabled={isSubmitting}
                                    >
                                        Lanjutkan ke Data Pribadi
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Data Pribadi */}
                {currentStep === 2 && (
                    <Card className="rounded-2xl overflow-hidden border-[#7CE0A8]/20">
                        <CardHeader className="bg-gradient-to-r from-[#7CE0A8]/10 to-[#7CE0A8]/5 py-6">
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handlePrevStep}
                                    className="rounded-full hover:bg-[#7CE0A8]/20 hover:text-[#7CE0A8]"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <div>
                                    <CardTitle className="text-2xl text-[#7CE0A8]">Data Pribadi</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Lengkapi data pribadi dan dokumen pendukung
                                    </p>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Informasi Kontak */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-[#7CE0A8] flex items-center gap-2">
                                        <Mail className="h-5 w-5" />
                                        Informasi Kontak
                                    </h3>

                                    {/* Email */}
                                    <div id="email" className="space-y-2">
                                        <Label htmlFor="email-input" className="text-base font-semibold">
                                            Email <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="email-input"
                                            type="email"
                                            placeholder="nama@email.com"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                setErrors((prev) => ({ ...prev, email: "" }));
                                            }}
                                            className={`h-12 focus-visible:ring-[#7CE0A8] ${errors.email ? "border-destructive" : ""}`}
                                        />
                                        {errors.email && (
                                            <p className="text-sm text-destructive flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors.email}
                                            </p>
                                        )}
                                    </div>

                                    {/* Telepon */}
                                    <div id="telepon" className="space-y-2">
                                        <Label htmlFor="telepon-input" className="text-base font-semibold">
                                            Nomor Telepon <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="telepon-input"
                                            type="tel"
                                            placeholder="08xxxxxxxxxx"
                                            value={telepon}
                                            onChange={(e) => {
                                                setTelepon(e.target.value);
                                                setErrors((prev) => ({ ...prev, telepon: "" }));
                                            }}
                                            className={`h-12 focus-visible:ring-[#7CE0A8] ${errors.telepon ? "border-destructive" : ""}`}
                                        />
                                        {errors.telepon && (
                                            <p className="text-sm text-destructive flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors.telepon}
                                            </p>
                                        )}
                                    </div>

                                    {/* Alamat */}
                                    <div id="alamat" className="space-y-2">
                                        <Label htmlFor="alamat-textarea" className="text-base font-semibold">
                                            Alamat Lengkap <span className="text-destructive">*</span>
                                        </Label>
                                        <Textarea
                                            id="alamat-textarea"
                                            placeholder="Jl. Contoh No. 123, Kelurahan, Kecamatan, Kota"
                                            value={alamat}
                                            onChange={(e) => {
                                                setAlamat(e.target.value);
                                                setErrors((prev) => ({ ...prev, alamat: "" }));
                                            }}
                                            rows={3}
                                            className={`focus-visible:ring-[#7CE0A8] ${errors.alamat ? "border-destructive" : ""}`}
                                        />
                                        {errors.alamat && (
                                            <p className="text-sm text-destructive flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors.alamat}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-[#7CE0A8] flex items-center gap-2">
                                        <Lock className="h-5 w-5" />
                                        Keamanan Akun
                                    </h3>

                                    <div id="password" className="space-y-2">
                                        <Label htmlFor="password-input" className="text-base font-semibold">
                                            Password <span className="text-destructive">*</span>
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="password-input"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Minimal 8 karakter"
                                                value={password}
                                                onChange={(e) => {
                                                    setPassword(e.target.value);
                                                    setErrors((prev) => ({ ...prev, password: "" }));
                                                }}
                                                className={`h-12 focus-visible:ring-[#7CE0A8] ${errors.password ? "border-destructive" : ""}`}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-2 top-1/2 -translate-y-1/2"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                        {errors.password && (
                                            <p className="text-sm text-destructive flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors.password}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Password harus mengandung huruf besar, huruf kecil, dan angka
                                        </p>
                                    </div>

                                    <div id="confirmPassword" className="space-y-2">
                                        <Label htmlFor="confirm-password-input" className="text-base font-semibold">
                                            Konfirmasi Password <span className="text-destructive">*</span>
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="confirm-password-input"
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="Ulangi password"
                                                value={confirmPassword}
                                                onChange={(e) => {
                                                    setConfirmPassword(e.target.value);
                                                    setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                                                }}
                                                className={`h-12 focus-visible:ring-[#7CE0A8] ${errors.confirmPassword ? "border-destructive" : ""}`}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-2 top-1/2 -translate-y-1/2"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                        {errors.confirmPassword && (
                                            <p className="text-sm text-destructive flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors.confirmPassword}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Tipe Mitra */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-[#7CE0A8] flex items-center gap-2">
                                        <Building className="h-5 w-5" />
                                        Tipe Mitra
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setTipeMitra("individu")}
                                            className={`p-6 rounded-lg border-2 transition-all ${tipeMitra === "individu"
                                                ? "border-[#7CE0A8] bg-[#7CE0A8]/10"
                                                : "border-muted hover:border-[#7CE0A8]/50"
                                                }`}
                                        >
                                            <div className="flex flex-col items-center">
                                                <User className="h-12 w-12 text-[#7CE0A8] mb-3" />
                                                <span className="font-semibold">Individu</span>
                                                <p className="text-sm text-muted-foreground text-center mt-2">
                                                    Freelancer atau pekerja mandiri
                                                </p>
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTipeMitra("perusahaan")}
                                            className={`p-6 rounded-lg border-2 transition-all ${tipeMitra === "perusahaan"
                                                ? "border-[#7CE0A8] bg-[#7CE0A8]/10"
                                                : "border-muted hover:border-[#7CE0A8]/50"
                                                }`}
                                        >
                                            <div className="flex flex-col items-center">
                                                <Building className="h-12 w-12 text-[#7CE0A8] mb-3" />
                                                <span className="font-semibold">Perusahaan</span>
                                                <p className="text-sm text-muted-foreground text-center mt-2">
                                                    Perusahaan resmi dengan legalitas
                                                </p>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Dokumen Pendukung */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-[#7CE0A8] flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Dokumen Pendukung
                                    </h3>

                                    {/* Foto KTP */}
                                    <div id="fotoKTP" className="space-y-2">
                                        <Label className="text-base font-semibold">
                                            Foto KTP <span className="text-destructive">*</span>
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Upload foto KTP yang jelas. Format: JPG, PNG. Maksimal 5MB.
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                                            {fotoKTPPreview ? (
                                                <div className="relative w-48 h-32 rounded-lg overflow-hidden border-2 border-[#7CE0A8]/30">
                                                    <img
                                                        src={fotoKTPPreview}
                                                        alt="Preview KTP"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <label
                                                    htmlFor="foto-ktp-input"
                                                    className="w-48 h-32 rounded-lg border-2 border-dashed border-[#7CE0A8]/50 flex flex-col items-center justify-center cursor-pointer hover:border-[#7CE0A8] hover:bg-[#7CE0A8]/5 transition-colors"
                                                >
                                                    <Camera className="h-8 w-8 text-[#7CE0A8] mb-2" />
                                                    <span className="text-xs text-center text-[#7CE0A8] px-2">
                                                        Foto KTP
                                                    </span>
                                                </label>
                                            )}
                                            <input
                                                id="foto-ktp-input"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFotoKTPChange}
                                                className="hidden"
                                            />
                                            {fotoKTP.file && (
                                                <div className="flex flex-col items-center sm:items-start gap-2">
                                                    <div className="text-sm text-[#7CE0A8] flex items-center gap-2">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        <span className="text-xs sm:text-sm">{fotoKTP.displayName}</span>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={handleRemoveFotoKTP}
                                                        className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 h-8 px-3"
                                                    >
                                                        <X className="h-3 w-3 mr-1" />
                                                        Hapus
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        {errors.fotoKTP && (
                                            <p className="text-sm text-destructive flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors.fotoKTP}
                                            </p>
                                        )}
                                    </div>

                                    {/* Foto dengan KTP */}
                                    <div id="fotoDenganKTP" className="space-y-2">
                                        <Label className="text-base font-semibold">
                                            Foto Selfie dengan KTP <span className="text-destructive">*</span>
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Upload foto selfie Anda memegang KTP. Format: JPG, PNG. Maksimal 5MB.
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                                            <label
                                                htmlFor="foto-dengan-ktp-input"
                                                className="w-48 h-32 rounded-lg border-2 border-dashed border-[#7CE0A8]/50 flex flex-col items-center justify-center cursor-pointer hover:border-[#7CE0A8] hover:bg-[#7CE0A8]/5 transition-colors"
                                            >
                                                <Camera className="h-8 w-8 text-[#7CE0A8] mb-2" />
                                                <span className="text-xs text-center text-[#7CE0A8] px-2">
                                                    Foto dengan KTP
                                                </span>
                                            </label>
                                            <input
                                                id="foto-dengan-ktp-input"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFotoDenganKTPChange}
                                                className="hidden"
                                            />
                                            {fotoDenganKTP.file && (
                                                <div className="flex flex-col items-center sm:items-start gap-2">
                                                    <div className="text-sm text-[#7CE0A8] flex items-center gap-2">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        <span className="text-xs sm:text-sm">{fotoDenganKTP.displayName}</span>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={handleRemoveFotoDenganKTP}
                                                        className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 h-8 px-3"
                                                    >
                                                        <X className="h-3 w-3 mr-1" />
                                                        Hapus
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        {errors.fotoDenganKTP && (
                                            <p className="text-sm text-destructive flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors.fotoDenganKTP}
                                            </p>
                                        )}
                                    </div>

                                    {/* SKCK */}
                                    <div id="skck" className="space-y-2">
                                        <Label className="text-base font-semibold">
                                            SKCK <span className="text-destructive">*</span>
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Upload SKCK. Format: PDF, JPG, PNG. Maksimal 5MB.
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                                            <label
                                                htmlFor="skck-input"
                                                className="w-48 h-32 rounded-lg border-2 border-dashed border-[#7CE0A8]/50 flex flex-col items-center justify-center cursor-pointer hover:border-[#7CE0A8] hover:bg-[#7CE0A8]/5 transition-colors"
                                                >
                                                <FileText className="h-8 w-8 text-[#7CE0A8] mb-2" />
                                                <span className="text-xs text-center text-[#7CE0A8] px-2">
                                                    Upload SKCK
                                                </span>
                                            </label>
                                            <input
                                                id="skck-input"
                                                type="file"
                                                accept="application/pdf,image/*"
                                                onChange={handleSkckChange}
                                                className="hidden"
                                            />
                                            {skck.file && (
                                                <div className="flex flex-col items-center sm:items-start gap-2">
                                                    <div className="text-sm text-[#7CE0A8] flex items-center gap-2">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        <span className="text-xs sm:text-sm">{skck.displayName}</span>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={handleRemoveSkck}
                                                        className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 h-8 px-3"
                                                    >
                                                        <X className="h-3 w-3 mr-1" />
                                                        Hapus
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        {errors.skck && (
                                            <p className="text-sm text-destructive flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors.skck}
                                            </p>
                                        )}
                                    </div>

                                    {/* CV untuk Individu */}
                                    {tipeMitra === "individu" && (
                                        <div id="cv" className="space-y-2">
                                            <Label className="text-base font-semibold">
                                                CV (Curriculum Vitae) <span className="text-destructive">*</span>
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                Upload CV Anda yang berisi pengalaman kerja, keahlian, dan riwayat pendidikan. Format: PDF, DOC, DOCX. Maksimal 5MB.
                                            </p>
                                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                                                <label
                                                    htmlFor="cv-input"
                                                    className="w-48 h-32 rounded-lg border-2 border-dashed border-[#7CE0A8]/50 flex flex-col items-center justify-center cursor-pointer hover:border-[#7CE0A8] hover:bg-[#7CE0A8]/5 transition-colors"
                                                >
                                                    <FileUser className="h-8 w-8 text-[#7CE0A8] mb-2" />
                                                    <span className="text-xs text-center text-[#7CE0A8] px-2">
                                                        Upload CV
                                                    </span>
                                                </label>
                                                <input
                                                    id="cv-input"
                                                    type="file"
                                                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                                    onChange={handleCvChange}
                                                    className="hidden"
                                                />
                                                {cv.file && (
                                                    <div className="flex flex-col items-center sm:items-start gap-2">
                                                        <div className="text-sm text-[#7CE0A8] flex items-center gap-2">
                                                            <CheckCircle2 className="h-4 w-4" />
                                                            <span className="text-xs sm:text-sm">{cv.displayName}</span>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={handleRemoveCv}
                                                            className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 h-8 px-3"
                                                        >
                                                            <X className="h-3 w-3 mr-1" />
                                                            Hapus
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                            {errors.cv && (
                                                <p className="text-sm text-destructive flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {errors.cv}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* SIUP untuk Perusahaan */}
                                    {tipeMitra === "perusahaan" && (
                                        <div id="siup" className="space-y-2">
                                            <Label className="text-base font-semibold">
                                                SIUP (Surat Izin Usaha Perdagangan) <span className="text-destructive">*</span>
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                Upload SIUP. Format: PDF, JPG, PNG. Maksimal 5MB.
                                            </p>
                                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                                                <label
                                                    htmlFor="siup-input"
                                                    className="w-48 h-32 rounded-lg border-2 border-dashed border-[#7CE0A8]/50 flex flex-col items-center justify-center cursor-pointer hover:border-[#7CE0A8] hover:bg-[#7CE0A8]/5 transition-colors"
                                                >
                                                    <Building className="h-8 w-8 text-[#7CE0A8] mb-2" />
                                                    <span className="text-xs text-center text-[#7CE0A8] px-2">
                                                        Upload SIUP
                                                    </span>
                                                </label>
                                                <input
                                                    id="siup-input"
                                                    type="file"
                                                    accept="application/pdf,image/*"
                                                    onChange={handleSiupChange}
                                                    className="hidden"
                                                />
                                                {siup.file && (
                                                    <div className="flex flex-col items-center sm:items-start gap-2">
                                                        <div className="text-sm text-[#7CE0A8] flex items-center gap-2">
                                                            <CheckCircle2 className="h-4 w-4" />
                                                            <span className="text-xs sm:text-sm">{siup.displayName}</span>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={handleRemoveSiup}
                                                            className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 h-8 px-3"
                                                        >
                                                            <X className="h-3 w-3 mr-1" />
                                                            Hapus
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                            {errors.siup && (
                                                <p className="text-sm text-destructive flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {errors.siup}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <div className="flex gap-4 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handlePrevStep}
                                        className="flex-1 h-12 border-[#7CE0A8]/50 text-[#7CE0A8] hover:bg-[#7CE0A8]/10"
                                        disabled={isSubmitting}
                                    >
                                        Kembali
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 h-12 bg-[#7CE0A8] hover:bg-[#6BC999] text-white"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="animate-spin mr-2">⏳</span>
                                                Mendaftarkan...
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheck className="h-4 w-4 mr-2" />
                                                Daftar Sekarang
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <div className="mt-10">
                    <SiteFooter />
                </div>
            </main>

            {/* KTP Crop Modal dengan Zoom */}
            <Dialog open={showKtpCropModal} onOpenChange={setShowKtpCropModal}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="text-[#7CE0A8]">Crop Foto KTP</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Sesuaikan area crop sesuai dengan ukuran KTP untuk hasil yang optimal
                        </p>

                        {/* Zoom Controls */}
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium">Zoom: {zoom.toFixed(1)}x</span>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleZoomOut}
                                        disabled={zoom <= 0.5}
                                        className="h-8 w-8"
                                    >
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <Slider
                                        value={[zoom]}
                                        min={0.5}
                                        max={3}
                                        step={0.1}
                                        onValueChange={([value]) => setZoom(value)}
                                        className="w-32"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleZoomIn}
                                        disabled={zoom >= 3}
                                        className="h-8 w-8"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setZoom(1)}
                                >
                                    Reset Zoom
                                </Button>
                            </div>
                        </div>

                        {cropImageSrc && (
                            <div className="relative max-h-[500px] overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                <ReactCrop
                                    crop={crop}
                                    onChange={(c) => setCrop(c)}
                                    aspect={853 / 540} // KTP aspect ratio
                                    minWidth={300}
                                    minHeight={200}
                                    ruleOfThirds
                                    className="bg-gray-50"
                                >
                                    <img
                                        ref={imageRef}
                                        src={cropImageSrc}
                                        alt="KTP untuk crop"
                                        style={{
                                            transform: `scale(${zoom})`,
                                            transformOrigin: 'center',
                                            width: '100%',
                                            height: 'auto'
                                        }}
                                    />
                                </ReactCrop>
                            </div>
                        )}

                        <div className="text-sm text-muted-foreground">
                            <p className="font-medium mb-2">Pastikan semua informasi KTP terbaca dengan jelas:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Nama lengkap</li>
                                <li>NIK</li>
                                <li>Tempat/tanggal lahir</li>
                                <li>Alamat</li>
                                <li>Foto wajah</li>
                            </ul>
                            <p className="mt-3 text-amber-600 dark:text-amber-400">
                                Tips: Gunakan zoom untuk memperjelas detail, lalu atur area crop sesuai dengan batas KTP
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowKtpCropModal(false);
                                if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
                                setCropImageSrc(null);
                                setZoom(1);
                            }}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={handleCropComplete}
                            className="bg-[#7CE0A8] hover:bg-[#6BC999]"
                        >
                            Simpan Crop
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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