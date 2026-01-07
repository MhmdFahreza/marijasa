// app/mitra/settings/services/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Image as ImageIcon,
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
  Armchair
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

type ServiceCategory = {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
};

const SERVICE_CATEGORIES: Record<string, ServiceCategory> = {
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
const MAX_IMAGE_SIZE_MB = 5;

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
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [currentImage, setCurrentImage] = useState<WorkImage | null>(null);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string>("ac");
  const [vendorData, setVendorData] = useState<any>(null);

  const [priceInput, setPriceInput] = useState<string>("");

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch vendor profile to get category
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
        }

        // Fetch services
        const servicesResponse = await fetch('/api/mitra/services', {
          method: 'GET',
          credentials: 'include',
        });

        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json();
          setServices(servicesData.services || []);
          setWorkImages(servicesData.gallery || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Gagal memuat data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (isServiceDialogOpen) {
      if (isEditingService && currentService) {
        setPriceInput(currentService.price === 0 ? "" : currentService.price.toString());
      } else {
        setPriceInput("");
      }
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
    if (!confirm("Apakah Anda yakin ingin menghapus layanan ini?")) {
      return;
    }

    try {
      const response = await fetch(`/api/mitra/services?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Gagal menghapus layanan');
      }

      const updatedServices = services.filter(service => service.service_id !== id);
      setServices(updatedServices);
      
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
      if (isEditingService && currentService) {
        // Update existing service
        const response = await fetch('/api/mitra/services', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            service_id: currentService.service_id,
            ...newService,
            price: priceValue
          }),
        });

        if (!response.ok) {
          throw new Error('Gagal memperbarui layanan');
        }

        const data = await response.json();
        
        const updatedServices = services.map(service =>
          service.service_id === currentService.service_id
            ? data.service
            : service
        );
        setServices(updatedServices);
        setSuccessMessage("Layanan berhasil diperbarui");
      } else {
        // Create new service
        const response = await fetch('/api/mitra/services', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            ...newService,
            price: priceValue
          }),
        });

        if (!response.ok) {
          throw new Error('Gagal menambahkan layanan');
        }

        const data = await response.json();
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
        headers: {
          'Content-Type': 'application/json',
        },
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
      
      const updatedServices = services.map(service =>
        service.service_id === id
          ? data.service
          : service
      );
      setServices(updatedServices);
    } catch (error: any) {
      console.error('Error toggling service active:', error);
      toast.error(error.message || 'Terjadi kesalahan');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (workImages.length + files.length > MAX_WORK_IMAGES) {
      toast.error(`Maksimal ${MAX_WORK_IMAGES} foto hasil pekerjaan`);
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        toast.error(`File ${file.name} melebihi ${MAX_IMAGE_SIZE_MB}MB`);
        return false;
      }
      return true;
    });

    // Upload each file
    for (const file of validFiles) {
      try {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('caption', 'Hasil pekerjaan');

        const response = await fetch('/api/mitra/gallery', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Gagal mengupload gambar');
        }

        const data = await response.json();
        
        // Refresh gallery
        const galleryResponse = await fetch('/api/mitra/services', {
          credentials: 'include',
        });
        
        if (galleryResponse.ok) {
          const galleryData = await galleryResponse.json();
          setWorkImages(galleryData.gallery || []);
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error('Gagal mengupload gambar');
      }
    }

    setSuccessMessage(`${validFiles.length} foto berhasil diupload`);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);

    // Reset input
    e.target.value = '';
  };

  const handleEditImage = (image: WorkImage) => {
    setCurrentImage(image);
    setIsEditingImage(true);
    setIsImageDialogOpen(true);
  };

  const handleDeleteImage = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus foto ini?")) {
      return;
    }

    try {
      const response = await fetch(`/api/mitra/gallery?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Gagal menghapus foto');
      }

      const updatedImages = workImages.filter(img => img.gallery_id !== id);
      setWorkImages(updatedImages);
      
      setSuccessMessage("Foto berhasil dihapus");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast.error(error.message || 'Gagal menghapus foto');
    }
  };

  const handleSaveImageDescription = async () => {
    if (!currentImage) return;

    try {
      const response = await fetch('/api/mitra/gallery', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          gallery_id: currentImage.gallery_id,
          caption: currentImage.caption
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal memperbarui deskripsi');
      }

      const updatedImages = workImages.map(img =>
        img.gallery_id === currentImage.gallery_id
          ? { ...img, caption: currentImage.caption }
          : img
      );

      setWorkImages(updatedImages);
      setIsImageDialogOpen(false);
      
      setSuccessMessage("Deskripsi foto berhasil diperbarui");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error saving image description:', error);
      toast.error(error.message || 'Terjadi kesalahan');
    }
  };

  const formatPrice = (price: number, type: ServiceItem['price_type']) => {
    switch (type) {
      case 'HOURLY':
        return `Rp ${price.toLocaleString('id-ID')}/jam`;
      case 'UNIT':
        return `Rp ${price.toLocaleString('id-ID')}/unit`;
      case 'FIXED':
      default:
        return `Rp ${price.toLocaleString('id-ID')}`;
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
    // Hanya boleh ada satu titik desimal
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      setPriceInput(parts[0] + '.' + parts.slice(1).join(''));
    } else {
      setPriceInput(cleanValue);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-1" />
          <Skeleton className="h-96 lg:col-span-2" />
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card className="border-[#7CE0A8]/20 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#7CE0A8]/10 to-[#7CE0A8]/5 py-6">
                <CardTitle className="text-xl text-[#7CE0A8]">Kategori Jasa</CardTitle>
                <CardDescription>
                  Kategori yang Anda pilih saat pendaftaran
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                  <div className="p-3 bg-[#7CE0A8]/20 rounded-lg">
                    {SERVICE_CATEGORIES[selectedCategory]?.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-white">
                      {SERVICE_CATEGORIES[selectedCategory]?.name}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {SERVICE_CATEGORIES[selectedCategory]?.description}
                    </p>
                  </div>
                </div>

                {vendorData && vendorData.verified && (
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
                      {workImages.length}
                    </span>
                  </div>
                </div>

                <Alert className="mt-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-blue-700 dark:text-blue-300 text-sm">
                    Kategori jasa tidak dapat diubah. Hubungi admin jika ingin mengubah kategori.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card className="mt-6 border-blue-200 dark:border-blue-800 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 py-4">
                <CardTitle className="text-lg text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Tips Harga Layanan
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Harga harus kompetitif dengan pasar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Sertakan perkiraan waktu pengerjaan</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Jelaskan secara detail apa yang termasuk dalam harga</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Update harga secara berkala sesuai kondisi</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Tabs defaultValue="services" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="services" className="data-[state=active]:bg-[#7CE0A8] data-[state=active]:text-white">
                  <Tag className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Layanan</span>
                  <span className="sm:hidden">Service</span>
                </TabsTrigger>
                <TabsTrigger value="portfolio" className="data-[state=active]:bg-[#7CE0A8] data-[state=active]:text-white">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Portofolio</span>
                  <span className="sm:hidden">Portfolio</span>
                </TabsTrigger>
              </TabsList>

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
                        className="bg-[#7CE0A8] hover:bg-[#6BC999] text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Tambah Layanan</span>
                        <span className="sm:hidden">Tambah</span>
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
                        <Button onClick={handleAddService} className="bg-[#7CE0A8] hover:bg-[#6BC999] text-white">
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

                                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
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

                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                          {services.length}
                        </div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                          Total Layanan
                        </div>
                      </div>
                      <div className="p-4 bg-[#7CE0A8]/10 rounded-lg">
                        <div className="text-2xl font-bold text-[#7CE0A8]">
                          {services.filter(s => s.is_active).length}
                        </div>
                        <div className="text-sm text-[#5AB88A]">
                          Layanan Aktif
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                          Rp {services.reduce((sum, s) => sum + s.price, 0).toLocaleString('id-ID')}
                        </div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                          Total Range Harga
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

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
                        />
                        <label htmlFor="portfolio-upload">
                          <Button
                            variant="outline"
                            className="border-[#7CE0A8] text-[#7CE0A8] hover:bg-[#7CE0A8]/10 cursor-pointer"
                            asChild
                          >
                            <span>
                              <ImagePlus className="h-4 w-4 mr-2" />
                              <span className="hidden sm:inline">Upload Foto</span>
                              <span className="sm:hidden">Upload</span>
                            </span>
                          </Button>
                        </label>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {workImages.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-lg">
                        <ImageIcon className="h-12 w-12 text-gray-400 dark:text-neutral-600 mx-auto mb-4" />
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
                        />
                        <label htmlFor="portfolio-upload-empty">
                          <Button className="bg-[#7CE0A8] hover:bg-[#6BC999] text-white cursor-pointer" asChild>
                            <span>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Foto Pertama
                            </span>
                          </Button>
                        </label>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {workImages.map((image) => (
                          <motion.div
                            key={image.gallery_id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-neutral-700 hover:border-[#7CE0A8]/50 transition-all"
                          >
                            <AspectRatio ratio={4 / 3}>
                              <img
                                src={image.image_url}
                                alt={image.caption || "Hasil pekerjaan"}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                                onClick={() => handleEditImage(image)}
                                className="h-8 w-8 bg-white/90 hover:bg-white"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteImage(image.gallery_id)}
                                className="h-8 w-8 bg-white/90 hover:bg-white text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
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

                    <Alert className="mt-6 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                      <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm">
                        <p className="font-medium mb-1">Tips foto portofolio yang baik:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Foto hasil kerja yang rapi dan profesional</li>
                          <li>Pencahayaan yang cukup dan jelas</li>
                          <li>Foto sebelum dan sesudah sangat dianjurkan</li>
                          <li>Maksimal {MAX_IMAGE_SIZE_MB}MB per foto</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

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
                Harga akan ditampilkan sebagai: {formatPrice(
                  priceInput === "" ? 0 : parseFloat(priceInput) || 0,
                  newService.price_type
                )}
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
              className="bg-[#7CE0A8] hover:bg-[#6BC999] text-white"
              disabled={!newService.name || !newService.description || (priceInput === "" && !isEditingService)}
            >
              <Save className="h-4 w-4 mr-2" />
              Simpan Layanan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#7CE0A8]">Edit Deskripsi Foto</DialogTitle>
            <DialogDescription>
              Tambahkan deskripsi untuk foto portofolio
            </DialogDescription>
          </DialogHeader>

          {currentImage && (
            <>
              <div className="py-4">
                <div className="mb-4 overflow-hidden rounded-lg">
                  <AspectRatio ratio={16 / 9}>
                    <img
                      src={currentImage.image_url}
                      alt={currentImage.caption || "Hasil pekerjaan"}
                      className="w-full h-full object-cover"
                    />
                  </AspectRatio>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="image-description">Deskripsi</Label>
                    <Textarea
                      id="image-description"
                      value={currentImage.caption || ''}
                      onChange={(e) => setCurrentImage({
                        ...currentImage,
                        caption: e.target.value
                      })}
                      placeholder="Jelaskan pekerjaan dalam foto ini..."
                      rows={3}
                      className="focus-visible:ring-[#7CE0A8] mt-2"
                    />
                  </div>

                  <div className="text-sm text-neutral-500">
                    <p>Upload pada: {formatDate(currentImage.created_at)}</p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsImageDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleSaveImageDescription}
                  className="bg-[#7CE0A8] hover:bg-[#6BC999] text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Deskripsi
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}