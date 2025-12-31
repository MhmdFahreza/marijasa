"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/app/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  Clock,
  CheckCheck,
  MapPin,
  Calendar,
  User,
  Mail,
  Phone,
  Wrench,
  MessageSquare,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Navigation,
  X
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Separator } from "@/app/components/ui/separator";
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Fungsi untuk mendapatkan label service berdasarkan kategori
const getServiceLabel = (category: string, details: any) => {
  switch (category) {
    case 'ac':
      const acServices: Record<string, string> = {
        instalasi: 'Instalasi AC Baru',
        service: 'Perbaikan AC',
        cuci: 'Cuci AC',
        bongkar: 'Bongkar Pasang AC'
      };
      return `${acServices[details.serviceType] || 'Layanan AC'} - ${details.acCount || 1} Unit ${details.acType || ''} ${details.acPk || ''} PK`;

    case 'cleaning':
      const cleaningServices: Record<string, string> = {
        general: 'Pembersihan Rutin',
        deep: 'Pembersihan Mendalam',
        renovasi: 'Pembersihan Renovasi',
        pindahan: 'Pembersihan Pindahan'
      };
      return `${cleaningServices[details.cleaningType] || 'Pembersihan'} - ${details.areaSize || 0} m² (${details.rooms || 0} ruangan)`;

    case 'electrical':
      return `${details.electricalWork?.join(', ') || 'Pekerjaan Listrik'} - ${details.buildingType || ''} (${details.powerCapacity || ''} VA)`;

    case 'plumbing':
      return `${details.plumbingIssues?.join(', ') || 'Pekerjaan Pipa'} - ${details.urgency === 'emergency' ? 'Darurat' : 'Normal'}`;

    case 'garden':
      return `${details.gardenServices?.join(', ') || 'Layanan Taman'} - ${details.gardenSize || 0} m² (${details.gardenStyle || ''})`;

    case 'furniture':
      return `${details.furnitureTypes?.join(', ') || 'Layanan Furniture'} - ${details.material || ''} (${details.finishing || ''})`;

    case 'sedot-wc':
      return `${details.serviceType || 'Layanan Sedot WC'} - ${details.totalPrice ? `Rp ${details.totalPrice.toLocaleString('id-ID')}` : ''}`;

    default:
      // Untuk layanan baru yang menggunakan selectedServices
      if (details.selectedServices && Array.isArray(details.selectedServices)) {
        return details.selectedServices.join(', ') || 'Layanan Umum';
      }
      return 'Layanan Umum';
  }
};

// Fungsi untuk mendapatkan icon berdasarkan kategori layanan
const getServiceIcon = (category: string) => {
  switch (category) {
    case 'ac': return '❄️';
    case 'cleaning': return '🧹';
    case 'electrical': return '⚡';
    case 'plumbing': return '🚰';
    case 'garden': return '🌿';
    case 'furniture': return '🪑';
    case 'sedot-wc': return '🚽';
    default: return '🛠️';
  }
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentVendorId, setCurrentVendorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 10;

  // Load vendor ID dari localStorage
  useEffect(() => {
    const mitraUser = localStorage.getItem('mitraUser');
    if (mitraUser) {
      try {
        const parsedMitra = JSON.parse(mitraUser);
        setCurrentVendorId(parsedMitra.id);
      } catch (error) {
        console.error('Error parsing mitraUser:', error);
        toast.error('Gagal memuat data vendor. Silakan login kembali.');
        router.push('/mitra/login');
      }
    } else {
      toast.error('Anda belum login. Silakan login terlebih dahulu.');
      router.push('/mitra/login');
    }
  }, [router]);

  // Load orders dari localStorage saat komponen mount
  useEffect(() => {
    if (!currentVendorId) return;

    const loadOrders = () => {
      try {
        setIsLoading(true);
        const savedOrders = localStorage.getItem('allOrders');
        if (savedOrders) {
          const parsedOrders = JSON.parse(savedOrders);

          // Filter hanya pesanan untuk vendor yang sedang login
          const vendorOrders = parsedOrders.filter((order: any) => {
            return order.vendorId === currentVendorId;
          });

          // Map status dari user ke status yang digunakan di mitra
          const mappedOrders = vendorOrders.map((order: any) => {
            let status = 'pending';

            if (order.status === 'pending') {
              status = 'pending';
            } else if (order.status === 'in-progress') {
              status = 'in-progress';
            } else if (order.status === 'completed') {
              status = 'completed';
            } else if (order.status === 'rejected') {
              status = 'rejected';
            }

            return {
              ...order,
              status: status,
              paymentStatus: order.paymentStatus || (order.status === 'pending' ? 'unpaid' : 'paid')
            };
          });

          setOrders(mappedOrders);
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.error('Error loading orders:', error);
        setOrders([]);
        toast.error('Gagal memuat data pesanan.');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();

    // Event listener untuk update real-time
    const handleStorageChange = () => {
      loadOrders();
    };

    window.addEventListener('storage', handleStorageChange);

    // Polling untuk update real-time (setiap 5 detik)
    const interval = setInterval(loadOrders, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [currentVendorId]);

  // Reset ke halaman 1 saat tab berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Filter orders berdasarkan tab aktif
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return order.status === 'pending';
    if (activeTab === 'in-progress') return order.status === 'in-progress';
    if (activeTab === 'completed') return order.status === 'completed';
    if (activeTab === 'rejected') return order.status === 'rejected';
    return true;
  });

  // Hitung total halaman
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // Dapatkan data untuk halaman saat ini
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

  // Fungsi untuk mengubah halaman
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Fungsi untuk mendapatkan warna badge berdasarkan status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Fungsi untuk mendapatkan icon berdasarkan status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 mr-1" />;
      case 'in-progress': return <Wrench className="h-4 w-4 mr-1" />;
      case 'completed': return <CheckCheck className="h-4 w-4 mr-1" />;
      case 'rejected': return <X className="h-4 w-4 mr-1" />;
      default: return <AlertCircle className="h-4 w-4 mr-1" />;
    }
  };

  // Fungsi untuk mendapatkan label status
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu Pembayaran';
      case 'in-progress': return 'Sedang Dikerjakan';
      case 'completed': return 'Selesai';
      case 'rejected': return 'Dibatalkan';
      default: return status;
    }
  };

  // Loading state
  if (!currentVendorId || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Memuat pesanan...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-4 md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6 md:mb-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/mitra/dashboard" className="text-neutral-600 dark:text-neutral-400">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold">Pesanan</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mt-4">
            Manajemen Pesanan
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">
            Kelola semua pesanan layanan dari pelanggan Anda
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 md:mb-8">
          <Card className="bg-white dark:bg-neutral-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-tight">Total Pesanan</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{orders.length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-neutral-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-tight whitespace-nowrap">Menunggu Pembayaran</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                    {orders.filter(o => o.status === 'pending').length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-neutral-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-tight whitespace-nowrap">Sedang Dikerjakan</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                    {orders.filter(o => o.status === 'in-progress').length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-neutral-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-tight">Selesai</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                    {orders.filter(o => o.status === 'completed').length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <CheckCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-neutral-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-tight">Dibatalkan</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                    {orders.filter(o => o.status === 'rejected').length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                  <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card className="bg-white dark:bg-neutral-800 mb-6 md:mb-8">
          <CardContent className="p-4 md:p-6">
            <Tabs defaultValue="all" onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5 mb-6">
                <TabsTrigger value="all" className="text-sm md:text-base">Semua</TabsTrigger>
                <TabsTrigger value="pending" className="text-sm md:text-base">Menunggu</TabsTrigger>
                <TabsTrigger value="in-progress" className="text-sm md:text-base">Dikerjakan</TabsTrigger>
                <TabsTrigger value="completed" className="text-sm md:text-base">Selesai</TabsTrigger>
                <TabsTrigger value="rejected" className="text-sm md:text-base">Dibatalkan</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                {currentOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center mb-4">
                      <Calendar className="h-8 w-8 text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                      Tidak ada pesanan
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      {activeTab === 'all'
                        ? 'Belum ada pesanan yang masuk'
                        : `Tidak ada pesanan dengan status ${getStatusLabel(activeTab).toLowerCase()}`
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 md:space-y-6">
                    {currentOrders.map((order) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="overflow-hidden border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow duration-200">
                          <CardContent className="p-0">
                            <div className="p-4 md:p-6">
                              {/* Order Header */}
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <div>
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-lg">
                                      {getServiceIcon(order.serviceCategory)}
                                    </div>
                                    <div>
                                      <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                                        {order.id}
                                      </h3>
                                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        {new Date(order.orderDate).toLocaleDateString('id-ID')}
                                      </p>
                                    </div>
                                    <Badge className={`${getStatusColor(order.status)} flex items-center`}>
                                      {getStatusIcon(order.status)}
                                      {getStatusLabel(order.status)}
                                    </Badge>
                                  </div>
                                  <p className="text-neutral-700 dark:text-neutral-300 font-medium">
                                    {getServiceLabel(order.serviceCategory, order.serviceDetails)}
                                  </p>
                                </div>

                                <div className="text-right">
                                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                                    Rp {order.serviceDetails.totalPrice?.toLocaleString('id-ID') || '0'}
                                  </p>
                                  <p className={`text-sm ${order.paymentStatus === 'paid' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                                    {order.paymentStatus === 'paid' ? '✅ Lunas' : '⏳ Belum Dibayar'}
                                  </p>
                                </div>
                              </div>

                              <Separator className="my-4" />

                              {/* Customer Information */}
                              <div className="mb-4">
                                <h4 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  Informasi Pelanggan
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2 p-2 bg-neutral-50 dark:bg-neutral-700/30 rounded">
                                      <User className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                                      <div className="min-w-0">
                                        <span className="text-xs text-neutral-500 dark:text-neutral-400 block">Nama</span>
                                        <span className="text-sm font-medium truncate">{order.customerName}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 bg-neutral-50 dark:bg-neutral-700/30 rounded">
                                      <Mail className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                                      <div className="min-w-0">
                                        <span className="text-xs text-neutral-500 dark:text-neutral-400 block">Email</span>
                                        <span className="text-sm font-medium truncate">{order.customerEmail}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 bg-neutral-50 dark:bg-neutral-700/30 rounded">
                                      <Phone className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                                      <div className="min-w-0">
                                        <span className="text-xs text-neutral-500 dark:text-neutral-400 block">Telepon</span>
                                        <span className="text-sm font-medium">{order.customerPhone}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <div className="flex items-start gap-2 p-2 bg-neutral-50 dark:bg-neutral-700/30 rounded h-full">
                                      <MapPin className="h-4 w-4 text-neutral-500 mt-0.5 flex-shrink-0" />
                                      <div className="min-w-0">
                                        <span className="text-xs text-neutral-500 dark:text-neutral-400 block">Alamat Lengkap</span>
                                        <span className="text-sm">{order.customerAddress}</span>

                                        {/* Tombol Google Maps */}
                                        {order.gpsLink && (
                                          <div className="mt-3">
                                            <a
                                              href={order.gpsLink}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-md transition-colors duration-200"
                                            >
                                              <Navigation className="h-3.5 w-3.5" />
                                              Buka di Google Maps
                                            </a>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                              Klik untuk melihat lokasi dan mendapatkan rute
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Work Schedule */}
                              <div className="mb-4">
                                <h4 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  Jadwal Pengerjaan
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center flex-shrink-0">
                                      <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                      <span className="text-sm font-medium block">Tanggal Pengerjaan</span>
                                      <span className="text-sm">
                                        {new Date(order.workDate).toLocaleDateString('id-ID', {
                                          weekday: 'long',
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        })}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center flex-shrink-0">
                                      <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                      <span className="text-sm font-medium block">Waktu Pengerjaan</span>
                                      <span className="text-sm">{order.workTime}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Additional Notes */}
                              {order.additionalNotes && (
                                <div className="mb-6">
                                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Catatan Tambahan dari Pelanggan
                                  </h4>
                                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                    <p className="text-sm text-neutral-700 dark:text-neutral-300">
                                      {order.additionalNotes}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Alasan Pembatalan */}
                              {order.status === 'rejected' && order.cancellationReason && (
                                <div className="mb-6">
                                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    Alasan Pembatalan
                                  </h4>
                                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                    <p className="text-sm text-neutral-700 dark:text-neutral-300">
                                      {order.cancellationReason}
                                    </p>
                                    {order.cancelledBy === 'user' && order.cancelledAt && (
                                      <div className="mt-2 flex items-center gap-2">
                                        <User className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                                        <p className="text-xs text-red-600 dark:text-red-400">
                                          Dibatalkan oleh pelanggan pada {new Date(order.cancelledAt).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                          })} pukul {new Date(order.cancelledAt).toLocaleTimeString('id-ID', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                                {order.status === 'pending' && (
                                  <div className="w-full">
                                    <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                        <span className="font-medium">Status:</span> Menunggu pembayaran dari pelanggan.
                                      </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                      <Button
                                        onClick={() => router.push(`/mitra/chat/${order.id}`)}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                      >
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Chat dengan Pelanggan
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {order.status === 'in-progress' && (
                                  <div className="w-full">
                                    <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                      <p className="text-sm text-blue-700 dark:text-blue-300">
                                        <span className="font-medium">Status:</span> Sedang mengerjakan pesanan. Tunggu konfirmasi selesai dari pelanggan.
                                      </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                      <Button
                                        onClick={() => router.push(`/mitra/chat/${order.id}`)}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                      >
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Chat dengan Pelanggan
                                      </Button>
                                      {order.gpsLink && (
                                        <Button
                                          variant="outline"
                                          className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                          onClick={() => window.open(order.gpsLink, '_blank')}
                                        >
                                          <Navigation className="h-4 w-4 mr-2" />
                                          Buka Peta
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {order.status === 'completed' && (
                                  <div className="w-full space-y-3">
                                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                                      <p className="text-sm text-green-700 dark:text-green-300">
                                        <span className="font-medium">Status:</span> Pesanan ini sudah selesai.
                                      </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                      <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => router.push(`/mitra/chat/${order.id}`)}
                                      >
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Lihat Riwayat Chat
                                      </Button>
                                      {order.gpsLink && (
                                        <Button
                                          variant="outline"
                                          className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                          onClick={() => window.open(order.gpsLink, '_blank')}
                                        >
                                          <Navigation className="h-4 w-4 mr-2" />
                                          Lihat Lokasi
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {order.status === 'rejected' && (
                                  <div className="w-full space-y-3">
                                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                                      <p className="text-sm text-red-700 dark:text-red-300">
                                        <span className="font-medium">Status:</span> Pesanan ini telah dibatalkan oleh pelanggan.
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                      Menampilkan {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredOrders.length)} dari {filteredOrders.length} pesanan
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPrevPage}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNumber;
                          if (totalPages <= 5) {
                            pageNumber = i + 1;
                          } else if (currentPage <= 3) {
                            pageNumber = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + i;
                          } else {
                            pageNumber = currentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNumber}
                              variant={currentPage === pageNumber ? "default" : "outline"}
                              size="sm"
                              onClick={() => paginate(pageNumber)}
                              className="h-8 w-8 p-0"
                            >
                              {pageNumber}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}