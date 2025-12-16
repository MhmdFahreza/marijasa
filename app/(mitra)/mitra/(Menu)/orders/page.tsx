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
  CheckCircle, 
  XCircle, 
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
  Navigation
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Separator } from "@/app/components/ui/separator";
import { useRouter } from 'next/navigation';

// Data dummy untuk orders
const dummyOrders = [
  {
    id: "ORD-001",
    customerName: "Budi Santoso",
    customerEmail: "budi.santoso@email.com",
    customerPhone: "081234567890",
    customerAddress: "Jl. Merdeka No. 123, Kel. Sudirman, Kec. Menteng, Jakarta Pusat 10110",
    gpsLink: "https://maps.google.com/?q=Jl.+Merdeka+No.+123,+Kel.+Sudirman,+Kec.+Menteng,+Jakarta+Pusat+10110",
    vendorId: "vendor-ac-01",
    serviceCategory: "ac",
    serviceDetails: {
      serviceType: "instalasi",
      acType: "split",
      acCount: 2,
      acPk: "1.5",
      totalPrice: 1000000
    },
    workDate: "2024-01-15",
    workTime: "08:00-10:00",
    additionalNotes: "Mohon datang tepat waktu karena ada acara keluarga di rumah. AC yang akan dipasang di kamar tidur utama dan ruang tamu.",
    status: "pending", // pending, in-progress, completed, rejected
    orderDate: "2024-01-10",
    paymentStatus: "unpaid" // unpaid, paid
  },
  {
    id: "ORD-002",
    customerName: "Sari Dewi",
    customerEmail: "sari.dewi@email.com",
    customerPhone: "082345678901",
    customerAddress: "Komplek Permata Hijau Blok C No. 45, Jakarta Selatan 12210",
    gpsLink: "https://maps.google.com/?q=Komplek+Permata+Hijau+Blok+C+No.+45,+Jakarta+Selatan+12210",
    vendorId: "vendor-cleaning-01",
    serviceCategory: "cleaning",
    serviceDetails: {
      cleaningType: "deep",
      propertyType: "house",
      areaSize: 120,
      rooms: 5,
      totalPrice: 1200000
    },
    workDate: "2024-01-16",
    workTime: "10:00-12:00",
    additionalNotes: "Rumah 2 lantai, fokus pada kamar mandi dan dapur. Ada 2 anak kecil di rumah.",
    status: "in-progress",
    orderDate: "2024-01-11",
    paymentStatus: "paid"
  },
  {
    id: "ORD-003",
    customerName: "Rudi Hartono",
    customerEmail: "rudi.hartono@email.com",
    customerPhone: "083456789012",
    customerAddress: "Apartemen Green Park Tower Lantai 15 Unit 1502, Jakarta Barat 11520",
    gpsLink: "https://maps.google.com/?q=Apartemen+Green+Park+Tower+Lantai+15+Unit+1502,+Jakarta+Barat+11520",
    vendorId: "vendor-electrical-01",
    serviceCategory: "electrical",
    serviceDetails: {
      electricalWork: ["Instalasi Baru", "Ganti MCB"],
      buildingType: "apartment",
      powerCapacity: "2200",
      totalPrice: 850000
    },
    workDate: "2024-01-17",
    workTime: "13:00-15:00",
    additionalNotes: "Apartemen baru, belum ada instalasi listrik sama sekali. Tolong pasang stop kontak di setiap ruangan.",
    status: "completed",
    orderDate: "2024-01-12",
    paymentStatus: "paid"
  },
  {
    id: "ORD-004",
    customerName: "Maya Sari",
    customerEmail: "maya.sari@email.com",
    customerPhone: "084567890123",
    customerAddress: "Jl. Kenanga No. 78, Bandung 40132",
    gpsLink: "https://maps.google.com/?q=Jl.+Kenanga+No.+78,+Bandung+40132",
    vendorId: "vendor-plumbing-01",
    serviceCategory: "plumbing",
    serviceDetails: {
      plumbingIssues: ["Perbaikan Kebocoran", "Pelancaran Saluran Mampet"],
      urgency: "emergency",
      totalPrice: 800000
    },
    workDate: "2024-01-18",
    workTime: "15:00-17:00",
    additionalNotes: "Kebocoran di pipa bawah wastafel dapur. Sudah mencoba ditambal sendiri tapi masih bocor.",
    status: "pending",
    orderDate: "2024-01-13",
    paymentStatus: "unpaid"
  },
  {
    id: "ORD-005",
    customerName: "Agus Setiawan",
    customerEmail: "agus.setiawan@email.com",
    customerPhone: "085678901234",
    customerAddress: "Perumahan Taman Asri Blok D No. 12, Bekasi 17141",
    gpsLink: "https://maps.google.com/?q=Perumahan+Taman+Asri+Blok+D+No.+12,+Bekasi+17141",
    vendorId: "vendor-garden-01",
    serviceCategory: "garden",
    serviceDetails: {
      gardenServices: ["Perawatan Rutin"],
      gardenSize: 50,
      gardenStyle: "tropis",
      totalPrice: 300000
    },
    workDate: "2024-01-19",
    workTime: "08:00-10:00",
    additionalNotes: "Taman sudah 3 bulan tidak dirawat. Ada beberapa tanaman yang layu dan rumput terlalu tinggi.",
    status: "in-progress",
    orderDate: "2024-01-14",
    paymentStatus: "paid"
  },
  {
    id: "ORD-006",
    customerName: "Lisa Anggraeni",
    customerEmail: "lisa.anggraeni@email.com",
    customerPhone: "086789012345",
    customerAddress: "Jl. Mawar No. 56, Surabaya 60241",
    gpsLink: "https://maps.google.com/?q=Jl.+Mawar+No.+56,+Surabaya+60241",
    vendorId: "vendor-furniture-01",
    serviceCategory: "furniture",
    serviceDetails: {
      furnitureTypes: ["Pembuatan Furnitur"],
      material: "kayu-jati",
      finishing: "natural",
      dimensions: "Lemari pakaian 200cm x 60cm x 180cm",
      totalPrice: 3000000
    },
    workDate: "2024-01-20",
    workTime: "10:00-12:00",
    additionalNotes: "Ingin lemari dengan 2 daun pintu, 3 rak, dan 1 laci di bagian bawah. Warna natural kayu jati.",
    status: "completed",
    orderDate: "2024-01-15",
    paymentStatus: "paid"
  },
  {
    id: "ORD-007",
    customerName: "Andi Pratama",
    customerEmail: "andi.pratama@email.com",
    customerPhone: "087890123456",
    customerAddress: "Jl. Melati No. 34, Tangerang 15125",
    gpsLink: "https://maps.google.com/?q=Jl.+Melati+No.+34,+Tangerang+15125",
    vendorId: "vendor-ac-02",
    serviceCategory: "ac",
    serviceDetails: {
      serviceType: "cuci",
      acType: "split",
      acCount: 3,
      acPk: "1",
      totalPrice: 300000
    },
    workDate: "2024-01-21",
    workTime: "13:00-15:00",
    additionalNotes: "AC sudah 2 tahun tidak dicuci. Mohon dibersihkan secara menyeluruh.",
    status: "pending",
    orderDate: "2024-01-16",
    paymentStatus: "unpaid"
  },
  {
    id: "ORD-008",
    customerName: "Dewi Lestari",
    customerEmail: "dewi.lestari@email.com",
    customerPhone: "088901234567",
    customerAddress: "Komplek Bumi Indah Blok A No. 8, Bogor 16152",
    gpsLink: "https://maps.google.com/?q=Komplek+Bumi+Indah+Blok+A+No.+8,+Bogor+16152",
    vendorId: "vendor-cleaning-02",
    serviceCategory: "cleaning",
    serviceDetails: {
      cleaningType: "general",
      propertyType: "house",
      areaSize: 80,
      rooms: 4,
      totalPrice: 480000
    },
    workDate: "2024-01-22",
    workTime: "08:00-10:00",
    additionalNotes: "Pembersihan rutin bulanan. Fokus pada ruang keluarga dan kamar tidur.",
    status: "in-progress",
    orderDate: "2024-01-17",
    paymentStatus: "paid"
  },
  {
    id: "ORD-009",
    customerName: "Eko Wijaya",
    customerEmail: "eko.wijaya@email.com",
    customerPhone: "089012345678",
    customerAddress: "Jl. Anggrek No. 12, Depok 16431",
    gpsLink: "https://maps.google.com/?q=Jl.+Anggrek+No.+12,+Depok+16431",
    vendorId: "vendor-plumbing-02",
    serviceCategory: "plumbing",
    serviceDetails: {
      plumbingIssues: ["Instalasi Pipa"],
      urgency: "normal",
      totalPrice: 250000
    },
    workDate: "2024-01-23",
    workTime: "10:00-12:00",
    additionalNotes: "Pasang pipa air baru untuk wastafel kamar mandi tambahan.",
    status: "completed",
    orderDate: "2024-01-18",
    paymentStatus: "paid"
  },
  {
    id: "ORD-010",
    customerName: "Fajar Nugroho",
    customerEmail: "fajar.nugroho@email.com",
    customerPhone: "090123456789",
    customerAddress: "Jl. Cendana No. 45, Bekasi 17112",
    gpsLink: "https://maps.google.com/?q=Jl.+Cendana+No.+45,+Bekasi+17112",
    vendorId: "vendor-electrical-02",
    serviceCategory: "electrical",
    serviceDetails: {
      electricalWork: ["Penambahan Titik Listrik"],
      buildingType: "house",
      powerCapacity: "2200",
      totalPrice: 300000
    },
    workDate: "2024-01-24",
    workTime: "15:00-17:00",
    additionalNotes: "Tambah 2 titik listrik di ruang kerja dan 1 di teras belakang.",
    status: "pending",
    orderDate: "2024-01-19",
    paymentStatus: "unpaid"
  },
  {
    id: "ORD-011",
    customerName: "Gita Maharani",
    customerEmail: "gita.maharani@email.com",
    customerPhone: "091234567890",
    customerAddress: "Apartemen Sky Garden Lantai 20 Unit 2001, Jakarta Pusat 10230",
    gpsLink: "https://maps.google.com/?q=Apartemen+Sky+Garden+Lantai+20+Unit+2001,+Jakarta+Pusat+10230",
    vendorId: "vendor-garden-02",
    serviceCategory: "garden",
    serviceDetails: {
      gardenServices: ["Pemangkasan", "Perawatan Rumput"],
      gardenSize: 30,
      gardenStyle: "minimalis",
      totalPrice: 450000
    },
    workDate: "2024-01-25",
    workTime: "08:00-10:00",
    additionalNotes: "Taman di rooftop apartemen. Ada beberapa tanaman hias yang perlu dipangkas.",
    status: "in-progress",
    orderDate: "2024-01-20",
    paymentStatus: "paid"
  },
  {
    id: "ORD-012",
    customerName: "Hendra Saputra",
    customerEmail: "hendra.saputra@email.com",
    customerPhone: "092345678901",
    customerAddress: "Jl. Kenari No. 67, Bandung 40115",
    gpsLink: "https://maps.google.com/?q=Jl.+Kenari+No.+67,+Bandung+40115",
    vendorId: "vendor-furniture-02",
    serviceCategory: "furniture",
    serviceDetails: {
      furnitureTypes: ["Restorasi Furnitur Lama"],
      material: "kayu-mahoni",
      finishing: "natural",
      dimensions: "Meja makan ukuran 180cm x 90cm",
      totalPrice: 2500000
    },
    workDate: "2024-01-26",
    workTime: "13:00-15:00",
    additionalNotes: "Restorasi meja makan warisan keluarga. Harap hati-hati karena ada ukiran tradisional.",
    status: "completed",
    orderDate: "2024-01-21",
    paymentStatus: "paid"
  }
];

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
      return `${acServices[details.serviceType]} - ${details.acCount} Unit ${details.acType} ${details.acPk} PK`;
    
    case 'cleaning':
      const cleaningServices: Record<string, string> = {
        general: 'Pembersihan Rutin',
        deep: 'Pembersihan Mendalam',
        renovasi: 'Pembersihan Renovasi',
        pindahan: 'Pembersihan Pindahan'
      };
      return `${cleaningServices[details.cleaningType]} - ${details.areaSize} m² (${details.rooms} ruangan)`;
    
    case 'electrical':
      return `${details.electricalWork?.join(', ')} - ${details.buildingType} (${details.powerCapacity} VA)`;
    
    case 'plumbing':
      return `${details.plumbingIssues?.join(', ')} - ${details.urgency === 'emergency' ? 'Darurat' : 'Normal'}`;
    
    case 'garden':
      return `${details.gardenServices?.join(', ')} - ${details.gardenSize} m² (${details.gardenStyle})`;
    
    case 'furniture':
      return `${details.furnitureTypes?.join(', ')} - ${details.material} (${details.finishing})`;
    
    default:
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
    default: return '🛠️';
  }
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState(dummyOrders);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // Fungsi untuk mengubah status order
  const updateOrderStatus = (orderId: string, newStatus: string) => {
    if (newStatus === 'in-progress') {
      if (!window.confirm('Apakah Anda yakin ingin menerima pesanan ini?')) {
        return;
      }
    }
    
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };

  // Fungsi untuk menolak order
  const rejectOrder = (orderId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menolak pesanan ini?')) {
      return;
    }
    
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: 'rejected' } : order
    ));
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
      default: return <AlertCircle className="h-4 w-4 mr-1" />;
    }
  };

  // Fungsi untuk mendapatkan label status
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu Konfirmasi';
      case 'in-progress': return 'Sedang Dikerjakan';
      case 'completed': return 'Selesai';
      case 'rejected': return 'Ditolak';
      default: return status;
    }
  };

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 md:mb-8">
          <Card className="bg-white dark:bg-neutral-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Pesanan</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">{filteredOrders.length}</p>
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
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Menunggu Konfirmasi</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {filteredOrders.filter(o => o.status === 'pending').length}
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
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Sedang Dikerjakan</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {filteredOrders.filter(o => o.status === 'in-progress').length}
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
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Selesai</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {filteredOrders.filter(o => o.status === 'completed').length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <CheckCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card className="bg-white dark:bg-neutral-800 mb-6 md:mb-8">
          <CardContent className="p-4 md:p-6">
            <Tabs defaultValue="all" onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="all" className="text-sm md:text-base">Semua</TabsTrigger>
                <TabsTrigger value="pending" className="text-sm md:text-base">Menunggu</TabsTrigger>
                <TabsTrigger value="in-progress" className="text-sm md:text-base">Dikerjakan</TabsTrigger>
                <TabsTrigger value="completed" className="text-sm md:text-base">Selesai</TabsTrigger>
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

                              {/* Action Buttons */}
                              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                                {order.status === 'pending' && (
                                  <>
                                    <Button
                                      onClick={() => updateOrderStatus(order.id, 'in-progress')}
                                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Terima Pesanan
                                    </Button>
                                    <Button
                                      onClick={() => rejectOrder(order.id)}
                                      variant="outline"
                                      className="flex-1 text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Tolak Pesanan
                                    </Button>
                                  </>
                                )}
                                
                                {order.status === 'in-progress' && (
                                  <div className="w-full">
                                    <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                      <p className="text-sm text-blue-700 dark:text-blue-300">
                                        <span className="font-medium">Status:</span> Sedang mengerjakan pesanan. Gunakan fitur chat untuk berkoordinasi dengan pelanggan.
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
                                
                                {(order.status === 'completed' || order.status === 'rejected') && (
                                  <div className="w-full space-y-3">
                                    <div className={`p-3 rounded-lg ${order.status === 'completed' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                                      <p className={`text-sm ${order.status === 'completed' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                                        <span className="font-medium">Status:</span> Pesanan ini sudah {order.status === 'completed' ? 'selesai' : 'ditolak'}.
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
                          // Tampilkan maksimal 5 nomor halaman
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