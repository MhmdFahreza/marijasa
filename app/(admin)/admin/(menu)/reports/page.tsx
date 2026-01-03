// app/admin/reports/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import {
    Clock,
    Package,
    FileText,
    Check,
    X,
    AlertCircle,
    User,
    Calendar,
    Image as ImageIcon,
    ChevronRight,
    ChevronDown,
    Loader2,
    Bell,
    CheckCircle,
    XCircle,
    Eye,
    Filter,
    Search,
    RefreshCw,
    MoreVertical,
    Wrench,
    DollarSign,
    MessageSquare,
    Download,
    Maximize2
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/app/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/app/components/ui/dialog";
import { Separator } from "@/app/components/ui/separator";
import { ScrollArea } from "@/app/components/ui/scroll-area";

interface AdditionalServiceRequest {
    id: string;
    orderId: string;
    vendorName: string;
    customerName: string;
    services: {
        id: string;
        name: string;
        price: number;
        quantity: number;
        priceType?: string;
        description?: string;
    }[];
    description: string;
    totalPrice: number;
    reason: string;
    images: string[];
    submittedAt: string;
    status: "pending" | "approved" | "rejected";
    rejectionReason?: string;
    approvedAt?: string;
    rejectedAt?: string;
    vendorId?: string;
    orderDetails?: {
        serviceType: string;
        serviceDate: string;
        serviceTime: string;
    };
}

interface AdminNotification {
    id: string;
    title: string;
    message: string;
    type: string;
    requestId?: string;
    orderId?: string;
    time: string;
    read: boolean;
}

export default function AdminReportsPage() {
    const [requests, setRequests] = useState<AdditionalServiceRequest[]>([]);
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("pending");
    const [selectedRequest, setSelectedRequest] = useState<AdditionalServiceRequest | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string>("");

    // Load requests from localStorage
    const loadRequests = () => {
        try {
            const savedRequests = localStorage.getItem('additionalServiceRequests');
            if (savedRequests) {
                const parsedRequests = JSON.parse(savedRequests);
                setRequests(parsedRequests);
            }
        } catch (error) {
            console.error("Error loading requests:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Load admin notifications
    const loadNotifications = () => {
        try {
            const savedNotifications = localStorage.getItem('adminNotifications');
            if (savedNotifications) {
                setNotifications(JSON.parse(savedNotifications));
            }
        } catch (error) {
            console.error("Error loading notifications:", error);
        }
    };

    useEffect(() => {
        loadRequests();
        loadNotifications();

        // Set up interval to check for new requests
        const interval = setInterval(() => {
            loadRequests();
            loadNotifications();
        }, 5000);

        // Listen for storage changes
        const handleStorageChange = () => {
            loadRequests();
            loadNotifications();
        };

        window.addEventListener('storage', handleStorageChange);

        // Listen for custom events when new requests are submitted
        const handleNewRequest = (event: CustomEvent) => {
            console.log('New service request received:', event.detail);
            loadRequests();
            loadNotifications();
            toast.info("Permintaan layanan tambahan baru diterima!");
        };

        window.addEventListener('additionalServiceRequested', handleNewRequest as EventListener);

        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('additionalServiceRequested', handleNewRequest as EventListener);
        };
    }, []);

    // Filter requests based on tab and search
    const filteredRequests = requests.filter(request => {
        const matchesTab = activeTab === "all" || request.status === activeTab;
        const matchesSearch =
            request.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            request.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            request.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    // Count requests by status
    const pendingCount = requests.filter(r => r.status === "pending").length;
    const approvedCount = requests.filter(r => r.status === "approved").length;
    const rejectedCount = requests.filter(r => r.status === "rejected").length;

    // BUAT NOTIFIKASI UNTUK USER
    const createUserNotification = (notification: {
        title: string;
        message: string;
        type: 'order' | 'promo' | 'system' | 'reminder' | 'additional_service';
        orderId?: string;
    }) => {
        const notifications = JSON.parse(localStorage.getItem('userNotifications') || '[]');
        const newNotification = {
            id: `notif-${Date.now()}`,
            ...notification,
            time: new Date().toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            date: new Date().toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }),
            read: false
        };
        notifications.unshift(newNotification);
        localStorage.setItem('userNotifications', JSON.stringify(notifications));

        // Dispatch event untuk update notifikasi di layout
        window.dispatchEvent(new CustomEvent('notificationUpdated', {
            detail: { type: 'user', notification: newNotification }
        }));
    };

    // Handle approve request
    const handleApprove = async () => {
        if (!selectedRequest) return;

        setIsProcessing(true);

        try {
            // Update request status
            const updatedRequests = requests.map(req => {
                if (req.id === selectedRequest.id) {
                    return {
                        ...req,
                        status: "approved" as const,
                        approvedAt: new Date().toISOString()
                    };
                }
                return req;
            });

            localStorage.setItem('additionalServiceRequests', JSON.stringify(updatedRequests));
            setRequests(updatedRequests);

            // Update user orders - add services to order
            const userOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');
            const updatedOrders = userOrders.map((order: any) => {
                if (order.id === selectedRequest.orderId || order.orderId === selectedRequest.orderId) {
                    // Get current services
                    const currentServices = order.serviceDetails?.services || [];

                    // Add new services to serviceDetails.services
                    const newServices = selectedRequest.services.map(s => `${s.name} (${s.quantity}x)`);
                    const allServices = [...currentServices, ...newServices];

                    // Calculate new totals
                    const currentSubtotal = order.paymentDetails?.subtotal || 0;
                    const newSubtotal = currentSubtotal + selectedRequest.totalPrice;
                    const serviceFee = order.paymentDetails?.serviceFee || 10000;
                    const transactionFee = order.paymentDetails?.transactionFee || 0;
                    const newTotal = newSubtotal + serviceFee + transactionFee;

                    // Update additional services status
                    const updatedAdditionalServices = (order.additionalServices || []).map((as: any) =>
                        as.requestId === selectedRequest.id
                            ? {
                                ...as,
                                status: 'diterima',
                                approvedAt: new Date().toISOString(),
                                appliedToOrder: true
                            }
                            : as
                    );

                    return {
                        ...order,
                        serviceDetails: {
                            ...order.serviceDetails,
                            services: allServices
                        },
                        paymentDetails: {
                            ...order.paymentDetails,
                            subtotal: newSubtotal,
                            total: newTotal
                        },
                        totalPrice: newTotal,
                        additionalServices: updatedAdditionalServices
                    };
                }
                return order;
            });

            localStorage.setItem('userOrders', JSON.stringify(updatedOrders));

            // Create notification for user
            createUserNotification({
                title: "Permintaan Layanan Disetujui",
                message: `Permintaan layanan tambahan untuk pesanan #${selectedRequest.orderId} telah disetujui. Layanan telah ditambahkan ke pesanan Anda.`,
                type: 'additional_service',
                orderId: selectedRequest.orderId
            });

            // Update admin notifications
            const adminNotifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
            const updatedAdminNotifications = adminNotifications.filter((n: any) =>
                !(n.requestId === selectedRequest.id && n.type === 'additional_service_request')
            );
            localStorage.setItem('adminNotifications', JSON.stringify(updatedAdminNotifications));

            // Dispatch event for real-time update
            window.dispatchEvent(new CustomEvent('additionalServiceUpdated', {
                detail: { requestId: selectedRequest.id, status: 'approved', orderId: selectedRequest.orderId }
            }));

            toast.success("Permintaan layanan tambahan berhasil disetujui!");
            setShowApprovalModal(false);
            setSelectedRequest(null);
        } catch (error) {
            console.error("Error approving request:", error);
            toast.error("Gagal menyetujui permintaan");
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle reject request
    const handleReject = async () => {
        if (!selectedRequest) return;

        if (!rejectionReason.trim()) {
            toast.error("Harap isi alasan penolakan");
            return;
        }

        setIsProcessing(true);

        try {
            // Update request status
            const updatedRequests = requests.map(req => {
                if (req.id === selectedRequest.id) {
                    return {
                        ...req,
                        status: "rejected" as const,
                        rejectionReason: rejectionReason,
                        rejectedAt: new Date().toISOString()
                    };
                }
                return req;
            });

            localStorage.setItem('additionalServiceRequests', JSON.stringify(updatedRequests));
            setRequests(updatedRequests);

            // Update user orders
            const userOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');
            const updatedOrders = userOrders.map((order: any) => {
                if (order.id === selectedRequest.orderId || order.orderId === selectedRequest.orderId) {
                    const updatedAdditionalServices = (order.additionalServices || []).map((as: any) =>
                        as.requestId === selectedRequest.id
                            ? {
                                ...as,
                                status: 'ditolak',
                                rejectionReason: rejectionReason,
                                rejectedAt: new Date().toISOString()
                            }
                            : as
                    );

                    return {
                        ...order,
                        additionalServices: updatedAdditionalServices
                    };
                }
                return order;
            });

            localStorage.setItem('userOrders', JSON.stringify(updatedOrders));

            // Update admin notifications
            const adminNotifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
            const updatedAdminNotifications = adminNotifications.filter((n: any) =>
                !(n.requestId === selectedRequest.id && n.type === 'additional_service_request')
            );
            localStorage.setItem('adminNotifications', JSON.stringify(updatedAdminNotifications));

            // Create notification for user
            createUserNotification({
                title: "Permintaan Layanan Ditolak",
                message: `Permintaan layanan tambahan untuk pesanan #${selectedRequest.orderId} ditolak. Alasan: ${rejectionReason}`,
                type: 'additional_service',
                orderId: selectedRequest.orderId
            });

            // Dispatch event for real-time update
            window.dispatchEvent(new CustomEvent('additionalServiceUpdated', {
                detail: { requestId: selectedRequest.id, status: 'rejected', orderId: selectedRequest.orderId }
            }));

            toast.success("Permintaan layanan tambahan telah ditolak");
            setShowRejectionModal(false);
            setRejectionReason("");
            setSelectedRequest(null);
        } catch (error) {
            console.error("Error rejecting request:", error);
            toast.error("Gagal menolak permintaan");
        } finally {
            setIsProcessing(false);
        }
    };

    // Format price
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID').format(price);
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

    // Format date only (without time)
    const formatDateOnly = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Get status badge
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved":
                return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" /> Disetujui</Badge>;
            case "rejected":
                return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" /> Ditolak</Badge>;
            case "pending":
            default:
                return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" /> Menunggu</Badge>;
        }
    };

    // Open detail modal
    const openDetailModal = (request: AdditionalServiceRequest) => {
        setSelectedRequest(request);
        setShowDetailModal(true);
    };

    // Open approval confirmation
    const openApprovalModal = (request: AdditionalServiceRequest) => {
        setSelectedRequest(request);
        setShowApprovalModal(true);
    };

    // Open rejection modal
    const openRejectionModal = (request: AdditionalServiceRequest) => {
        setSelectedRequest(request);
        setRejectionReason("");
        setShowRejectionModal(true);
    };

    // View image
    const viewImage = (imageUrl: string) => {
        setSelectedImage(imageUrl);
        setShowImageModal(true);
    };

    // Download all images as zip (simplified version)
    const downloadImages = (request: AdditionalServiceRequest | null) => {
        if (!request) return;
        toast.info("Fitur download semua gambar akan segera tersedia");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#7CE0A8]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b">
                <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                                Laporan & Permintaan
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Kelola permintaan layanan tambahan dari pelanggan
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    loadRequests();
                                    loadNotifications();
                                    toast.success("Data diperbarui");
                                }}
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                            {pendingCount > 0 && (
                                <Badge className="bg-red-500 text-white px-3 py-1">
                                    {pendingCount} Permintaan Baru
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Total Permintaan</p>
                                    <p className="text-2xl font-bold">{requests.length}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                    <FileText className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Menunggu</p>
                                    <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                                    <Clock className="h-6 w-6 text-yellow-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Disetujui</p>
                                    <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Ditolak</p>
                                    <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                                    <XCircle className="h-6 w-6 text-red-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filter */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Cari berdasarkan ID pesanan, pelanggan, atau vendor..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList>
                                    <TabsTrigger value="all">Semua</TabsTrigger>
                                    <TabsTrigger value="pending" className="relative">
                                        Menunggu
                                        {pendingCount > 0 && (
                                            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                                {pendingCount}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="approved">Disetujui</TabsTrigger>
                                    <TabsTrigger value="rejected">Ditolak</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </CardContent>
                </Card>

                {/* Requests List */}
                <div className="space-y-4">
                    {filteredRequests.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                    Tidak ada permintaan
                                </h3>
                                <p className="text-gray-500">
                                    {activeTab === "pending"
                                        ? "Tidak ada permintaan yang menunggu konfirmasi"
                                        : "Tidak ada permintaan yang ditemukan"}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredRequests.map((request) => (
                            <motion.div
                                key={request.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Card className={`overflow-hidden border-l-4 ${request.status === 'pending' ? 'border-l-yellow-500' :
                                    request.status === 'approved' ? 'border-l-green-500' :
                                        'border-l-red-500'
                                    }`}>
                                    <CardContent className="p-4 md:p-6">
                                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                            {/* Request Info */}
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                                    <h3 className="font-semibold text-lg">
                                                        Permintaan #{request.id}
                                                    </h3>
                                                    {getStatusBadge(request.status)}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <FileText className="h-4 w-4" />
                                                        <span><strong>Pesanan:</strong> #{request.orderId}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <User className="h-4 w-4" />
                                                        <span><strong>Pelanggan:</strong> {request.customerName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Wrench className="h-4 w-4" />
                                                        <span><strong>Vendor:</strong> {request.vendorName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Calendar className="h-4 w-4" />
                                                        <span><strong>Diajukan:</strong> {formatDate(request.submittedAt)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <DollarSign className="h-4 w-4" />
                                                        <span><strong>Total:</strong> Rp {formatPrice(request.totalPrice)}</span>
                                                    </div>
                                                    {request.orderDetails && (
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Calendar className="h-4 w-4" />
                                                            <span><strong>Jadwal Pesanan:</strong> {request.orderDetails.serviceDate} • {request.orderDetails.serviceTime}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Services */}
                                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-4">
                                                    <p className="text-sm font-medium mb-2">Layanan yang Diminta:</p>
                                                    <div className="space-y-2">
                                                        {request.services.map((service, idx) => (
                                                            <div key={idx} className="flex justify-between text-sm">
                                                                <span>{service.name} ({service.quantity}x)</span>
                                                                <span className="font-medium">Rp {formatPrice(service.price * service.quantity)}</span>
                                                            </div>
                                                        ))}
                                                        <Separator className="my-2" />
                                                        <div className="flex justify-between font-semibold">
                                                            <span>Total Layanan</span>
                                                            <span>Rp {formatPrice(request.totalPrice)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Reason */}
                                                <div className="mb-4">
                                                    <p className="text-sm font-medium mb-1">Alasan Permintaan:</p>
                                                    <p className="text-sm text-gray-600 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                                        {request.reason}
                                                    </p>
                                                </div>

                                                {/* Bukti Foto - WAJIB */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-sm font-medium flex items-center gap-1">
                                                            <ImageIcon className="h-4 w-4" />
                                                            Bukti Foto ({request.images.length}):
                                                            <span className="text-red-500 ml-1">*Wajib</span>
                                                        </p>
                                                        {request.images.length > 0 && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => downloadImages(request)}
                                                                className="h-7 text-xs"
                                                            >
                                                                <Download className="h-3 w-3 mr-1" />
                                                                Download Semua
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                                                        {request.images.map((image, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity group"
                                                                onClick={() => viewImage(image)}
                                                            >
                                                                <img
                                                                    src={image}
                                                                    alt={`Bukti ${idx + 1}`}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <Maximize2 className="h-5 w-5 text-white" />
                                                                </div>
                                                                <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                                                    Foto {idx + 1}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {request.images.length === 0 && (
                                                        <div className="text-center py-4 border-2 border-dashed rounded-lg">
                                                            <AlertCircle className="h-8 w-8 mx-auto text-red-400 mb-2" />
                                                            <p className="text-sm text-red-600">Tidak ada foto bukti</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Rejection reason if rejected */}
                                                {request.status === 'rejected' && request.rejectionReason && (
                                                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                                        <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                                                            Alasan Penolakan:
                                                        </p>
                                                        <p className="text-sm text-red-700 dark:text-red-400">
                                                            {request.rejectionReason}
                                                        </p>
                                                        {request.rejectedAt && (
                                                            <p className="text-xs text-red-600 mt-2">
                                                                Ditolak pada: {formatDate(request.rejectedAt)}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Approval info if approved */}
                                                {request.status === 'approved' && request.approvedAt && (
                                                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                                            <p className="text-sm font-medium text-green-800 dark:text-green-300">
                                                                Permintaan Disetujui
                                                            </p>
                                                        </div>
                                                        <p className="text-sm text-green-700 dark:text-green-400">
                                                            Layanan telah ditambahkan ke pesanan #{request.orderId}
                                                        </p>
                                                        <p className="text-xs text-green-600 mt-2">
                                                            Disetujui pada: {formatDate(request.approvedAt)}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-row lg:flex-col gap-2 lg:min-w-[140px]">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 lg:w-full"
                                                    onClick={() => openDetailModal(request)}
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Detail
                                                </Button>

                                                {request.status === 'pending' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            className="flex-1 lg:w-full bg-green-600 hover:bg-green-700 text-white"
                                                            onClick={() => openApprovalModal(request)}
                                                        >
                                                            <Check className="h-4 w-4 mr-2" />
                                                            Setujui
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex-1 lg:w-full text-red-600 border-red-200 hover:bg-red-50"
                                                            onClick={() => openRejectionModal(request)}
                                                        >
                                                            <X className="h-4 w-4 mr-2" />
                                                            Tolak
                                                        </Button>
                                                    </>
                                                )}

                                                {/* Additional actions for approved/rejected */}
                                                {request.status !== 'pending' && (
                                                    <div className="flex flex-col gap-2">
                                                        {request.status === 'approved' && (
                                                            <div className="text-center p-2 bg-green-50 rounded-lg">
                                                                <CheckCircle className="h-4 w-4 text-green-600 mx-auto mb-1" />
                                                                <p className="text-xs text-green-700">Disetujui</p>
                                                            </div>
                                                        )}
                                                        {request.status === 'rejected' && (
                                                            <div className="text-center p-2 bg-red-50 rounded-lg">
                                                                <XCircle className="h-4 w-4 text-red-600 mx-auto mb-1" />
                                                                <p className="text-xs text-red-700">Ditolak</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle>Detail Permintaan Layanan Tambahan</DialogTitle>
                        <DialogDescription>
                            Permintaan #{selectedRequest?.id} • Pesanan #{selectedRequest?.orderId}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRequest && (
                        <ScrollArea className="max-h-[60vh]">
                            <div className="space-y-6 pr-4">
                                {/* Status */}
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Status:</span>
                                    {getStatusBadge(selectedRequest.status)}
                                </div>

                                <Separator />

                                {/* Customer & Vendor Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Pelanggan</p>
                                        <p className="font-medium">{selectedRequest.customerName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Vendor</p>
                                        <p className="font-medium">{selectedRequest.vendorName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Tanggal Pengajuan</p>
                                        <p className="font-medium">{formatDate(selectedRequest.submittedAt)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">ID Permintaan</p>
                                        <p className="font-medium text-sm">{selectedRequest.id}</p>
                                    </div>
                                </div>

                                {/* Order Details */}
                                {selectedRequest.orderDetails && (
                                    <>
                                        <Separator />
                                        <div>
                                            <h4 className="font-medium mb-2">Detail Pesanan</h4>
                                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <p className="text-sm text-gray-500">Layanan</p>
                                                        <p className="font-medium">{selectedRequest.orderDetails.serviceType}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Jadwal</p>
                                                        <p className="font-medium">{selectedRequest.orderDetails.serviceDate} • {selectedRequest.orderDetails.serviceTime}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <Separator />

                                {/* Services */}
                                <div>
                                    <h4 className="font-medium mb-3">Layanan yang Diminta</h4>
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                        <div className="space-y-3">
                                            {selectedRequest.services.map((service, idx) => (
                                                <div key={idx} className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-medium">{service.name}</p>
                                                        <p className="text-sm text-gray-500">Jumlah: {service.quantity}x • Harga: Rp {formatPrice(service.price)}/{service.priceType || 'unit'}</p>
                                                    </div>
                                                    <p className="font-semibold">
                                                        Rp {formatPrice(service.price * service.quantity)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                        <Separator className="my-3" />
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold">Total Layanan</span>
                                            <span className="font-bold text-lg text-[#7CE0A8]">
                                                Rp {formatPrice(selectedRequest.totalPrice)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Reason */}
                                <div>
                                    <h4 className="font-medium mb-2">Alasan Permintaan</h4>
                                    <p className="text-gray-600 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                        {selectedRequest.reason}
                                    </p>
                                </div>

                                <Separator />

                                {/* Images - WAJIB */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium flex items-center gap-2">
                                            <ImageIcon className="h-4 w-4" />
                                            Bukti Foto ({selectedRequest.images.length})
                                            <span className="text-red-500 text-sm">*Wajib</span>
                                        </h4>
                                        {selectedRequest.images.length > 0 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => downloadImages(selectedRequest)}
                                            >
                                                <Download className="h-3 w-3 mr-1" />
                                                Download Semua
                                            </Button>
                                        )}
                                    </div>
                                    {selectedRequest.images.length === 0 ? (
                                        <div className="text-center py-8 border-2 border-dashed rounded-lg">
                                            <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
                                            <p className="text-red-600 font-medium">Tidak ada foto bukti</p>
                                            <p className="text-sm text-gray-500 mt-1">Pelanggan tidak mengunggah foto bukti</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {selectedRequest.images.map((image, idx) => (
                                                <div
                                                    key={idx}
                                                    className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity group"
                                                    onClick={() => viewImage(image)}
                                                >
                                                    <img
                                                        src={image}
                                                        alt={`Bukti ${idx + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Maximize2 className="h-6 w-6 text-white" />
                                                    </div>
                                                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                                        Foto {idx + 1}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Rejection reason if rejected */}
                                {selectedRequest.status === 'rejected' && selectedRequest.rejectionReason && (
                                    <>
                                        <Separator />
                                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                                            <h4 className="font-medium text-red-800 dark:text-red-300 mb-2">
                                                Alasan Penolakan
                                            </h4>
                                            <p className="text-red-700 dark:text-red-400">
                                                {selectedRequest.rejectionReason}
                                            </p>
                                            {selectedRequest.rejectedAt && (
                                                <p className="text-sm text-red-600 mt-2">
                                                    Ditolak pada: {formatDate(selectedRequest.rejectedAt)}
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}

                                {/* Approval info if approved */}
                                {selectedRequest.status === 'approved' && selectedRequest.approvedAt && (
                                    <>
                                        <Separator />
                                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                            <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">
                                                Permintaan Disetujui
                                            </h4>
                                            <p className="text-green-700 dark:text-green-400">
                                                Layanan telah ditambahkan ke pesanan #{selectedRequest.orderId}
                                            </p>
                                            <div className="mt-2">
                                                <p className="text-sm font-medium">Perubahan pada pesanan:</p>
                                                <ul className="text-sm text-green-600 mt-1 space-y-1">
                                                    <li>• Layanan ditambahkan ke "Layanan yang Dipilih"</li>
                                                    <li>• Subtotal diperbarui: + Rp {formatPrice(selectedRequest.totalPrice)}</li>
                                                    <li>• Total pembayaran diperbarui</li>
                                                    <li>• Pelanggan menerima notifikasi</li>
                                                </ul>
                                            </div>
                                            <p className="text-sm text-green-600 mt-2">
                                                Disetujui pada: {formatDate(selectedRequest.approvedAt)}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </ScrollArea>
                    )}

                    <DialogFooter>
                        {selectedRequest?.status === 'pending' && (
                            <div className="flex gap-2 w-full">
                                <Button
                                    variant="outline"
                                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => {
                                        setShowDetailModal(false);
                                        if (selectedRequest) openRejectionModal(selectedRequest);
                                    }}
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Tolak
                                </Button>
                                <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => {
                                        setShowDetailModal(false);
                                        if (selectedRequest) openApprovalModal(selectedRequest);
                                    }}
                                >
                                    <Check className="h-4 w-4 mr-2" />
                                    Setujui
                                </Button>
                            </div>
                        )}
                        {selectedRequest?.status !== 'pending' && (
                            <div className="flex gap-2 w-full">
                                <Button variant="outline" className="flex-1" onClick={() => setShowDetailModal(false)}>
                                    Tutup
                                </Button>
                                {selectedRequest && selectedRequest.images.length > 0 && (
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => downloadImages(selectedRequest)}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download Foto
                                    </Button>
                                )}
                            </div>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Approval Confirmation Modal */}
            <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Persetujuan</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menyetujui permintaan layanan tambahan ini?
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRequest && (
                        <div className="space-y-4">
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-medium text-green-800 dark:text-green-300 mb-2">
                                            Yang akan terjadi jika disetujui:
                                        </p>
                                        <ul className="space-y-1 text-green-700 dark:text-green-400">
                                            <li>• Layanan akan ditambahkan ke pesanan #{selectedRequest.orderId}</li>
                                            <li>• Subtotal pesanan akan bertambah Rp {formatPrice(selectedRequest.totalPrice)}</li>
                                            <li>• Total pembayaran akan diperbarui</li>
                                            <li>• Pelanggan akan menerima notifikasi</li>
                                            <li>• Status permintaan menjadi "Disetujui"</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                <p className="text-sm font-medium mb-2">Ringkasan Layanan:</p>
                                <div className="space-y-1">
                                    {selectedRequest.services.map((service, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span>{service.name} ({service.quantity}x)</span>
                                            <span>Rp {formatPrice(service.price * service.quantity)}</span>
                                        </div>
                                    ))}
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between font-semibold">
                                    <span>Total yang akan ditambahkan</span>
                                    <span className="text-[#7CE0A8]">Rp {formatPrice(selectedRequest.totalPrice)}</span>
                                </div>
                            </div>

                            {/* Bukti Foto */}
                            <div>
                                <p className="text-sm font-medium mb-2">Bukti Foto yang Dikirim:</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {selectedRequest.images.slice(0, 3).map((image, idx) => (
                                        <div
                                            key={idx}
                                            className="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
                                            onClick={() => viewImage(image)}
                                        >
                                            <img
                                                src={image}
                                                alt={`Bukti ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                    {selectedRequest.images.length > 3 && (
                                        <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center">
                                            <span className="text-sm text-gray-600">+{selectedRequest.images.length - 3}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowApprovalModal(false)}
                            disabled={isProcessing}
                        >
                            Batal
                        </Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={handleApprove}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Ya, Setujui
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rejection Modal */}
            <Dialog open={showRejectionModal} onOpenChange={setShowRejectionModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tolak Permintaan</DialogTitle>
                        <DialogDescription>
                            Berikan alasan penolakan untuk permintaan layanan tambahan ini.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRequest && (
                        <div className="space-y-4">
                            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-medium text-red-800 dark:text-red-300 mb-1">
                                            Perhatian
                                        </p>
                                        <p className="text-red-700 dark:text-red-400">
                                            Penolakan akan dikirimkan ke pelanggan beserta alasan yang Anda berikan.
                                            Permintaan tidak dapat dikembalikan setelah ditolak.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                <p className="text-sm"><strong>Permintaan:</strong> #{selectedRequest.id}</p>
                                <p className="text-sm"><strong>Pesanan:</strong> #{selectedRequest.orderId}</p>
                                <p className="text-sm"><strong>Pelanggan:</strong> {selectedRequest.customerName}</p>
                                <p className="text-sm"><strong>Total Layanan:</strong> Rp {formatPrice(selectedRequest.totalPrice)}</p>
                            </div>

                            <div>
                                <Label htmlFor="rejectionReason" className="text-sm font-medium">
                                    Alasan Penolakan *
                                    <span className="text-red-500 ml-1">(Wajib)</span>
                                </Label>
                                <Textarea
                                    id="rejectionReason"
                                    placeholder="Jelaskan alasan mengapa permintaan ini ditolak..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={4}
                                    className="mt-2"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Alasan penolakan akan dikirim ke pelanggan
                                </p>
                            </div>

                            {/* Bukti Foto yang Dikirim */}
                            <div>
                                <p className="text-sm font-medium mb-2">Bukti Foto yang Dikirim:</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {selectedRequest.images.slice(0, 2).map((image, idx) => (
                                        <div
                                            key={idx}
                                            className="aspect-square rounded-lg overflow-hidden bg-gray-100"
                                        >
                                            <img
                                                src={image}
                                                alt={`Bukti ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                    {selectedRequest.images.length > 2 && (
                                        <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center">
                                            <span className="text-sm text-gray-600">+{selectedRequest.images.length - 2}</span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {selectedRequest.images.length} foto bukti diterima
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowRejectionModal(false)}
                            disabled={isProcessing}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={isProcessing || !rejectionReason.trim()}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    <X className="h-4 w-4 mr-2" />
                                    Tolak Permintaan
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Image Preview Modal */}
            <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Bukti Foto</DialogTitle>
                        <DialogDescription>
                            Klik kanan untuk menyimpan gambar
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-center max-h-[60vh]">
                        <img
                            src={selectedImage}
                            alt="Bukti foto"
                            className="max-h-full max-w-full object-contain rounded-lg"
                        />
                    </div>
                    <DialogFooter className="flex items-center justify-between">
                        <Button
                            variant="outline"
                            onClick={() => {
                                const link = document.createElement('a');
                                link.href = selectedImage;
                                link.download = `bukti-foto-${Date.now()}.jpg`;
                                link.click();
                            }}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                        </Button>
                        <Button variant="outline" onClick={() => setShowImageModal(false)}>
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}