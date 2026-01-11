// app/mitra/dashboard/services/page.tsx - REAL-TIME UPDATE VERSION
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  ImageIcon,
  Camera,
  Upload,
  Check,
  AlertCircle,
  DollarSign,
  Tag,
  Info,
  Eye,
  EyeOff,
  ImagePlus,
  Shield,
  AirVent,
  PlugZap,
  Brush,
  ShowerHead,
  Toilet,
  Trees,
  Armchair,
  Loader2
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/app/components/ui/dialog";
import { AspectRatio } from "@/app/components/ui/aspect-ratio";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Switch } from "@/app/components/ui/switch";
import { toast } from "sonner";

type ServiceItem = {
  service_id: string;
  name: string;
  price: number;
  price_type: "FIXED" | "HOURLY" | "UNIT";
  description: string;
  is_active: boolean;
  estimated_time?: string;
};

type WorkImage = {
  gallery_id: string;
  image_url: string;
  caption?: string;
  sort_order: number;
  created_at: string;
};

const SERVICE_CATEGORIES = {
  ac: {
    id: "ac",
    name: "Tukang AC",
    icon: <AirVent className="h-6 w-6 text-sky-500" />,
    description: "Layanan instalasi, perbaikan, dan perawatan AC"
  },
  electrical: {
    id: "electrical",
    name: "Tukang Listrik",
    icon: <PlugZap className="h-6 w-6 text-yellow-500" />,
    description: "Instalasi listrik dan perbaikan kelistrikan"
  },
  cleaning: {
    id: "cleaning",
    name: "Tukang Pembersihan Rumah",
    icon: <Brush className="h-6 w-6 text-emerald-500" />,
    description: "Pembersihan rumah dan lingkungan"
  },
  plumbing: {
    id: "plumbing",
    name: "Tukang Ledeng",
    icon: <ShowerHead className="h-6 w-6 text-cyan-500" />,
    description: "Perbaikan dan instalasi pipa air"
  },
  "sedot-wc": {
    id: "sedot-wc",
    name: "Tukang Sedot WC",
    icon: <Toilet className="h-6 w-6 text-indigo-500" />,
    description: "Penyedotan septic tank dan perbaikan WC"
  },
  garden: {
    id: "garden",
    name: "Tukang Kebun",
    icon: <Trees className="h-6 w-6 text-green-600" />,
    description: "Perawatan dan pembuatan taman"
  },
  furniture: {
    id: "furniture",
    name: "Tukang Mebel",
    icon: <Armchair className="h-6 w-6 text-amber-600" />,
    description: "Pembuatan dan perbaikan furnitur"
  }
};

const MAX_WORK_IMAGES = 6;

export default function ServicesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isEditingService, setIsEditingService] = useState(false);
  const [currentService, setCurrentService] = useState<ServiceItem | null>(null);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [newService, setNewService] = useState<Omit<ServiceItem, 'service_id'>>({
    name: "",
    price: 0,
    price_type: "FIXED",
    description: "",
    is_active: true,
    estimated_time: ""
  });

  const [workImages, setWorkImages] = useState<WorkImage[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [currentImage, setCurrentImage] = useState<WorkImage | null>(null);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [vendorData, setVendorData] = useState<any>(null);
  const [priceInput, setPriceInput] = useState<string>("");

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('[Services Page] Fetching data...');
      
      // Fetch vendor profile
      const profileResponse = await fetch('/api/mitra/profile', {
        method: 'GET',
        credentials: 'include',
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setVendorData(profileData.vendor);
        if (profileData.vendor.category) {
          setSelectedCategory(profileData.vendor.category);
        }
        console.log('[Services Page] Profile loaded');
      }

      // Fetch services
      const servicesResponse = await fetch('/api/mitra/services', {
        method: 'GET',
        credentials: 'include',
      });

      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        setServices(servicesData.services || []);
        console.log('[Services Page] Services loaded:', servicesData.services?.length || 0);
      }

      // Fetch gallery
      const galleryResponse = await fetch('/api/mitra/gallery', {
        method: 'GET',
        credentials: 'include',
      });

      if (galleryResponse.ok) {
        const galleryData = await galleryResponse.json();
        console.log('[Services Page] Gallery loaded:', galleryData.gallery?.length || 0);
        setWorkImages(galleryData.gallery || []);
      } else {
        console.error('[Services Page] Failed to fetch gallery:', galleryResponse.status);
      }
    } catch (error) {
      console.error('[Services Page] Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (isServiceDialogOpen && isEditingService && currentService) {
      setPriceInput(currentService.price === 0 ? "" : currentService.price.toString());
    } else if (isServiceDialogOpen && !isEditingService) {
      setPriceInput("");
    }
  }, [isServiceDialogOpen, isEditingService, currentService]);

  const handleAddService = () => {
    setCurrentService(null);
    setNewService({
      name: "",
      price: 0,
      price_type: "FIXED",
      description: "",
      is_active: true,
      estimated_time: ""
    });
    setPriceInput("");
    setIsEditingService(false);
    setIsServiceDialogOpen(true);
  };

  const handleEditService = (service: ServiceItem) => {
    setCurrentService(service);
    setNewService({
      name: service.name,
      price: service.price,
      price_type: service.price_type,
      description: service.description,
      is_active: service.is_active,
      estimated_time: service.estimated_time || ""
    });
    setPriceInput(service.price === 0 ? "" : service.price.toString());
    setIsEditingService(true);
    setIsServiceDialogOpen(true);
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus layanan ini?")) return;

    try {
      const response = await fetch(`/api/mitra/services?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Gagal menghapus layanan');
      }

      setServices(services.filter(service => service.service_id !== id));
      setSuccessMessage("Layanan berhasil dihapus");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error deleting service:', error);
      toast.error(error.message || 'Gagal menghapus layanan');
    }
  };

  const handleSaveService = async () => {
    const priceValue = priceInput === "" ? 0 : parseFloat(priceInput) || 0;

    try {
      let response;
      
      if (isEditingService && currentService) {
        response = await fetch('/api/mitra/services', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            service_id: currentService.service_id,
            ...newService,
            price: priceValue
          }),
        });
      } else {
        response = await fetch('/api/mitra/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            ...newService,
            price: priceValue
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menyimpan layanan');
      }

      const data = await response.json();
      
      if (isEditingService && currentService) {
        setServices(services.map(service =>
          service.service_id === currentService.service_id ? data.service : service
        ));
        setSuccessMessage("Layanan berhasil diperbarui");
      } else {
        setServices([...services, data.service]);
        setSuccessMessage("Layanan baru berhasil ditambahkan");
      }

      setIsServiceDialogOpen(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error saving service:', error);
      toast.error(error.message || 'Terjadi kesalahan');
    }
  };

  const toggleServiceActive = async (id: string) => {
    const service = services.find(s => s.service_id === id);
    if (!service) return;

    try {
      const response = await fetch('/api/mitra/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          service_id: id,
          is_active: !service.is_active
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal memperbarui status layanan');
      }

      const data = await response.json();
      setServices(services.map(service =>
        service.service_id === id ? data.service : service
      ));
    } catch (error: any) {
      console.error('Error toggling service active:', error);
      toast.error(error.message || 'Terjadi kesalahan');
    }
  };

  // ✅ FIXED: Real-time upload tanpa reload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (workImages.length + files.length > MAX_WORK_IMAGES) {
      toast.error(`Maksimal ${MAX_WORK_IMAGES} foto portofolio`);
      return;
    }

    setIsUploadingImage(true);
    setUploadingCount(files.length);

    try {
      let successCount = 0;
      const newImages: WorkImage[] = [];
      
      for (const file of files) {
        console.log('[Upload] Processing file:', file.name, 'size:', file.size);
        
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`File ${file.name} melebihi 5MB`);
          continue;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`File ${file.name} bukan gambar`);
          continue;
        }

        const formData = new FormData();
        formData.append('image', file);
        formData.append('caption', 'Hasil pekerjaan');

        console.log('[Upload] Uploading to /api/mitra/gallery...');

        const response = await fetch('/api/mitra/gallery', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        console.log('[Upload] Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('[Upload] Error response:', errorData);
          toast.error(errorData.error || 'Gagal mengupload gambar');
          continue;
        }

        const result = await response.json();
        console.log('[Upload] Success:', result);
        
        // ✅ Tambahkan gambar baru ke array untuk update state
        if (result.gallery) {
          newImages.push(result.gallery);
          successCount++;
        }
      }

      if (successCount > 0) {
        // ✅ Update state langsung tanpa fetch ulang
        setWorkImages(prevImages => [...prevImages, ...newImages]);
        
        const message = `${successCount} foto berhasil diupload`;
        setSuccessMessage(message);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        toast.success(message);
        
        console.log('[Upload] State updated with new images:', newImages.length);
      }
    } catch (error: any) {
      console.error('[Upload] Error uploading images:', error);
      toast.error(error.message || 'Gagal mengupload gambar');
    } finally {
      setIsUploadingImage(false);
      setUploadingCount(0);
      e.target.value = ''; // Reset input
    }
  };

  // ✅ FIXED: Real-time delete tanpa reload
  const handleDeleteImage = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus foto ini?")) return;

    setIsDeletingImage(true);

    try {
      console.log('[Delete] Deleting image:', id);

      const response = await fetch(`/api/mitra/gallery?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menghapus foto');
      }

      console.log('[Delete] Success');
      
      // ✅ Update state langsung tanpa fetch ulang
      setWorkImages(prevImages => prevImages.filter(img => img.gallery_id !== id));
      
      setSuccessMessage("Foto berhasil dihapus");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      toast.success("Foto berhasil dihapus");
    } catch (error: any) {
      console.error('[Delete] Error deleting image:', error);
      toast.error(error.message || 'Gagal menghapus foto');
    } finally {
      setIsDeletingImage(false);
    }
  };

  const formatPrice = (price: number, type: ServiceItem['price_type']) => {
    const formattedPrice = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);

    switch (type) {
      case 'HOURLY':
        return `${formattedPrice}/jam`;
      case 'UNIT':
        return `${formattedPrice}/unit`;
      default:
        return formattedPrice;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handlePriceChange = (value: string) => {
    const cleanValue = value.replace(/[^\d.]/g, '');
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      setPriceInput(parts[0] + '.' + parts.slice(1).join(''));
    } else {
      setPriceInput(cleanValue);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-950">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-6">
                <Skeleton className="h-64 rounded-xl" />
                <Skeleton className="h-48 rounded-xl" />
              </div>
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-96 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-950">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
              Services
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mt-2">
              Atur layanan yang Anda tawarkan dan tampilkan portofolio pekerjaan
            </p>
          </div>
        </div>

        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6"
          >
            <Alert className="border-[#7CE0A8] bg-[#7CE0A8]/10">
              <Check className="h-4 w-4 text-[#7CE0A8]" />
              <AlertDescription className="text-[#5AB88A]">
                {successMessage}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* ✅ Upload Progress Indicator */}
        {isUploadingImage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-900/20">
              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                Mengupload {uploadingCount} foto... Mohon tunggu
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stats */}
          <div className="lg:col-span-1">
            <Card className="border-[#7CE0A8]/20 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#7CE0A8]/10 to-[#7CE0A8]/5 py-6">
                <CardTitle className="text-xl text-[#7CE0A8]">Kategori Jasa</CardTitle>
                <CardDescription>
                  Kategori yang Anda pilih saat pendaftaran
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {selectedCategory && SERVICE_CATEGORIES[selectedCategory as keyof typeof SERVICE_CATEGORIES] && (
                  <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                    <div className="p-3 bg-[#7CE0A8]/20 rounded-lg">
                      {SERVICE_CATEGORIES[selectedCategory as keyof typeof SERVICE_CATEGORIES]?.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-white">
                        {SERVICE_CATEGORIES[selectedCategory as keyof typeof SERVICE_CATEGORIES]?.name}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {SERVICE_CATEGORIES[selectedCategory as keyof typeof SERVICE_CATEGORIES]?.description}
                      </p>
                    </div>
                  </div>
                )}

                {vendorData?.verified && (
                  <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm text-emerald-700 dark:text-emerald-300">
                      Verified Mitra
                    </span>
                  </div>
                )}

                <Separator className="my-6" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Total Layanan</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {services.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Layanan Aktif</span>
                    <span className="font-semibold text-[#7CE0A8]">
                      {services.filter(s => s.is_active).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Foto Portofolio</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {workImages.length}/{MAX_WORK_IMAGES}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="services" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="services" className="data-[state=active]:bg-[#7CE0A8] data-[state=active]:text-white">
                  <Tag className="h-4 w-4 mr-2" />
                  Layanan
                </TabsTrigger>
                <TabsTrigger value="portfolio" className="data-[state=active]:bg-[#7CE0A8] data-[state=active]:text-white">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Portofolio
                </TabsTrigger>
              </TabsList>

              {/* Services Tab */}
              <TabsContent value="services">
                <Card className="border-[#7CE0A8]/20 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-[#7CE0A8]/10 to-[#7CE0A8]/5 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl text-[#7CE0A8]">Layanan yang Ditawarkan</CardTitle>
                        <CardDescription>
                          Kelola daftar layanan dan harga yang Anda tawarkan
                        </CardDescription>
                      </div>
                      <Button
                        onClick={handleAddService}
                        className="bg-gradient-to-r from-[#7CE0A8] to-[#5AB894] hover:from-[#6BC999] hover:to-[#4BA683] text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Layanan
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {services.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-lg">
                        <Tag className="h-12 w-12 text-gray-400 dark:text-neutral-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          Belum Ada Layanan
                        </h3>
                        <p className="text-gray-500 dark:text-neutral-400 mb-4">
                          Tambahkan layanan pertama Anda untuk mulai menerima pesanan
                        </p>
                        <Button 
                          onClick={handleAddService}
                          className="bg-gradient-to-r from-[#7CE0A8] to-[#5AB894] hover:from-[#6BC999] hover:to-[#4BA683] text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Tambah Layanan Pertama
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {services.map((service) => (
                          <motion.div
                            key={service.service_id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 hover:border-[#7CE0A8]/50 transition-all"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-semibold text-neutral-900 dark:text-white">
                                      {service.name}
                                    </h4>
                                    {service.is_active ? (
                                      <Badge className="bg-[#7CE0A8]/20 text-[#5AB88A] border-[#7CE0A8]/30">
                                        Aktif
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-gray-500">
                                        Nonaktif
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="font-bold text-lg text-[#7CE0A8]">
                                    {formatPrice(service.price, service.price_type)}
                                  </span>
                                </div>

                                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 line-clamp-2">
                                  {service.description}
                                </p>

                                <div className="flex flex-wrap gap-2 text-xs">
                                  {service.estimated_time && (
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-neutral-700 rounded">
                                      ⏱️ {service.estimated_time}
                                    </span>
                                  )}
                                  <span className="px-2 py-1 bg-gray-100 dark:bg-neutral-700 rounded">
                                    {service.price_type === 'FIXED' ? 'Harga Tetap' :
                                      service.price_type === 'HOURLY' ? 'Per Jam' :
                                      'Per Unit'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Aktif</span>
                                  <Switch
                                    checked={service.is_active}
                                    onCheckedChange={() => toggleServiceActive(service.service_id)}
                                  />
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditService(service)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteService(service.service_id)}
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Portfolio Tab */}
              <TabsContent value="portfolio">
                <Card className="border-[#7CE0A8]/20 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-[#7CE0A8]/10 to-[#7CE0A8]/5 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl text-[#7CE0A8]">Hasil Pekerjaan</CardTitle>
                        <CardDescription>
                          Tampilkan portofolio pekerjaan terbaik Anda ({workImages.length}/{MAX_WORK_IMAGES} foto)
                        </CardDescription>
                      </div>
                      <div>
                        <input
                          type="file"
                          id="portfolio-upload"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={isUploadingImage || workImages.length >= MAX_WORK_IMAGES}
                        />
                        <label htmlFor="portfolio-upload">
                          <Button
                            variant="outline"
                            className={`border-[#7CE0A8] text-[#7CE0A8] hover:bg-[#7CE0A8]/10 ${
                              isUploadingImage || workImages.length >= MAX_WORK_IMAGES
                                ? 'opacity-50 cursor-not-allowed'
                                : 'cursor-pointer'
                            }`}
                            disabled={isUploadingImage || workImages.length >= MAX_WORK_IMAGES}
                            asChild
                          >
                            <span>
                              {isUploadingImage ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <ImagePlus className="h-4 w-4 mr-2" />
                              )}
                              {isUploadingImage ? 'Mengupload...' : 'Upload Foto'}
                            </span>
                          </Button>
                        </label>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {workImages.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-lg">
                        <Camera className="h-12 w-12 text-gray-400 dark:text-neutral-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          Belum Ada Foto Portofolio
                        </h3>
                        <p className="text-gray-500 dark:text-neutral-400 mb-4">
                          Upload foto hasil pekerjaan terbaik Anda untuk menarik pelanggan
                        </p>
                        <input
                          type="file"
                          id="portfolio-upload-empty"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={isUploadingImage}
                        />
                        <label htmlFor="portfolio-upload-empty">
                          <Button 
                            className="bg-gradient-to-r from-[#7CE0A8] to-[#5AB894] hover:from-[#6BC999] hover:to-[#4BA683] text-white cursor-pointer"
                            disabled={isUploadingImage}
                            asChild
                          >
                            <span>
                              {isUploadingImage ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4 mr-2" />
                              )}
                              {isUploadingImage ? 'Mengupload...' : 'Upload Foto Pertama'}
                            </span>
                          </Button>
                        </label>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {workImages.map((image, index) => (
                          <motion.div
                            key={image.gallery_id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-neutral-700 hover:border-[#7CE0A8]/50 transition-all"
                          >
                            <AspectRatio ratio={4 / 3}>
                              <img
                                src={image.image_url}
                                alt={image.caption || "Hasil pekerjaan"}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "/placeholder-image.jpg";
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                  <p className="text-sm font-medium truncate">
                                    {image.caption || "Hasil pekerjaan"}
                                  </p>
                                  <p className="text-xs opacity-90">
                                    {formatDate(image.created_at)}
                                  </p>
                                </div>
                              </div>
                            </AspectRatio>

                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setCurrentImage(image);
                                  setIsImageDialogOpen(true);
                                }}
                                className="h-8 w-8 bg-white/90 hover:bg-white"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteImage(image.gallery_id)}
                                className="h-8 w-8 bg-white/90 hover:bg-white text-red-500"
                                disabled={isDeletingImage}
                              >
                                {isDeletingImage ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </motion.div>
                        ))}

                        {workImages.length < MAX_WORK_IMAGES && (
                          <label htmlFor="portfolio-upload">
                            <div className="aspect-[4/3] border-2 border-dashed border-[#7CE0A8]/50 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#7CE0A8] hover:bg-[#7CE0A8]/5 transition-colors">
                              <ImagePlus className="h-8 w-8 text-[#7CE0A8] mb-2" />
                              <span className="text-sm text-[#7CE0A8]">
                                Tambah Foto
                              </span>
                              <span className="text-xs text-neutral-500 mt-1">
                                ({MAX_WORK_IMAGES - workImages.length} tersisa)
                              </span>
                            </div>
                          </label>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Service Dialog */}
      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#7CE0A8]">
              {isEditingService ? "Edit Layanan" : "Tambah Layanan Baru"}
            </DialogTitle>
            <DialogDescription>
              Isi detail layanan yang akan Anda tawarkan
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="service-name">Nama Layanan *</Label>
              <Input
                id="service-name"
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                placeholder="Contoh: Instalasi AC Split"
                className="focus-visible:ring-[#7CE0A8]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-price">Harga *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="service-price"
                    type="text"
                    value={priceInput}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    placeholder="0"
                    className="focus-visible:ring-[#7CE0A8]"
                  />
                </div>
                <select
                  value={newService.price_type}
                  onChange={(e) =>
                    setNewService({ ...newService, price_type: e.target.value as ServiceItem['price_type'] })
                  }
                  className="w-[140px] flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-[#7CE0A8] focus:ring-offset-2"
                >
                  <option value="FIXED">Harga Tetap</option>
                  <option value="HOURLY">Per Jam</option>
                  <option value="UNIT">Per Unit</option>
                </select>
              </div>
              <p className="text-xs text-neutral-500">
                {priceInput ? `Harga: ${formatPrice(parseFloat(priceInput) || 0, newService.price_type)}` : 'Masukkan harga'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-description">Deskripsi Layanan *</Label>
              <Textarea
                id="service-description"
                value={newService.description}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                placeholder="Jelaskan detail layanan yang diberikan..."
                rows={3}
                className="focus-visible:ring-[#7CE0A8]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated-time">Perkiraan Waktu Pengerjaan</Label>
              <Input
                id="estimated-time"
                value={newService.estimated_time || ''}
                onChange={(e) => setNewService({ ...newService, estimated_time: e.target.value })}
                placeholder="Contoh: 2-3 jam, 1 hari"
                className="focus-visible:ring-[#7CE0A8]"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="service-active"
                checked={newService.is_active}
                onCheckedChange={(checked) => setNewService({ ...newService, is_active: checked })}
              />
              <Label htmlFor="service-active" className="cursor-pointer">
                Tampilkan layanan ini ke pelanggan
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsServiceDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveService}
              className="bg-gradient-to-r from-[#7CE0A8] to-[#5AB894] hover:from-[#6BC999] hover:to-[#4BA683] text-white"
              disabled={!newService.name.trim() || !newService.description.trim() || (!priceInput && !isEditingService)}
            >
              <Save className="h-4 w-4 mr-2" />
              Simpan Layanan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#7CE0A8]">Detail Foto</DialogTitle>
          </DialogHeader>
          {currentImage && (
            <div className="py-4">
              <div className="mb-4 overflow-hidden rounded-lg">
                <AspectRatio ratio={16 / 9}>
                  <img
                    src={currentImage.image_url}
                    alt={currentImage.caption || "Hasil pekerjaan"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder-image.jpg";
                    }}
                  />
                </AspectRatio>
              </div>
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentImage.caption || "Tidak ada deskripsi"}
                </p>
                <Label>Tanggal Upload</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(currentImage.created_at)}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsImageDialogOpen(false)}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}