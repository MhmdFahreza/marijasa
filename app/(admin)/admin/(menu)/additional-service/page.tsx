// app/admin/additional-service/page.tsx
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import {
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Calendar,
  User,
  Package,
  FileText,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  AlertTriangle,
  Loader2,
  Store,
  DollarSign
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Separator } from "@/app/components/ui/separator";
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  priceType: string;
  description: string | null;
}

interface AdditionalServiceRequest {
  id: string;
  orderId: string;
  vendorName: string;
  vendorId: string;
  customerName: string;
  services: ServiceItem[];
  description: string;
  totalPrice: number;
  reason: string;
  images: string[];
  submittedAt: string;
  status: string;
  rejectionReason: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  orderDetails: {
    serviceType: string;
    serviceDate: string;
    serviceTime: string;
  };
}

export default function AdminAdditionalServicePage() {
  const router = useRouter();
  const [requests, setRequests] = useState<AdditionalServiceRequest[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 10;

  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AdditionalServiceRequest | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Load requests from API
  const loadRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== 'all') {
        params.append('status', activeTab);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/admin/additional-services?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Anda belum login. Silakan login terlebih dahulu.');
          router.push('/admin/login');
          return;
        }
        throw new Error('Failed to fetch requests');
      }

      const data = await response.json();
      if (data.success) {
        setRequests(data.requests);
        setCounts(data.counts);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('Gagal memuat data permintaan layanan');
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [router, activeTab, searchQuery]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Reset ke halaman 1 saat tab atau search berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  // Filter requests berdasarkan tab
  const filteredRequests = requests.filter(request => {
    if (activeTab === 'all') return true;
    return request.status === activeTab;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Menunggu Review
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Disetujui
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Ditolak
          </Badge>
        );
      default:
        return null;
    }
  };

  // Handle approve
  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/additional-services', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'approve',
          requestId: selectedRequest.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to approve request');
      }

      toast.success('Permintaan layanan tambahan berhasil disetujui!');
      setShowApproveModal(false);
      setSelectedRequest(null);
      loadRequests();
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast.error(error.message || 'Gagal menyetujui permintaan');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!selectedRequest) return;
    
    if (!rejectionReason.trim()) {
      toast.error('Silakan masukkan alasan penolakan');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/additional-services', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'reject',
          requestId: selectedRequest.id,
          rejectionReason: rejectionReason
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reject request');
      }

      toast.success('Permintaan layanan tambahan telah ditolak');
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
      loadRequests();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast.error(error.message || 'Gagal menolak permintaan');
    } finally {
      setIsProcessing(false);
    }
  };

  // Open approve modal
  const openApproveModal = (request: AdditionalServiceRequest) => {
    setSelectedRequest(request);
    setShowApproveModal(true);
  };

  // Open reject modal
  const openRejectModal = (request: AdditionalServiceRequest) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  // Open image modal
  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Permintaan Layanan Tambahan</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Permintaan Layanan Tambahan
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Kelola permintaan layanan tambahan dari pelanggan
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{counts.total}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{counts.pending}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Disetujui</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{counts.approved}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Ditolak</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{counts.rejected}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari berdasarkan ID Pesanan atau nama pelanggan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="all">Semua ({counts.total})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
            <TabsTrigger value="approved">Disetujui ({counts.approved})</TabsTrigger>
            <TabsTrigger value="rejected">Ditolak ({counts.rejected})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {paginatedRequests.length === 0 ? (
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardContent className="p-8 text-center">
                  <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">
                    {searchQuery
                      ? 'Tidak ada permintaan yang cocok dengan pencarian Anda'
                      : 'Belum ada permintaan layanan tambahan'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              paginatedRequests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <span className="text-blue-600 dark:text-blue-400">#{request.orderId}</span>
                            {getStatusBadge(request.status)}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Diajukan: {formatDate(request.submittedAt)}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500 dark:text-slate-400">Total Tambahan</p>
                          <p className="text-xl font-bold text-slate-900 dark:text-white">
                            {formatCurrency(request.totalPrice)}
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Customer & Vendor Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                          <User className="w-5 h-5 text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Pelanggan</p>
                            <p className="font-medium text-slate-900 dark:text-white">{request.customerName}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                          <Store className="w-5 h-5 text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Vendor</p>
                            <p className="font-medium text-slate-900 dark:text-white">{request.vendorName}</p>
                          </div>
                        </div>
                      </div>

                      {/* Order Details */}
                      <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                        <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Jadwal Layanan</p>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {request.orderDetails.serviceDate} - {request.orderDetails.serviceTime}
                          </p>
                        </div>
                      </div>

                      {/* Services */}
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Layanan yang Diminta
                        </p>
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 space-y-2">
                          {request.services.map((service, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white">{service.name}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  {service.quantity}x @ {formatCurrency(service.price)}
                                  {service.priceType && ` (${service.priceType})`}
                                </p>
                              </div>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {formatCurrency(service.price * service.quantity)}
                              </p>
                            </div>
                          ))}
                          <Separator className="my-2" />
                          <div className="flex justify-between items-center">
                            <p className="font-semibold text-slate-900 dark:text-white">Total</p>
                            <p className="font-bold text-blue-600 dark:text-blue-400">
                              {formatCurrency(request.totalPrice)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Reason */}
                      {request.reason && (
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Alasan Permintaan
                          </p>
                          <p className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 text-slate-700 dark:text-slate-300">
                            {request.reason}
                          </p>
                        </div>
                      )}

                      {/* Images */}
                      {request.images && request.images.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" />
                            Foto Dokumentasi ({request.images.length})
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {request.images.map((image, idx) => (
                              <button
                                key={idx}
                                onClick={() => openImageModal(image)}
                                className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:opacity-80 transition-opacity"
                              >
                                <img
                                  src={image}
                                  alt={`Dokumentasi ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <Eye className="w-5 h-5 text-white opacity-0 hover:opacity-100" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rejection Reason */}
                      {request.status === 'rejected' && request.rejectionReason && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                          <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Alasan Penolakan
                          </p>
                          <p className="text-red-600 dark:text-red-300">{request.rejectionReason}</p>
                        </div>
                      )}

                      {/* Actions */}
                      {request.status === 'pending' && (
                        <div className="flex gap-3 pt-2">
                          <Button
                            onClick={() => openApproveModal(request)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Setujui
                          </Button>
                          <Button
                            onClick={() => openRejectModal(request)}
                            variant="outline"
                            className="flex-1 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Tolak
                          </Button>
                        </div>
                      )}

                      {/* Approved/Rejected timestamp */}
                      {request.status === 'approved' && request.approvedAt && (
                        <p className="text-sm text-green-600 dark:text-green-400 text-center">
                          ✓ Disetujui pada {formatDate(request.approvedAt)}
                        </p>
                      )}
                      {request.status === 'rejected' && request.rejectedAt && (
                        <p className="text-sm text-red-600 dark:text-red-400 text-center">
                          ✗ Ditolak pada {formatDate(request.rejectedAt)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Approve Modal */}
      <AnimatePresence>
        {showApproveModal && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowApproveModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Setujui Permintaan?
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  Layanan tambahan akan ditambahkan ke pesanan #{selectedRequest.orderId}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 mb-6">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Layanan yang akan ditambahkan:</p>
                {selectedRequest.services.map((service, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-slate-700 dark:text-slate-300">
                      {service.name} x{service.quantity}
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {formatCurrency(service.price * service.quantity)}
                    </span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-900 dark:text-white">Total</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(selectedRequest.totalPrice)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowApproveModal(false)}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleApprove}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Ya, Setujui
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowRejectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Tolak Permintaan?
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  Permintaan layanan tambahan untuk pesanan #{selectedRequest.orderId} akan ditolak
                </p>
              </div>

              <div className="mb-6">
                <Label htmlFor="rejectionReason" className="text-slate-700 dark:text-slate-300">
                  Alasan Penolakan <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Masukkan alasan penolakan..."
                  className="mt-2"
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleReject}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Ya, Tolak
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {showImageModal && selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowImageModal(false)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={() => setShowImageModal(false)}
            >
              <X className="w-6 h-6" />
            </Button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={selectedImage}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}