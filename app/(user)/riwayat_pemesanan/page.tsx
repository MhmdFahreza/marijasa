// app/riwayat_pemesanan/page.tsx - FIXED
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Input } from "@/app/components/ui/input";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  ChevronRight,
  Package,
  FileText,
  CreditCard,
  Info,
  Plus,
  Camera,
  X,
  Check,
  AlertCircle,
  Home,
  Wrench,
  Droplets,
  Sprout,
  Sofa,
  Building,
  Smartphone,
  Wallet,
  Banknote,
  QrCode,
  CreditCard as CreditCardIcon,
  Building as BuildingIcon,
  MessageSquare,
  Trash2,
  Loader2,
  ChevronUp,
  Star,
  CheckCircle,
  Upload,
  ChevronDown,
  Store,
  ExternalLink,
  Copy,
  RefreshCw,
  Download,
  Clock as ClockIcon
} from "lucide-react";
import { LoaderTwo } from "@/app/components/transition/loader";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Separator } from "@/app/components/ui/separator";
import { QRCodeSVG } from 'qrcode.react';

// ==========================================
// XENDIT PAYMENT FEES (Client-side)
// ==========================================

const XENDIT_PAYMENT_FEES: Record<string, {
  type: 'fixed' | 'percentage' | 'combined' | 'none';
  rate?: number;
  min?: number;
  amount?: number;
  fixed?: number;
  name: string;
  category: string;
  icon: string;
  color: string;
}> = {
  // E-Wallets - 1.5% (min Rp 1,500)
  ewallet_dana: { type: 'percentage', rate: 1.5, min: 1500, name: 'DANA', category: 'ewallet', icon: 'wallet', color: '#10B981' },
  ewallet_ovo: { type: 'percentage', rate: 1.5, min: 1500, name: 'OVO', category: 'ewallet', icon: 'wallet', color: '#4F46E5' },
  ewallet_shopeepay: { type: 'percentage', rate: 1.5, min: 1500, name: 'ShopeePay', category: 'ewallet', icon: 'wallet', color: '#EE4D2D' },
  ewallet_linkaja: { type: 'percentage', rate: 1.5, min: 1500, name: 'LinkAja', category: 'ewallet', icon: 'wallet', color: '#E31E24' },

  // Virtual Account - Flat fee
  va_bca: { type: 'fixed', amount: 4500, name: 'BCA Virtual Account', category: 'va', icon: 'building', color: '#1E3A8A' },
  va_bni: { type: 'fixed', amount: 4000, name: 'BNI Virtual Account', category: 'va', icon: 'building', color: '#F59E0B' },
  va_bri: { type: 'fixed', amount: 4000, name: 'BRI Virtual Account', category: 'va', icon: 'building', color: '#DC2626' },
  va_mandiri: { type: 'fixed', amount: 4000, name: 'Mandiri Virtual Account', category: 'va', icon: 'building', color: '#059669' },
  va_permata: { type: 'fixed', amount: 4000, name: 'Permata Virtual Account', category: 'va', icon: 'building', color: '#7C3AED' },
  va_bsi: { type: 'fixed', amount: 4000, name: 'BSI Virtual Account', category: 'va', icon: 'building', color: '#059669' },
  va_cimb: { type: 'fixed', amount: 4000, name: 'CIMB Niaga Virtual Account', category: 'va', icon: 'building', color: '#DC2626' },

  // QRIS - 0.7%
  qris: { type: 'percentage', rate: 0.7, min: 0, name: 'QRIS', category: 'qris', icon: 'qrcode', color: '#EF4444' },

  // Cards - 2.9% + Rp 2,000
  card_visa: { type: 'combined', rate: 2.9, fixed: 2000, name: 'Kartu Visa', category: 'card', icon: 'credit-card', color: '#1A1F71' },
  card_mastercard: { type: 'combined', rate: 2.9, fixed: 2000, name: 'Kartu Mastercard', category: 'card', icon: 'credit-card', color: '#EB001B' },
  card_jcb: { type: 'combined', rate: 2.9, fixed: 2000, name: 'Kartu JCB', category: 'card', icon: 'credit-card', color: '#0066B3' },

  // Retail Outlets - Flat fee
  retail_alfamart: { type: 'fixed', amount: 5000, name: 'Alfamart', category: 'retail', icon: 'store', color: '#DC2626' },
  retail_indomaret: { type: 'fixed', amount: 5000, name: 'Indomaret', category: 'retail', icon: 'store', color: '#1E40AF' },

  // Tunai - No fee
  tunai: { type: 'fixed', amount: 0, name: 'Tunai', category: 'tunai', icon: 'banknote', color: '#6B7280' },
};

const SERVICE_FEE = 10000;

// Calculate fee based on payment method
function calculateTransactionFee(paymentMethod: string, amount: number): number {
  const config = XENDIT_PAYMENT_FEES[paymentMethod];
  if (!config) return 0;

  switch (config.type) {
    case 'fixed':
      return config.amount || 0;
    case 'percentage':
      const percentFee = Math.ceil(amount * ((config.rate || 0) / 100));
      return Math.max(percentFee, config.min || 0);
    case 'combined':
      return Math.ceil(amount * ((config.rate || 0) / 100)) + (config.fixed || 0);
    default:
      return 0;
  }
}

// Get display fee description
function getFeeDescription(paymentMethod: string): string {
  const config = XENDIT_PAYMENT_FEES[paymentMethod];
  if (!config) return '-';

  switch (config.type) {
    case 'fixed':
      if (config.amount === 0) return 'Gratis';
      return `Rp ${(config.amount || 0).toLocaleString('id-ID')}`;
    case 'percentage':
      return (config.min || 0) > 0
        ? `${config.rate}% (min Rp ${(config.min || 0).toLocaleString('id-ID')})`
        : `${config.rate}%`;
    case 'combined':
      return `${config.rate}% + Rp ${(config.fixed || 0).toLocaleString('id-ID')}`;
    default:
      return '-';
  }
}

// Get calculated fee display
function getCalculatedFeeDisplay(paymentMethod: string, amount: number): string {
  const fee = calculateTransactionFee(paymentMethod, amount);
  if (fee === 0) return 'Gratis';
  return `Rp ${fee.toLocaleString('id-ID')}`;
}

// ==========================================
// INTERFACES
// ==========================================

interface PaymentResponse {
  success: boolean;
  paymentType: string;
  paymentMethod?: string;
  paymentMethodName?: string;
  orderId: string;
  amount: number;
  transactionFee: number;
  totalAmount: number;
  xenditId?: string;
  qrId?: string;
  qrString?: string;
  qrCodeUrl?: string;
  qrCodeData?: string;
  invoiceUrl?: string;
  expiresAt?: string;
  vaNumber?: string;
  bankCode?: string;
  ewalletType?: string;
  cardType?: string;
  paymentCode?: string;
  retailOutlet?: string;
  expirationDate?: string;
  isTestMode?: boolean;
  message?: string;
  error?: string;
  details?: any;
  checkoutUrl?: string;
  deeplinkUrl?: string;
  actions?: {
    desktop_web_checkout_url?: string;
    mobile_web_checkout_url?: string;
    mobile_deeplink_checkout_url?: string;
    qr_checkout_string?: string;
  };
}

// ==========================================
// MAIN COMPONENT - FIXED WITHOUT DOUBLE COUNTING
// ==========================================

export default function OrderHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("semua");
  const [newServiceData, setNewServiceData] = useState({
    selectedServices: [] as string[],
    quantities: {} as Record<string, number>,
    reason: "",
    images: [] as File[],
    previews: [] as string[]
  });
  const [vendorServices, setVendorServices] = useState<any[]>([]);
  const [showServiceRequestModal, setShowServiceRequestModal] = useState(false);

  // Xendit Payment modal states
  const [showXenditPaymentModal, setShowXenditPaymentModal] = useState(false);
  const [selectedXenditPayment, setSelectedXenditPayment] = useState<string>("");
  const [xenditPaymentData, setXenditPaymentData] = useState<PaymentResponse | null>(null);
  const [xenditPaymentMode, setXenditPaymentMode] = useState<'select' | 'instruction'>('select');
  const [showXenditPaymentOptions, setShowXenditPaymentOptions] = useState(false);
  const [expandedXenditSections, setExpandedXenditSections] = useState<Record<string, boolean>>({
    ewallet: true,
    va: false,
    card: false,
    qris: false,
    retail: false,
    tunai: false
  });
  const [paymentForOrder, setPaymentForOrder] = useState<"main" | "additional">("main");
  const [selectedAdditionalService, setSelectedAdditionalService] = useState<any>(null);

  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Completion modal
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [ratingData, setRatingData] = useState({
    rating: 0,
    comment: "",
    isSubmitted: false,
    photos: [] as string[],
    isAnonymous: false
  });
  const [showThankYouModal, setShowThankYouModal] = useState(false);

  // QRIS refresh timer
  const [qrRefreshTime, setQrRefreshTime] = useState<number>(300);
  const [isRefreshingQR, setIsRefreshingQR] = useState(false);
  const [currentQrString, setCurrentQrString] = useState<string>('');

  // Loading states untuk setiap aktivitas
  const [actionLoadingStates, setActionLoadingStates] = useState<Record<string, boolean>>({});

  // Initialize QR string from payment data
  useEffect(() => {
    if (xenditPaymentData?.qrString) {
      setCurrentQrString(xenditPaymentData.qrString);
    }
  }, [xenditPaymentData]);

  // Start countdown timer for QR refresh
  useEffect(() => {
    if (selectedXenditPayment === 'qris' && qrRefreshTime > 0 && showXenditPaymentModal && xenditPaymentMode === 'instruction') {
      const interval = setInterval(() => {
        setQrRefreshTime(prev => {
          if (prev <= 1) {
            refreshQRCode();
            return 300;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [selectedXenditPayment, qrRefreshTime, showXenditPaymentModal, xenditPaymentMode]);

  const refreshQRCode = async () => {
    if (isRefreshingQR || !selectedOrder) return;

    setIsRefreshingQR(true);
    try {
      const response = await fetch(`/api/payments/xendit?orderId=${selectedOrder.id}&refreshQR=true`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success && data.booking?.refreshedQR) {
        const refreshed = data.booking.refreshedQR;
        if (refreshed.qrString) {
          setCurrentQrString(refreshed.qrString);
          toast.success('QR code berhasil diperbarui');
          setQrRefreshTime(300);
        }
      }
    } catch (error) {
      console.error('Error refreshing QR code:', error);
      toast.error('Gagal memperbarui QR code');
    } finally {
      setIsRefreshingQR(false);
    }
  };

  // Fungsi untuk mengatur loading state
  const setActionLoading = useCallback((key: string, isLoading: boolean) => {
    setActionLoadingStates(prev => ({ ...prev, [key]: isLoading }));
  }, []);

  const isActionLoading = useCallback((key: string) => {
    return actionLoadingStates[key] || false;
  }, [actionLoadingStates]);

  const handleChatVendor = (vendorId: string) => {
    if (!vendorId) {
      toast.error("Vendor ID tidak ditemukan");
      return;
    }
    router.push(`/chat/${vendorId}`);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} berhasil disalin`);
    setTimeout(() => { }, 2000);
  };

  const formatExpiration = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const loadOrders = useCallback(async () => {
    try {
      setIsPageLoading(true);
      const response = await fetch('/api/user/orders', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Silakan login terlebih dahulu");
          window.location.href = '/login';
          return;
        }
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      if (data.success) {
        // Process orders dengan perhitungan yang benar - FIX: Gunakan total dari API tanpa menambahkan lagi
        const processedOrders = data.orders.map((order: any) => {
          // Total dari API sudah final dan TIDAK perlu ditambah dengan apa pun
          const totalPrice = order.totalPrice || 0;

          // Hitung total layanan tambahan yang belum dibayar untuk informasi saja
          const unpaidAdditionalTotal = order.additionalServices
            ?.filter((add: any) =>
              (add.status === "disetujui" || add.status === "approved" || add.status === "diterima") &&
              !add.isPaid
            )
            .reduce((sum: number, add: any) => {
              const serviceFee = add.serviceFee || 10000;
              const transactionFee = add.transactionFee || 0;
              return sum + (add.totalPrice || 0) + serviceFee + transactionFee;
            }, 0) || 0;

          // FIX: Jangan tambahkan paidAdditionalTotal ke totalPrice karena sudah termasuk
          return {
            ...order,
            // Total keseluruhan = total dari API (sudah final)
            totalPrice: totalPrice,
            unpaidAdditionalTotal: unpaidAdditionalTotal
          };
        });
        setOrders(processedOrders);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      toast.error("Gagal memuat data pesanan");
      setOrders([]);
    } finally {
      setIsPageLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "dibatalkan":
        return "bg-red-100 text-red-800";
      case "diproses":
        return "bg-blue-100 text-blue-800";
      case "selesai":
        return "bg-green-100 text-green-800";
      case "menunggu pembayaran":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // ==========================================
  // FIXED CALCULATION FUNCTIONS - NO DOUBLE COUNTING
  // ==========================================

  // Get base total (pembayaran utama TANPA layanan tambahan)
  const getBaseTotal = (order: any): number => {
    // FIX: Gunakan subtotal dari API
    return (order.paymentDetails?.subtotal || 0) +
      (order.paymentDetails?.serviceFee || 0) +
      (order.paymentDetails?.transactionFee || 0);
  };

  // Get total paid additional services
  const getPaidAdditionalTotal = (order: any): number => {
    if (!order.additionalServices) return 0;

    return order.additionalServices
      .filter((add: any) =>
        (add.status === "disetujui" || add.status === "approved" || add.status === "diterima") &&
        add.isPaid
      )
      .reduce((sum: number, add: any) => {
        const serviceFee = add.serviceFee || 10000;
        const transactionFee = add.transactionFee || 0;
        return sum + (add.totalPrice || 0) + serviceFee + transactionFee;
      }, 0);
  };

  // Get unpaid additional services total
  const getUnpaidAdditionalTotal = (order: any): number => {
    return order.unpaidAdditionalTotal || 0;
  };

  // Get total paid so far (base + paid additional) - FIX: Gunakan total dari API
  const getTotalPaid = (order: any): number => {
    // Total dari API sudah final
    return order.totalPrice || 0;
  };

  // Get total outstanding (unpaid additional)
  const getTotalOutstanding = (order: any): number => {
    return getUnpaidAdditionalTotal(order);
  };

  // Check if has unpaid additional services
  const hasUnpaidAdditionalServices = (order: any): boolean => {
    return getUnpaidAdditionalTotal(order) > 0;
  };

  // Get approved additional services (both paid and unpaid)
  const getApprovedAdditionalServices = (order: any): any[] => {
    if (!order.additionalServices) return [];
    return order.additionalServices.filter((add: any) =>
      add.status === "disetujui" || add.status === "approved" || add.status === "diterima"
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID').format(price);
  };

  const handleOrderClick = (order: any) => {
    if (expandedOrderId === order.id) {
      setExpandedOrderId(null);
      setSelectedOrder(null);
    } else {
      setExpandedOrderId(order.id);
      setSelectedOrder(order);
    }
  };

  const handleAddServiceClick = () => {
    if (!selectedOrder) return;
    setIsAddServiceModalOpen(true);
    setNewServiceData({
      selectedServices: [],
      quantities: {},
      reason: "",
      images: [],
      previews: []
    });
    if (selectedOrder.vendorServices) {
      setVendorServices(selectedOrder.vendorServices);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const newPreviews: string[] = [];

    if (newFiles.length === 0) {
      toast.error("Wajib mengunggah minimal 1 foto bukti");
      return;
    }

    const currentCount = newServiceData.images.length;
    if (currentCount + newFiles.length > 5) {
      toast.error("Maksimal 5 foto");
      return;
    }

    newFiles.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Ukuran foto ${file.name} terlalu besar (max 5MB)`);
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error(`File ${file.name} bukan gambar`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newPreviews.push(e.target.result as string);
          if (newPreviews.length === newFiles.length) {
            setNewServiceData(prev => ({
              ...prev,
              images: [...prev.images, ...newFiles],
              previews: [...prev.previews, ...newPreviews]
            }));
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setNewServiceData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      previews: prev.previews.filter((_, i) => i !== index)
    }));
  };

  const handleServiceSelection = (serviceId: string, checked: boolean) => {
    if (checked) {
      setNewServiceData(prev => ({
        ...prev,
        selectedServices: [...prev.selectedServices, serviceId],
        quantities: { ...prev.quantities, [serviceId]: 1 }
      }));
    } else {
      const newQuantities = { ...newServiceData.quantities };
      delete newQuantities[serviceId];

      setNewServiceData(prev => ({
        ...prev,
        selectedServices: prev.selectedServices.filter(id => id !== serviceId),
        quantities: newQuantities
      }));
    }
  };

  const handleQuantityChange = (serviceId: string, quantity: number) => {
    if (quantity < 1) quantity = 1;
    setNewServiceData(prev => ({
      ...prev,
      quantities: { ...prev.quantities, [serviceId]: quantity }
    }));
  };

  const calculateNewServiceTotal = () => {
    let total = 0;
    newServiceData.selectedServices.forEach(serviceId => {
      const service = vendorServices.find((s: any) => s.id === serviceId);
      if (service) {
        const quantity = newServiceData.quantities[serviceId] || 1;
        total += service.price * quantity;
      }
    });
    return total;
  };

  const handleSubmitNewService = async () => {
    if (newServiceData.selectedServices.length === 0) {
      toast.error("Harap pilih minimal satu layanan tambahan");
      return;
    }

    if (!newServiceData.reason.trim()) {
      toast.error("Harap isi alasan permintaan layanan tambahan");
      return;
    }

    if (newServiceData.images.length === 0) {
      toast.error("Wajib mengunggah minimal 1 foto bukti");
      return;
    }

    const loadingKey = `add_service_${selectedOrder.id}`;
    setActionLoading(loadingKey, true);

    try {
      const response = await fetch('/api/user/orders/additional-service', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          orderId: selectedOrder.id,
          selectedServices: newServiceData.selectedServices,
          quantities: newServiceData.quantities,
          reason: newServiceData.reason,
          images: newServiceData.previews
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit request');
      }

      const data = await response.json();

      setOrders(prevOrders => prevOrders.map(order => {
        if (order.id === selectedOrder.id) {
          const additionalServices = order.additionalServices || [];
          return {
            ...order,
            additionalServices: [...additionalServices, data.request]
          };
        }
        return order;
      }));

      setIsAddServiceModalOpen(false);
      setShowServiceRequestModal(true);

      setNewServiceData({
        selectedServices: [],
        quantities: {},
        reason: "",
        images: [],
        previews: []
      });

      toast.success("Permintaan layanan tambahan berhasil dikirim!");

    } catch (error: any) {
      console.error("Error submitting additional service:", error);
      toast.error(error.message || "Gagal mengirim permintaan layanan tambahan");
    } finally {
      setActionLoading(loadingKey, false);
    }
  };

  const handleOpenXenditPaymentModal = (order: any, forAdditional: boolean = false, additionalService?: any) => {
    setSelectedOrder(order);
    setPaymentForOrder(forAdditional ? "additional" : "main");
    setSelectedAdditionalService(additionalService || null);

    // Reset payment states
    setSelectedXenditPayment("");
    setXenditPaymentData(null);
    setXenditPaymentMode('select');
    setShowXenditPaymentOptions(false);
    setQrRefreshTime(300);
    setCurrentQrString('');

    // Show modal
    setShowXenditPaymentModal(true);
  };

  const handleCreateXenditPayment = async () => {
    if (!selectedXenditPayment || !selectedOrder) {
      toast.error("Silakan pilih metode pembayaran terlebih dahulu.");
      return;
    }

    const loadingKey = `xendit_payment_${selectedOrder.id}`;
    setActionLoading(loadingKey, true);

    try {
      let baseAmount = 0;
      let description = "";

      if (paymentForOrder === "additional" && selectedAdditionalService) {
        // Pembayaran untuk layanan tambahan spesifik
        const subtotal = selectedAdditionalService.totalPrice || 0;
        baseAmount = subtotal + SERVICE_FEE;
        description = `Pembayaran layanan tambahan: ${selectedAdditionalService.description}`;
      } else {
        // Pembayaran utama - base total
        baseAmount = getBaseTotal(selectedOrder);
        description = `Pembayaran untuk layanan: ${selectedOrder.serviceType}`;
      }

      // Calculate transaction fee (tunai = 0)
      const transactionFee = selectedXenditPayment === 'tunai' ? 0 : calculateTransactionFee(selectedXenditPayment, baseAmount);
      const totalAmount = baseAmount + transactionFee;

      // Prepare customer info
      const customerInfo = selectedOrder.customerInfo || {};

      // Create payment request payload
      const requestPayload = {
        orderId: selectedOrder.id,
        paymentMethod: selectedXenditPayment,
        customerName: customerInfo.name || "Pelanggan",
        customerEmail: customerInfo.email || "",
        customerPhone: customerInfo.phone || "",
        amount: baseAmount,
        transactionFee: transactionFee,
        totalAmount: totalAmount,
        description: description,
        paymentType: paymentForOrder === "additional" ? "additional" : "main",
        additionalServiceId: paymentForOrder === "additional" ? selectedAdditionalService?.id : null
      };

      console.log('[Xendit Payment] Creating payment:', requestPayload);

      const response = await fetch('/api/payments/xendit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create payment');
      }

      const data: PaymentResponse = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Payment creation failed');
      }

      // Untuk tunai, langsung refresh orders dan tutup modal
      if (selectedXenditPayment === 'tunai') {
        await loadOrders();
        toast.success("Pembayaran tunai berhasil dikonfirmasi!");
        setShowXenditPaymentModal(false);
        setSelectedXenditPayment("");
        setXenditPaymentData(null);
        setXenditPaymentMode('select');
        return;
      }

      // Untuk metode pembayaran lainnya
      setXenditPaymentData(data);
      setXenditPaymentMode('instruction');

      if (data.qrString) {
        setCurrentQrString(data.qrString);
      }

      toast.success("Pembayaran berhasil dibuat! Silakan selesaikan pembayaran.");

    } catch (error: any) {
      console.error("Error creating Xendit payment:", error);
      toast.error(error.message || "Gagal membuat pembayaran");
    } finally {
      setActionLoading(loadingKey, false);
    }
  };

  const handleCheckPaymentStatus = async () => {
    if (!selectedOrder) return;

    const loadingKey = `check_status_${selectedOrder.id}`;
    setActionLoading(loadingKey, true);

    try {
      const response = await fetch(`/api/payments/xendit?orderId=${selectedOrder.id}&checkXendit=true`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success && data.booking) {
        if (data.booking.paymentStatus === 'PAID') {
          toast.success("Pembayaran sudah berhasil!");
          await loadOrders();
          setShowXenditPaymentModal(false);
        } else {
          toast.info(`Status pembayaran: ${data.booking.paymentStatus}`);
        }
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
      toast.error("Gagal memeriksa status pembayaran");
    } finally {
      setActionLoading(loadingKey, false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!selectedOrder) return;

    const loadingKey = `simulate_${selectedOrder.id}`;
    setActionLoading(loadingKey, true);

    try {
      const payload: any = {
        orderId: selectedOrder.id
      };

      if (paymentForOrder === "additional" && selectedAdditionalService) {
        payload.additionalServiceId = selectedAdditionalService.id;
        payload.paymentType = "additional";
      } else {
        payload.paymentType = "main";
      }

      const response = await fetch('/api/payments/xendit/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Pembayaran berhasil disimulasikan!");
        await loadOrders();
        setShowXenditPaymentModal(false);
        setSelectedXenditPayment("");
        setXenditPaymentData(null);
        setXenditPaymentMode('select');
      } else {
        toast.error(data.message || 'Gagal mensimulasikan pembayaran');
      }
    } catch (error: any) {
      console.error("Error simulating payment:", error);
      toast.error(error.message || "Gagal mensimulasikan pembayaran");
    } finally {
      setActionLoading(loadingKey, false);
    }
  };

  const toggleXenditSection = (section: string) => {
    setExpandedXenditSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const xenditPaymentCategories = {
    ewallet: {
      name: 'E-Wallet',
      icon: Wallet,
      methods: ['ewallet_dana', 'ewallet_ovo', 'ewallet_shopeepay', 'ewallet_linkaja']
    },
    va: {
      name: 'Virtual Account',
      icon: BuildingIcon,
      methods: ['va_bca', 'va_bni', 'va_bri', 'va_mandiri', 'va_permata', 'va_bsi', 'va_cimb']
    },
    qris: {
      name: 'QRIS',
      icon: QrCode,
      methods: ['qris']
    },
    card: {
      name: 'Kartu Kredit/Debit',
      icon: CreditCardIcon,
      methods: ['card_visa', 'card_mastercard', 'card_jcb']
    },
    retail: {
      name: 'Gerai Retail',
      icon: Store,
      methods: ['retail_alfamart', 'retail_indomaret']
    },
    tunai: {
      name: 'Tunai',
      icon: Banknote,
      methods: ['tunai']
    }
  };

  const handleOpenCancelModal = (order: any) => {
    if (order.status !== "menunggu pembayaran") {
      toast.error("Pesanan ini tidak dapat dibatalkan karena sudah diproses.");
      return;
    }
    setSelectedOrder(order);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error("Silakan berikan alasan pembatalan.");
      return;
    }

    const loadingKey = `cancel_${selectedOrder.id}`;
    setActionLoading(loadingKey, true);

    try {
      const response = await fetch('/api/user/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'cancel',
          orderId: selectedOrder.id,
          reason: cancelReason
        })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel order');
      }

      setOrders(prevOrders => prevOrders.map(order => {
        if (order.id === selectedOrder.id) {
          return {
            ...order,
            status: "dibatalkan",
            statusColor: "bg-red-100 text-red-800",
            orderHistory: [
              ...order.orderHistory,
              {
                status: "Pesanan Dibatalkan",
                date: new Date().toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                }) + " - " + new Date().toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit'
                }),
                reason: cancelReason
              }
            ],
            cancellationReason: cancelReason
          };
        }
        return order;
      }));

      setShowCancelModal(false);
      setCancelReason("");
      toast.success("Pesanan berhasil dibatalkan!");

    } catch (error: any) {
      console.error("Error cancelling order:", error);
      toast.error(error.message || "Gagal membatalkan pesanan");
    } finally {
      setActionLoading(loadingKey, false);
    }
  };

  const handleOpenCompletionModal = (order: any) => {
    if (order.status !== "diproses") {
      toast.error("Hanya pesanan yang sedang diproses yang dapat dikonfirmasi selesai.");
      return;
    }

    const hasUnpaid = hasUnpaidAdditionalServices(order);

    if (hasUnpaid) {
      toast.error("Harap bayar layanan tambahan terlebih dahulu sebelum mengkonfirmasi selesai.");
      return;
    }

    setSelectedOrder(order);
    setRatingData({
      rating: order.rating || 0,
      comment: order.review || "",
      isSubmitted: false,
      photos: order.ratingPhotos || [],
      isAnonymous: order.isAnonymous || false
    });
    setShowCompletionModal(true);
  };

  const handleConfirmCompletion = async () => {
    if (!selectedOrder) return;

    const hasRating = ratingData.rating > 0;
    const loadingKey = `complete_${selectedOrder.id}`;
    setActionLoading(loadingKey, true);

    try {
      const response = await fetch('/api/user/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'complete',
          orderId: selectedOrder.id,
          rating: hasRating ? ratingData.rating : null,
          comment: hasRating ? ratingData.comment : null,
          photos: hasRating ? ratingData.photos : [],
          isAnonymous: ratingData.isAnonymous
        })
      });

      if (!response.ok) {
        throw new Error('Failed to complete order');
      }

      setOrders(prevOrders => prevOrders.map(order => {
        if (order.id === selectedOrder.id) {
          const updatedOrder = {
            ...order,
            status: "selesai",
            statusColor: "bg-green-100 text-green-800",
            orderHistory: [
              ...order.orderHistory,
              {
                status: "Pekerjaan Selesai",
                date: new Date().toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                }) + " - " + new Date().toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit'
                })
              }
            ]
          };

          if (hasRating) {
            updatedOrder.rating = ratingData.rating;
            updatedOrder.review = ratingData.comment;
            updatedOrder.ratingPhotos = ratingData.photos;
            updatedOrder.isAnonymous = ratingData.isAnonymous;
            updatedOrder.orderHistory.push({
              status: "Rating dan Ulasan Diberikan",
              date: new Date().toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              }) + " - " + new Date().toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
              })
            });
          }

          return updatedOrder;
        }
        return order;
      }));

      setShowCompletionModal(false);

      if (hasRating) {
        setShowThankYouModal(true);
        setTimeout(() => {
          setShowThankYouModal(false);
        }, 3000);
        toast.success("Terima kasih atas rating dan ulasan Anda!");
      } else {
        toast.success("Pekerjaan telah dikonfirmasi selesai!");
      }

    } catch (error: any) {
      console.error("Error completing order:", error);
      toast.error(error.message || "Gagal mengkonfirmasi pesanan selesai");
    } finally {
      setActionLoading(loadingKey, false);
    }
  };

  const handleStarClick = (star: number) => {
    setRatingData(prev => ({
      ...prev,
      rating: star
    }));
  };

  const handleRatingPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxPhotos = 3;
    const currentPhotos = ratingData.photos.length;

    if (currentPhotos >= maxPhotos) {
      toast.error(`Maksimal ${maxPhotos} foto`);
      return;
    }

    const remainingSlots = maxPhotos - currentPhotos;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Ukuran foto ${file.name} terlalu besar (max 5MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setRatingData(prev => ({
            ...prev,
            photos: [...prev.photos, e.target!.result as string]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeRatingPhoto = (index: number) => {
    setRatingData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleDownloadQRCode = () => {
    if (xenditPaymentData?.qrCodeUrl) {
      const link = document.createElement('a');
      link.href = xenditPaymentData.qrCodeUrl;
      link.download = `qris-${selectedOrder?.id}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('QR code berhasil diunduh');
    } else if (currentQrString) {
      toast.info('Fitur download dari QR string sedang dikembangkan');
    }
  };

  const generateQRCodeFromString = () => {
    if (!currentQrString) return null;

    return (
      <div className="w-64 h-64 mx-auto">
        <QRCodeSVG
          value={currentQrString}
          size={256}
          level="H"
          includeMargin={true}
          bgColor="#FFFFFF"
          fgColor="#000000"
        />
      </div>
    );
  };

  const getServiceIcon = (serviceType: string) => {
    if (serviceType.includes("AC")) return <Wrench className="h-5 w-5" />;
    if (serviceType.includes("Listrik")) return <Smartphone className="h-5 w-5" />;
    if (serviceType.includes("Pembersihan")) return <Home className="h-5 w-5" />;
    if (serviceType.includes("Ledeng") || serviceType.includes("Pipa")) return <Droplets className="h-5 w-5" />;
    if (serviceType.includes("Sedot")) return <Droplets className="h-5 w-5" />;
    if (serviceType.includes("Taman")) return <Sprout className="h-5 w-5" />;
    if (serviceType.includes("Furnitur")) return <Sofa className="h-5 w-5" />;
    return <Package className="h-5 w-5" />;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "dibatalkan": return "Dibatalkan";
      case "diproses": return "Diproses";
      case "selesai": return "Selesai";
      case "menunggu pembayaran": return "Menunggu Pembayaran";
      default: return status;
    }
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === "semua") return true;
    if (activeTab === "aktif") return order.status === "diproses" || order.status === "menunggu pembayaran";
    if (activeTab === "selesai") return order.status === "selesai";
    if (activeTab === "dibatalkan") return order.status === "dibatalkan";
    return true;
  });

  // ==========================================
  // RENDER FUNCTIONS
  // ==========================================

  const renderXenditPaymentInstruction = () => {
    if (!xenditPaymentData || !selectedXenditPayment) return null;

    const methodInfo = XENDIT_PAYMENT_FEES[selectedXenditPayment];
    const isQRIS = selectedXenditPayment === 'qris';
    const isEWallet = selectedXenditPayment.startsWith('ewallet_');
    const isVA = selectedXenditPayment.startsWith('va_');
    const isCard = selectedXenditPayment.startsWith('card_');
    const isRetail = selectedXenditPayment.startsWith('retail_');
    const isTunai = selectedXenditPayment === 'tunai';

    if (isTunai) {
      return (
        <div className="space-y-6">
          {/* Payment Method Info */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-800">Pembayaran Tunai Dikonfirmasi</p>
                <p className="text-sm text-green-600">Order ID: {selectedOrder?.id}</p>
              </div>
            </div>
          </div>

          {/* Success Message */}
          <div className="p-6 bg-white border border-green-300 rounded-lg text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Pembayaran Tunai Berhasil!</h3>
            <p className="text-gray-600 mb-6">
              Pembayaran tunai telah dikonfirmasi. Pesanan Anda sekarang dalam proses pengerjaan.
            </p>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg text-left">
                <p className="font-medium mb-2">Informasi Pesanan:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Layanan: {selectedOrder?.serviceType || '-'}</li>
                  <li>• Vendor: {selectedOrder?.vendorName || '-'}</li>
                  <li>• Total: Rp {formatPrice(xenditPaymentData.totalAmount)}</li>
                  <li>• Status: <span className="text-green-600 font-medium">Diproses</span></li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg text-left">
                <p className="font-medium mb-2">Catatan Pembayaran Tunai:</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Siapkan pembayaran tunai saat vendor datang</li>
                  <li>• Pastikan menerima layanan sebelum membayar</li>
                  <li>• Minta tanda terima dari vendor</li>
                  <li>• Vendor akan mengkonfirmasi setelah pembayaran</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <Button
              className="w-full bg-[#7CE0A8] hover:bg-[#6bd097] text-white"
              onClick={() => {
                setShowXenditPaymentModal(false);
                loadOrders();
              }}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Tutup dan Lanjutkan
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/chat/${selectedOrder?.vendorId}`)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Hubungi Vendor
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Payment Method Info */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: methodInfo?.color || '#6B7280' }}
              >
                {methodInfo?.icon === 'wallet' && <Wallet className="h-5 w-5" />}
                {methodInfo?.icon === 'building' && <BuildingIcon className="h-5 w-5" />}
                {methodInfo?.icon === 'qrcode' && <QrCode className="h-5 w-5" />}
                {methodInfo?.icon === 'credit-card' && <CreditCardIcon className="h-5 w-5" />}
                {methodInfo?.icon === 'store' && <Store className="h-5 w-5" />}
                {methodInfo?.icon === 'banknote' && <Banknote className="h-5 w-5" />}
              </div>
              <div>
                <p className="font-medium">{xenditPaymentData.paymentMethodName || methodInfo?.name || selectedXenditPayment}</p>
                <p className="text-sm text-muted-foreground">Order ID: {selectedOrder?.id}</p>
                {xenditPaymentData.xenditId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Xendit ID: {xenditPaymentData.xenditId?.slice(-8) || 'N/A'}
                  </p>
                )}
              </div>
            </div>
            {isQRIS && (
              <Badge variant="outline" className={qrRefreshTime <= 60 ? 'text-red-600' : ''}>
                <ClockIcon className="h-3 w-3 mr-1" />
                QR Berubah: {formatTime(qrRefreshTime)}
              </Badge>
            )}
          </div>
        </div>

        {/* QRIS DISPLAY */}
        {isQRIS && (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg flex flex-col items-center">
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Scan QR Code dengan aplikasi e-wallet atau mobile banking<br />
                <span className="text-xs">QR code akan otomatis diperbarui setiap 5 menit untuk keamanan</span>
              </p>

              {/* QR Code Display */}
              <div className="bg-white p-6 rounded-lg border-2 border-dashed border-gray-300 shadow-sm">
                {currentQrString ? (
                  generateQRCodeFromString()
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center">
                    <Loader2 className="h-12 w-12 text-gray-400 animate-spin" />
                    <span className="ml-2 text-sm">Memuat QR code...</span>
                  </div>
                )}
              </div>

              {/* Download QR Code Button */}
              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleDownloadQRCode}
                  disabled={!xenditPaymentData?.qrCodeUrl}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {xenditPaymentData?.qrCodeUrl ? 'Download QR Code' : 'Download Tidak Tersedia'}
                </Button>

                <Button
                  variant="ghost"
                  onClick={refreshQRCode}
                  disabled={isRefreshingQR}
                  className="flex items-center gap-2"
                >
                  {isRefreshingQR ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Perbarui QR Code
                </Button>
              </div>

              {/* QRIS Info */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg w-full">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Informasi QRIS:</h4>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                      <li>Scan dengan aplikasi DANA, OVO, GoPay, ShopeePay, LinkAja, atau mobile banking</li>
                      <li>QR code otomatis berubah setiap 5 menit untuk keamanan</li>
                      <li>Berlaku hingga: {xenditPaymentData.expirationDate ? formatExpiration(xenditPaymentData.expirationDate) : '24 jam'}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* E-WALLET DISPLAY */}
        {isEWallet && (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <Smartphone className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">
                    Pembayaran {xenditPaymentData.paymentMethodName || methodInfo?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Untuk mode testing, gunakan tombol "Simulasi Pembayaran Berhasil" di bawah.
                  </p>
                </div>
              </div>
            </div>

            {/* E-Wallet Instructions */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Cara Pembayaran (Testing):</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Klik tombol "Simulasi Pembayaran Berhasil" di bawah</li>
                <li>Status pembayaran akan berubah menjadi PAID</li>
                <li>Pesanan akan langsung diproses oleh vendor</li>
              </ol>
            </div>
          </div>
        )}

        {/* VIRTUAL ACCOUNT DISPLAY */}
        {isVA && xenditPaymentData.vaNumber && (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Nomor Virtual Account</p>
              <div className="flex items-center justify-between gap-4">
                <span className="text-2xl font-mono font-bold tracking-wider">{xenditPaymentData.vaNumber}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(xenditPaymentData.vaNumber!, 'Nomor VA')}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Salin
                </Button>
              </div>
            </div>

            {/* VA Instructions */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Cara Pembayaran:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Buka aplikasi mobile banking atau ATM {xenditPaymentData.bankCode}</li>
                <li>Pilih menu Transfer / Virtual Account</li>
                <li>Masukkan nomor VA: <strong>{xenditPaymentData.vaNumber}</strong></li>
                <li>Masukkan nominal: <strong>Rp {xenditPaymentData.totalAmount.toLocaleString('id-ID')}</strong></li>
                <li>Konfirmasi dan selesaikan pembayaran</li>
              </ol>
            </div>
          </div>
        )}

        {/* CARD PAYMENT DISPLAY */}
        {isCard && (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <CreditCardIcon className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">Pembayaran Kartu {xenditPaymentData.cardType}</p>
                  <p className="text-sm text-muted-foreground">Pembayaran dengan kartu kredit/debit</p>
                </div>
              </div>

              {xenditPaymentData.invoiceUrl && (
                <Button
                  className="w-full"
                  onClick={() => window.open(xenditPaymentData.invoiceUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Buka Invoice Pembayaran
                </Button>
              )}
            </div>

            {/* Card Instructions */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Informasi:</h4>
              <p className="text-sm text-blue-800">
                {xenditPaymentData.invoiceUrl
                  ? 'Klik tombol di atas untuk membuka invoice pembayaran dan lanjutkan dengan kartu Anda.'
                  : 'Untuk testing, klik tombol "Simulasi Pembayaran" di bawah untuk melanjutkan.'}
              </p>
            </div>
          </div>
        )}

        {/* RETAIL OUTLET DISPLAY */}
        {isRetail && xenditPaymentData.paymentCode && (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Kode Pembayaran</p>
              <div className="flex items-center justify-between gap-4">
                <span className="text-2xl font-mono font-bold tracking-wider">{xenditPaymentData.paymentCode}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(xenditPaymentData.paymentCode!, 'Kode Pembayaran')}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Salin
                </Button>
              </div>
            </div>

            {/* Retail Instructions */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Cara Pembayaran di {xenditPaymentData.retailOutlet}:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Kunjungi gerai {xenditPaymentData.retailOutlet} terdekat</li>
                <li>Sampaikan kepada kasir untuk pembayaran SELSAS</li>
                <li>Berikan kode pembayaran: <strong>{xenditPaymentData.paymentCode}</strong></li>
                <li>Bayar sejumlah: <strong>Rp {xenditPaymentData.totalAmount.toLocaleString('id-ID')}</strong></li>
                <li>Simpan bukti pembayaran</li>
              </ol>
            </div>
          </div>
        )}

        {/* TUNAI DISPLAY */}
        {isTunai && (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <Banknote className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">Pembayaran Tunai</p>
                  <p className="text-sm text-muted-foreground">
                    Pembayaran tunai dilakukan langsung kepada vendor saat layanan diberikan
                  </p>
                </div>
              </div>
            </div>

            {/* Tunai Instructions */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Informasi Pembayaran Tunai:</h4>
              <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                <li>Pembayaran dilakukan langsung kepada vendor saat layanan diberikan</li>
                <li>Pastikan Anda telah menerima layanan sebelum melakukan pembayaran</li>
                <li>Minta tanda terima dari vendor sebagai bukti pembayaran</li>
                <li>Status pesanan akan berubah menjadi "Diproses" setelah pembayaran tunai dikonfirmasi</li>
              </ul>
            </div>
          </div>
        )}

        {/* AMOUNT DISPLAY */}
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">Total Pembayaran</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary">
              Rp {xenditPaymentData.totalAmount.toLocaleString('id-ID')}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(xenditPaymentData.totalAmount.toString(), 'Nominal')}
            >
              <Copy className="h-4 w-4 mr-2" />
              Salin
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Termasuk biaya transaksi: Rp {xenditPaymentData.transactionFee.toLocaleString('id-ID')}
          </p>
        </div>

        {/* EXPIRATION */}
        {xenditPaymentData.expirationDate && !isTunai && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2 text-yellow-800">
              <ClockIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Batas Waktu Pembayaran</p>
                <p className="text-sm">{formatExpiration(xenditPaymentData.expirationDate)}</p>
                {isQRIS && (
                  <p className="text-xs mt-1">
                    QR code akan berubah otomatis setiap 5 menit hingga waktu habis
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          {/* Simulate Payment Button */}
          {selectedXenditPayment !== 'tunai' && (
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={handleSimulatePayment}
              disabled={isActionLoading(`simulate_${selectedOrder?.id}`)}
            >
              {isActionLoading(`simulate_${selectedOrder?.id}`) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Memproses Pembayaran...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Simulasi Pembayaran Berhasil (Testing)
                </>
              )}
            </Button>
          )}

          <Button
            className="w-full text-white"
            style={{ backgroundColor: '#7CE0A8' }}
            onClick={handleCheckPaymentStatus}
            disabled={isActionLoading(`check_status_${selectedOrder?.id}`) || selectedXenditPayment === 'tunai'}
          >
            {isActionLoading(`check_status_${selectedOrder?.id}`) ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Memeriksa Status...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Cek Status Pembayaran
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setXenditPaymentMode('select')}
          >
            Ubah Metode Pembayaran
          </Button>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              Pembayaran akan diverifikasi secara otomatis setelah berhasil.
              Anda akan menerima notifikasi setelah pembayaran dikonfirmasi.
              {isQRIS && ' QR code akan otomatis diperbarui setiap 5 menit untuk keamanan.'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderXenditPaymentSelect = () => {
    // Calculate amount based on what we're paying for
    let amount = 0;
    let description = "";

    if (paymentForOrder === "additional" && selectedAdditionalService) {
      const subtotal = selectedAdditionalService.totalPrice || 0;
      amount = subtotal + SERVICE_FEE;
      description = `Pembayaran layanan tambahan: ${selectedAdditionalService.description}`;
    } else {
      amount = getBaseTotal(selectedOrder);
      description = `Pembayaran untuk layanan: ${selectedOrder.serviceType}`;
    }

    const transactionFee = selectedXenditPayment ? calculateTransactionFee(selectedXenditPayment, amount) : 0;
    const totalAmount = amount + transactionFee;

    return (
      <div className="space-y-6">
        {/* Payment Title */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold">
            {paymentForOrder === "additional" && selectedAdditionalService
              ? `Bayar Layanan Tambahan: ${selectedAdditionalService.description}`
              : `Bayar Pembayaran: ${selectedOrder?.serviceType}`}
          </h4>
          <p className="text-sm text-muted-foreground mt-1">
            Order ID: {selectedOrder?.id}
            {paymentForOrder === "additional" && selectedAdditionalService &&
              ` • Layanan: ${selectedAdditionalService.description}`}
          </p>
        </div>

        {/* Informasi khusus untuk tunai */}
        {selectedXenditPayment === 'tunai' && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2 text-yellow-800">
              <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">Pembayaran Tunai</p>
                <p className="text-sm">
                  Pembayaran akan langsung dikonfirmasi dan pesanan akan diproses.
                  Bayar tunai kepada vendor saat layanan diberikan.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Selected Payment Method */}
        {selectedXenditPayment ? (
          <div className="mb-6 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{XENDIT_PAYMENT_FEES[selectedXenditPayment]?.name || selectedXenditPayment}</p>
                <p className="text-sm text-muted-foreground">
                  Biaya Transaksi: {getCalculatedFeeDisplay(selectedXenditPayment, amount)}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowXenditPaymentOptions(true)}>Ubah</Button>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 border-2 border-dashed rounded-lg text-center">
            <p className="text-muted-foreground">Belum memilih metode pembayaran</p>
            <Button variant="outline" className="mt-2" onClick={() => setShowXenditPaymentOptions(true)}>
              Pilih Metode Pembayaran
            </Button>
          </div>
        )}

        {/* Amount Summary - FIXED */}
        <div className="p-4 border rounded-lg">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Subtotal:</span>
              <span>Rp {formatPrice(amount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Biaya Transaksi:</span>
              <div className="text-right">
                <span>Rp {formatPrice(transactionFee)}</span>
                {selectedXenditPayment && (
                  <span className="text-xs text-muted-foreground block">
                    ({getFeeDescription(selectedXenditPayment)})
                  </span>
                )}
              </div>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total Pembayaran</span>
              <span>Rp {formatPrice(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setShowXenditPaymentModal(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              className="flex-1 text-white"
              style={{ backgroundColor: '#7CE0A8' }}
              onClick={handleCreateXenditPayment}
              disabled={!selectedXenditPayment || isActionLoading(`xendit_payment_${selectedOrder?.id}`)}
            >
              {isActionLoading(`xendit_payment_${selectedOrder?.id}`) ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Memproses...</>
              ) : selectedXenditPayment === 'tunai' ? 'Konfirmasi Pembayaran Tunai' : 'Buat Pembayaran'}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-4">
            {selectedXenditPayment === 'tunai'
              ? 'Dengan mengklik "Konfirmasi Pembayaran Tunai", pesanan akan langsung diproses'
              : 'Dengan mengklik "Buat Pembayaran", Anda akan diarahkan ke instruksi pembayaran'}
          </p>
        </div>
      </div>
    );
  };

  if (isPageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderTwo />
      </div>
    );
  }

  return (
    <>
      <motion.main
        className="min-h-screen w-full max-w-7xl mx-auto px-4 py-6 md:px-6 lg:px-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {/* Breadcrumb */}
        <div className="mb-6 md:mb-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="text-sm md:text-base">
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-sm md:text-base">
                  Riwayat Pesanan
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Riwayat Pesanan
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
            Lacak dan kelola semua pesanan jasa Anda di satu tempat
          </p>
        </div>

        {/* Tabs Filter */}
        <div className="mb-6 md:mb-8">
          <Tabs defaultValue="semua" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full md:w-auto overflow-x-auto flex-nowrap md:flex-wrap">
              <TabsTrigger value="semua" className="flex-1 md:flex-none">
                Semua
              </TabsTrigger>
              <TabsTrigger value="aktif" className="flex-1 md:flex-none">
                Aktif
              </TabsTrigger>
              <TabsTrigger value="selesai" className="flex-1 md:flex-none">
                Selesai
              </TabsTrigger>
              <TabsTrigger value="dibatalkan" className="flex-1 md:flex-none">
                Dibatalkan
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Order List */}
        <div className="space-y-4 md:space-y-6">
          {filteredOrders.map((order) => {
            const baseTotal = getBaseTotal(order);
            const unpaidAdditionalTotal = getUnpaidAdditionalTotal(order);

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Order Card */}
                <Card
                  className={`overflow-hidden border hover:border-[#7CE0A8] transition-all duration-300 cursor-pointer ${expandedOrderId === order.id ? 'ring-2 ring-[#7CE0A8]' : ''
                    }`}
                  onClick={() => handleOrderClick(order)}
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Vendor Info */}
                      <div className="flex items-start gap-3 md:gap-4">
                        <Avatar className="h-12 w-12 md:h-16 md:w-16 border-2 border-[#7CE0A8]">
                          <AvatarImage src={order.vendorAvatar} alt={order.vendorName} />
                          <AvatarFallback>
                            {getServiceIcon(order.serviceType)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base md:text-lg truncate">
                              {order.vendorName}
                            </h3>
                            <Badge className={`${order.statusColor} text-xs md:text-sm font-medium w-fit`}>
                              {getStatusText(order.status)}
                            </Badge>
                            {order.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                <span className="text-sm font-medium">{order.rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-1 text-sm md:text-base">
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <Package className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{order.serviceType}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <Calendar className="h-4 w-4 flex-shrink-0" />
                              <span>{order.serviceDate} • {order.serviceTime}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <FileText className="h-4 w-4 flex-shrink-0" />
                              <span>Order ID: {order.id}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Price & Actions */}
                      <div className="flex flex-col items-end gap-3 md:gap-4">
                        <div className="flex items-center gap-2">
                          <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${expandedOrderId === order.id ? 'rotate-90' : ''
                            }`} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedOrderId === order.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <Card className="mt-2 border-t-0 rounded-t-none border-x border-b">
                        <CardContent className="p-0">
                          <Tabs defaultValue="detail" className="w-full">
                            <div className="border-b">
                              <TabsList className="w-full justify-start overflow-x-auto flex-nowrap px-4 md:px-6">
                                <TabsTrigger value="detail" className="flex-1 md:flex-none">
                                  Detail Pesanan
                                </TabsTrigger>
                                <TabsTrigger value="payment" className="flex-1 md:flex-none">
                                  Pembayaran
                                </TabsTrigger>
                                <TabsTrigger value="customer" className="flex-1 md:flex-none">
                                  Pelanggan
                                </TabsTrigger>
                                <TabsTrigger value="service" className="flex-1 md:flex-none">
                                  Layanan
                                </TabsTrigger>
                              </TabsList>
                            </div>

                            {/* Tab Content */}
                            <div className="p-4 md:p-6">
                              {/* Detail Pesanan */}
                              <TabsContent value="detail" className="space-y-6 m-0">
                                {/* Riwayat Pesanan */}
                                <div>
                                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Riwayat Pesanan
                                  </h3>
                                  <div className="space-y-3">
                                    {order.orderHistory.map((history: any, index: number) => (
                                      <div key={index} className="flex items-start gap-3">
                                        <div className="flex flex-col items-center">
                                          <div className={`h-3 w-3 rounded-full ${index === 0 ? 'bg-[#7CE0A8]' : 'bg-gray-300'
                                            }`} />
                                          {index < order.orderHistory.length - 1 && (
                                            <div className="h-8 w-0.5 bg-gray-300" />
                                          )}
                                        </div>
                                        <div className="flex-1">
                                          <p className="font-medium text-gray-900 dark:text-gray-100">
                                            {history.status}
                                          </p>
                                          <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {history.date}
                                          </p>
                                          {history.reason && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                              Alasan: {history.reason}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Rating dan Ulasan */}
                                {order.rating && (
                                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                    <div className="flex items-start gap-2">
                                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 flex-shrink-0 mt-0.5" />
                                      <div>
                                        <div className="flex items-center gap-2 mb-1">
                                          <p className="font-medium text-green-800 dark:text-green-300">
                                            Rating dan Ulasan Anda
                                          </p>
                                          <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                              <Star
                                                key={i}
                                                className={`h-4 w-4 ${i < order.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                                              />
                                            ))}
                                            <span className="text-sm font-medium ml-1">{order.rating.toFixed(1)}</span>
                                          </div>
                                        </div>
                                        {order.review && (
                                          <p className="text-green-700 dark:text-green-400 text-sm">
                                            "{order.review}"
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </TabsContent>

                              {/* Detail Pembayaran - FIXED */}
                              <TabsContent value="payment" className="space-y-6 m-0">
                                <div>
                                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Detail Pembayaran
                                  </h3>

                                  {/* FIX: Tampilkan pembayaran utama saja, sesuai dengan gambar */}
                                  <div className="mb-8">
                                    <div className="flex items-center justify-between mb-3">
                                      <h4 className="font-medium flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        {order.serviceType}
                                      </h4>
                                      {order.status === "menunggu pembayaran" && baseTotal > 0 ? (
                                        <Badge className="bg-yellow-100 text-yellow-800">
                                          Belum Dibayar
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-green-100 text-green-800">
                                          Lunas
                                        </Badge>
                                      )}
                                    </div>

                                    <Card className="border-green-200">
                                      <CardContent className="p-4">
                                        <div className="space-y-3">
                                          <div className="flex justify-between items-center">
                                            <span className="text-gray-600 dark:text-gray-400">Subtotal Layanan:</span>
                                            <span className="font-medium">Rp {formatPrice(order.paymentDetails?.subtotal || 0)}</span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-gray-600 dark:text-gray-400">Biaya Layanan:</span>
                                            <span className="font-medium">Rp {formatPrice(order.paymentDetails?.serviceFee || 0)}</span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-gray-600 dark:text-gray-400">Biaya Transaksi:</span>
                                            <span className="font-medium">Rp {formatPrice(order.paymentDetails?.transactionFee || 0)}</span>
                                          </div>
                                          <Separator />
                                          <div className="flex justify-between items-center">
                                            <span className="font-semibold">Total {order.serviceType}:</span>
                                            <span className="font-bold text-green-600">Rp {formatPrice(baseTotal)}</span>
                                          </div>
                                        </div>

                                        {order.status === "menunggu pembayaran" && baseTotal > 0 && (
                                          <div className="mt-4">
                                            <div className="flex flex-col sm:flex-row gap-2">
                                              <Button
                                                variant="outline"
                                                className="flex-1"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleOpenXenditPaymentModal(order);
                                                }}
                                                disabled={isActionLoading(`xendit_payment_${order.id}`)}
                                              >
                                                <CreditCard className="h-4 w-4 mr-2" />
                                                Bayar Sekarang
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  </div>

                                  {/* Layanan Tambahan - Hanya tampilkan sebagai informasi terpisah */}
                                  {(() => {
                                    const approvedAdditionalServices = getApprovedAdditionalServices(order);
                                    const unpaidServices = approvedAdditionalServices.filter((add: any) => !add.isPaid);
                                    const paidServices = approvedAdditionalServices.filter((add: any) => add.isPaid);

                                    if (approvedAdditionalServices.length === 0) {
                                      return null;
                                    }

                                    return (
                                      <div>
                                        <div className="flex items-center justify-between mb-3">
                                          <h4 className="font-medium flex items-center gap-2">
                                            <Package className="h-4 w-4 text-blue-600" />
                                            Layanan Tambahan
                                          </h4>
                                          <Badge variant="outline">
                                            {approvedAdditionalServices.length} layanan
                                          </Badge>
                                        </div>

                                        {/* Informasi Layanan Tambahan */}
                                        <div className="space-y-4">
                                          {approvedAdditionalServices.map((addService: any, idx: number) => {
                                            const totalPrice = addService.totalPrice || 0;
                                            const serviceFee = addService.serviceFee || 10000;
                                            const transactionFee = addService.transactionFee || 0;
                                            const total = totalPrice + serviceFee + transactionFee;

                                            return (
                                              <Card key={idx} className={addService.isPaid ? "border-green-100" : "border-yellow-200"}>
                                                <CardContent className="p-3">
                                                  <div className="flex justify-between items-center mb-2">
                                                    <div>
                                                      <p className="font-medium">{addService.description}</p>
                                                      <p className="text-xs text-gray-500">
                                                        {addService.isPaid
                                                          ? `Dibayar: ${addService.paidAt ? new Date(addService.paidAt).toLocaleDateString('id-ID') : '-'}`
                                                          : `Diajukan: ${new Date(addService.submittedAt).toLocaleDateString('id-ID')}`
                                                        }
                                                      </p>
                                                    </div>
                                                    <Badge className={addService.isPaid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                                                      {addService.isPaid ? "Lunas" : "Belum Bayar"}
                                                    </Badge>
                                                  </div>
                                                  <div className="text-right">
                                                    <p className={`font-bold ${addService.isPaid ? "text-green-600" : "text-yellow-600"}`}>
                                                      Rp {formatPrice(total)}
                                                    </p>
                                                  </div>

                                                  {/* Tombol bayar untuk yang belum dibayar */}
                                                  {!addService.isPaid && (
                                                    <div className="mt-3">
                                                      <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleOpenXenditPaymentModal(order, true, addService);
                                                        }}
                                                        disabled={isActionLoading(`xendit_payment_additional_${addService.id}`)}
                                                      >
                                                        <CreditCard className="h-4 w-4 mr-2" />
                                                        Bayar Layanan Ini
                                                      </Button>
                                                    </div>
                                                  )}
                                                </CardContent>
                                              </Card>
                                            );
                                          })}
                                        </div>

                                        {/* Summary */}
                                        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                          <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold">Ringkasan Layanan Tambahan:</span>
                                            <span className="font-bold text-blue-600">
                                              {approvedAdditionalServices.length} layanan
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center text-sm">
                                            <span>Sudah dibayar:</span>
                                            <span className="text-green-600">{paidServices.length} layanan</span>
                                          </div>
                                          <div className="flex justify-between items-center text-sm">
                                            <span>Belum dibayar:</span>
                                            <span className="text-yellow-600">{unpaidServices.length} layanan</span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </TabsContent>

                              {/* Informasi Pelanggan */}
                              <TabsContent value="customer" className="space-y-6 m-0">
                                <div>
                                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Informasi Pelanggan
                                  </h3>
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                      <User className="h-5 w-5 text-gray-500" />
                                      <div>
                                        <p className="font-medium">{order.customerInfo.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Nama Pelanggan</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                      <Mail className="h-5 w-5 text-gray-500" />
                                      <div>
                                        <p className="font-medium">{order.customerInfo.email}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                      <Phone className="h-5 w-5 text-gray-500" />
                                      <div>
                                        <p className="font-medium">{order.customerInfo.phone}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Telepon</p>
                                      </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                      <MapPin className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                                      <div>
                                        <p className="font-medium">Alamat</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                          {order.customerInfo.address}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </TabsContent>

                              {/* Detail Layanan */}
                              <TabsContent value="service" className="space-y-6 m-0">
                                <div>
                                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Wrench className="h-5 w-5" />
                                    Detail Layanan
                                  </h3>
                                  <div className="space-y-4">
                                    {/* Layanan */}
                                    <div>
                                      <h4 className="font-medium mb-2">Layanan yang Dipilih</h4>
                                      <div className="space-y-2">
                                        {order.serviceDetails.services.map((service: string, idx: number) => (
                                          <div key={idx} className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-[#7CE0A8]" />
                                            <span>{service}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Info Tambahan */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {order.serviceDetails.propertyType && (
                                        <div>
                                          <h4 className="font-medium mb-2">Jenis Properti</h4>
                                          <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                            <Home className="h-4 w-4" />
                                            <span>{order.serviceDetails.propertyType}</span>
                                          </div>
                                        </div>
                                      )}
                                      <div>
                                        <h4 className="font-medium mb-2">Jadwal</h4>
                                        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                          <Calendar className="h-4 w-4" />
                                          <span>{order.serviceDetails.date || "Tanggal belum ditentukan"} • {order.serviceDetails.time || "Waktu belum ditentukan"}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Layanan Tambahan */}
                                    {order.additionalServices && order.additionalServices.length > 0 && (
                                      <div className="mt-6 pt-4 border-t">
                                        <h4 className="font-medium mb-3 text-[#7CE0A8]">Layanan Tambahan</h4>
                                        <div className="space-y-3">
                                          {order.additionalServices.map((addService: any, idx: number) => {
                                            let statusText = "";
                                            let statusClass = "";
                                            let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "outline";

                                            if (addService.status === "disetujui" || addService.status === "approved" || addService.status === "diterima") {
                                              statusText = addService.isPaid ? "Disetujui & Lunas" : "Disetujui";
                                              statusClass = addService.isPaid ? "bg-green-100 text-green-800 border-green-300" : "bg-yellow-100 text-yellow-800 border-yellow-300";
                                              badgeVariant = addService.isPaid ? "default" : "outline";
                                            } else if (addService.status === "ditolak" || addService.status === "rejected") {
                                              statusText = "Ditolak";
                                              statusClass = "bg-red-100 text-red-800 border-red-300";
                                              badgeVariant = "destructive";
                                            } else {
                                              statusText = "Menunggu Persetujuan";
                                              statusClass = "bg-gray-100 text-gray-800 border-gray-300";
                                              badgeVariant = "outline";
                                            }

                                            return (
                                              <Card key={idx} className="border-[#7CE0A8]/30">
                                                <CardContent className="p-4">
                                                  <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                      <p className="font-medium">{addService.description}</p>
                                                      <p className="text-sm text-gray-500">
                                                        Diajukan: {new Date(addService.submittedAt).toLocaleDateString('id-ID')}
                                                        {addService.approvedAt && (
                                                          <>
                                                            <br />
                                                            Disetujui: {new Date(addService.approvedAt).toLocaleDateString('id-ID')}
                                                          </>
                                                        )}
                                                        {addService.paidAt && (
                                                          <>
                                                            <br />
                                                            Dibayar: {new Date(addService.paidAt).toLocaleDateString('id-ID')}
                                                          </>
                                                        )}
                                                      </p>
                                                    </div>
                                                    <Badge variant={badgeVariant} className={statusClass}>
                                                      {statusText}
                                                    </Badge>
                                                  </div>
                                                  <div className="space-y-2">
                                                    {addService.services && addService.services.map((service: any, sIdx: number) => (
                                                      <div key={sIdx} className="flex justify-between items-center text-sm">
                                                        <span>{service.name} ({service.quantity}x)</span>
                                                        <span className="font-medium">Rp {formatPrice(service.price * service.quantity)}</span>
                                                      </div>
                                                    ))}
                                                  </div>
                                                  {addService.reason && (
                                                    <p className="text-sm text-gray-600 mt-2">Alasan: {addService.reason}</p>
                                                  )}

                                                  {/* Bukti Foto */}
                                                  {addService.images && addService.images.length > 0 && (
                                                    <div className="mt-3">
                                                      <p className="text-sm font-medium mb-2">Bukti Foto:</p>
                                                      <div className="grid grid-cols-3 gap-2">
                                                        {addService.images.map((image: string, imgIdx: number) => (
                                                          <div key={imgIdx} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                                            <img
                                                              src={image}
                                                              alt={`Bukti ${imgIdx + 1}`}
                                                              className="w-full h-full object-cover"
                                                            />
                                                          </div>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  )}

                                                  {/* Total Harga */}
                                                  <div className="flex justify-between items-center mt-3 pt-3 border-t">
                                                    <p className="text-sm font-medium">Total:</p>
                                                    <p className="text-lg font-bold text-[#7CE0A8]">
                                                      Rp {formatPrice(addService.totalPrice || 0)}
                                                    </p>
                                                  </div>

                                                  {/* Payment button for approved additional service */}
                                                  {addService.status === "disetujui" && !addService.isPaid && (
                                                    <div className="mt-3 pt-3 border-t">
                                                      <div className="flex flex-col sm:flex-row gap-2 mt-3">
                                                        <Button
                                                          variant="outline"
                                                          className="flex-1"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenXenditPaymentModal(order, true, addService);
                                                          }}
                                                          disabled={isActionLoading(`xendit_payment_additional_${addService.id}`)}
                                                        >
                                                          <CreditCard className="h-4 w-4 mr-2" />
                                                          Bayar Sekarang
                                                        </Button>
                                                      </div>
                                                    </div>
                                                  )}
                                                </CardContent>
                                              </Card>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Tombol Tambah Layanan */}
                                <div className="pt-6 border-t">
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div>
                                      <h4 className="font-semibold text-lg">Butuh layanan tambahan?</h4>
                                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                                        Tambahkan layanan baru untuk pesanan ini jika ada kebutuhan tambahan
                                      </p>
                                    </div>
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddServiceClick();
                                      }}
                                      className="bg-[#7CE0A8] hover:bg-[#6bd097] text-white"
                                      disabled={order.status === "dibatalkan" || order.status === "selesai" || isActionLoading(`add_service_${order.id}`)}
                                    >
                                      {isActionLoading(`add_service_${order.id}`) ? (
                                        <>
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          Memuat...
                                        </>
                                      ) : (
                                        <>
                                          <Plus className="h-4 w-4 mr-2" />
                                          Tambah Layanan
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </TabsContent>
                            </div>
                          </Tabs>

                          {/* Action Buttons */}
                          <div className="border-t p-4 md:p-6 bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex flex-wrap gap-3">
                              {/* TOMBOL CHAT VENDOR */}
                              <Button
                                variant="outline"
                                className="flex-1 min-w-[140px]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (order?.vendorId) {
                                    handleChatVendor(order.vendorId);
                                  } else {
                                    toast.error("Vendor ID tidak ditemukan");
                                  }
                                }}
                                disabled={isActionLoading(`chat_${order.id}`)}
                              >
                                {isActionLoading(`chat_${order.id}`) ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Memuat...
                                  </>
                                ) : (
                                  <>
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Chat Vendor
                                  </>
                                )}
                              </Button>

                              {/* Tombol Konfirmasi Pekerjaan Selesai */}
                              {order.status === "diproses" && (
                                <Button
                                  className="flex-1 min-w-[140px] bg-green-600 hover:bg-green-700 text-white"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenCompletionModal(order);
                                  }}
                                  disabled={order.status === "menunggu pembayaran" || hasUnpaidAdditionalServices(order) || isActionLoading(`complete_${order.id}`)}
                                >
                                  {isActionLoading(`complete_${order.id}`) ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Memuat...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Konfirmasi Selesai
                                    </>
                                  )}
                                </Button>
                              )}

                              {/* Tombol Batalkan Pesanan */}
                              {order.status === "menunggu pembayaran" && (
                                <Button
                                  variant="outline"
                                  className="flex-1 min-w-[140px] text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenCancelModal(order);
                                  }}
                                  disabled={isActionLoading(`cancel_${order.id}`)}
                                >
                                  {isActionLoading(`cancel_${order.id}`) ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Memuat...
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Batalkan Pesanan
                                    </>
                                  )}
                                </Button>
                              )}

                              {/* Informasi jika status sudah selesai */}
                              {order.status === "selesai" && (
                                <div className="flex-1 min-w-[140px] p-3 border rounded-lg text-center bg-green-50 dark:bg-green-900/20">
                                  <p className="text-sm text-green-700 dark:text-green-300">
                                    ✓ Pekerjaan telah selesai
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Informasi jika ada layanan tambahan belum dibayar */}
                            {order.status === "diproses" && hasUnpaidAdditionalServices(order) && (
                              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                <p className="text-sm text-yellow-800 dark:text-yellow-300 flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4" />
                                  Harap lunasi semua layanan tambahan sebelum konfirmasi selesai
                                </p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredOrders.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Belum ada pesanan
              </h3>
              <p className="text-gray-500 mb-6">
                Mulai pesan layanan jasa dan semua riwayat akan muncul di sini
              </p>
              <Button
                onClick={() => window.location.href = '/jasa'}
                className="bg-[#7CE0A8] hover:bg-[#6bd097] text-white"
              >
                Cari Layanan
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.main>

      {/* ==========================================
          MODAL PEMBAYARAN XENDIT
          ========================================== */}
      <AnimatePresence>
        {showXenditPaymentModal && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => {
              setShowXenditPaymentModal(false);
              setXenditPaymentMode('select');
              setXenditPaymentData(null);
              setSelectedXenditPayment("");
              setQrRefreshTime(300);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b px-6 py-4 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {xenditPaymentMode === 'select' ? 'Pembayaran dengan Xendit' : 'Instruksi Pembayaran'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {paymentForOrder === "additional" && selectedAdditionalService
                        ? `Layanan: ${selectedAdditionalService.description}`
                        : `Pesanan #${selectedOrder.id} • ${selectedOrder.vendorName}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowXenditPaymentModal(false);
                      setXenditPaymentMode('select');
                      setXenditPaymentData(null);
                      setSelectedXenditPayment("");
                      setQrRefreshTime(300);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
                {xenditPaymentMode === 'select' ? (
                  renderXenditPaymentSelect()
                ) : (
                  renderXenditPaymentInstruction()
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Pilihan Metode Pembayaran Xendit */}
      <AnimatePresence>
        {showXenditPaymentOptions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowXenditPaymentOptions(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Pilih Metode Pembayaran</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowXenditPaymentOptions(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[60vh] p-6">
                <RadioGroup
                  value={selectedXenditPayment}
                  onValueChange={setSelectedXenditPayment}
                  className="space-y-4"
                >
                  {Object.entries(xenditPaymentCategories).map(([categoryKey, category]) => (
                    <div key={categoryKey} className="border rounded-lg overflow-hidden">
                      <button
                        type="button"
                        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => toggleXenditSection(categoryKey)}
                      >
                        <div className="flex items-center gap-3">
                          <category.icon className="h-5 w-5" />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        {expandedXenditSections[categoryKey] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>

                      <AnimatePresence>
                        {expandedXenditSections[categoryKey] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 space-y-2">
                              {category.methods.map((methodId) => {
                                const method = XENDIT_PAYMENT_FEES[methodId];
                                if (!method) return null;

                                return (
                                  <label
                                    key={methodId}
                                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${selectedXenditPayment === methodId ? 'border-[#7CE0A8] bg-[#7CE0A8]/5' : 'hover:border-[#7CE0A8]'
                                      }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <RadioGroupItem value={methodId} id={methodId} />
                                      <div className="flex items-center gap-2">
                                        <div
                                          className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                                          style={{ backgroundColor: method.color }}
                                        >
                                          {method.icon === 'wallet' && <Wallet className="h-4 w-4" />}
                                          {method.icon === 'building' && <BuildingIcon className="h-4 w-4" />}
                                          {method.icon === 'qrcode' && <QrCode className="h-4 w-4" />}
                                          {method.icon === 'credit-card' && <CreditCardIcon className="h-4 w-4" />}
                                          {method.icon === 'store' && <Store className="h-4 w-4" />}
                                          {method.icon === 'banknote' && <Banknote className="h-4 w-4" />}
                                        </div>
                                        <span className="font-medium">{method.name}</span>
                                      </div>
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                      {getFeeDescription(methodId)}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </RadioGroup>

                <div className="mt-6 pt-4 border-t">
                  <Button
                    type="button"
                    className="w-full text-white"
                    style={{ backgroundColor: '#7CE0A8' }}
                    onClick={() => setShowXenditPaymentOptions(false)}
                  >
                    Simpan Metode Pembayaran
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Tambah Layanan */}
      <AnimatePresence>
        {isAddServiceModalOpen && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setIsAddServiceModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b px-6 py-4 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Tambah Layanan Baru</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Pesanan #{selectedOrder.id} • {selectedOrder.vendorName}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddServiceModalOpen(false)}
                    className="h-8 w-8 p-0"
                    disabled={isActionLoading(`add_service_${selectedOrder.id}`)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
                <div className="space-y-6">
                  {/* Pilih Layanan dari Vendor */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Pilih Layanan Tambahan *
                    </Label>
                    <p className="text-sm text-gray-500 mb-3">
                      Pilih layanan tambahan yang Anda butuhkan dari vendor ini
                    </p>

                    {vendorServices.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <Package className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                        <p className="text-gray-500">Tidak ada layanan tersedia dari vendor ini</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {vendorServices.map((service: any) => (
                          <div key={service.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 flex-1">
                                <Checkbox
                                  id={`service-${service.id}`}
                                  checked={newServiceData.selectedServices.includes(service.id)}
                                  onCheckedChange={(checked) =>
                                    handleServiceSelection(service.id, checked as boolean)
                                  }
                                  className="mt-1"
                                  disabled={isActionLoading(`add_service_${selectedOrder.id}`)}
                                />
                                <div className="flex-1">
                                  <Label
                                    htmlFor={`service-${service.id}`}
                                    className="font-medium cursor-pointer"
                                  >
                                    {service.name}
                                  </Label>
                                  <p className="text-sm text-gray-500 mt-1">
                                    {service.description}
                                  </p>
                                  {service.estimatedTime && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      ⏱️ Estimasi: {service.estimatedTime}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="font-semibold text-[#7CE0A8]">
                                  Rp {service.price.toLocaleString('id-ID')}
                                  {service.priceType === 'HOURLY' && '/jam'}
                                  {service.priceType === 'UNIT' && '/unit'}
                                </div>

                                {newServiceData.selectedServices.includes(service.id) && (
                                  <div className="mt-2">
                                    <Label htmlFor={`qty-${service.id}`} className="text-xs">Jumlah:</Label>
                                    <Input
                                      id={`qty-${service.id}`}
                                      type="number"
                                      min="1"
                                      value={newServiceData.quantities[service.id] || 1}
                                      onChange={(e) => {
                                        const qty = parseInt(e.target.value) || 1;
                                        handleQuantityChange(service.id, qty);
                                      }}
                                      className="w-20 mt-1"
                                      disabled={isActionLoading(`add_service_${selectedOrder.id}`)}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {newServiceData.selectedServices.length > 0 && (
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="font-medium mb-2">Layanan yang Dipilih:</h4>
                        <div className="space-y-2">
                          {newServiceData.selectedServices.map(serviceId => {
                            const service = vendorServices.find((s: any) => s.id === serviceId);
                            if (!service) return null;
                            const quantity = newServiceData.quantities[serviceId] || 1;
                            const total = service.price * quantity;
                            return (
                              <div key={serviceId} className="flex justify-between items-center text-sm">
                                <span>{service.name} ({quantity}x)</span>
                                <span className="font-medium">Rp {formatPrice(total)}</span>
                              </div>
                            );
                          })}
                          <Separator />
                          <div className="flex justify-between items-center font-semibold">
                            <span>Total</span>
                            <span className="text-[#7CE0A8]">Rp {formatPrice(calculateNewServiceTotal())}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Alasan - WAJIB */}
                  <div>
                    <Label htmlFor="serviceReason" className="text-sm font-medium mb-2 block">
                      Alasan Permintaan Layanan Tambahan *
                    </Label>
                    <Textarea
                      id="serviceReason"
                      placeholder="Mengapa Anda membutuhkan layanan tambahan ini?"
                      rows={3}
                      value={newServiceData.reason}
                      onChange={(e) => setNewServiceData(prev => ({
                        ...prev,
                        reason: e.target.value
                      }))}
                      className="resize-none"
                      required
                      disabled={isActionLoading(`add_service_${selectedOrder.id}`)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Jelaskan alasan mengapa Anda memerlukan layanan tambahan ini
                    </p>
                  </div>

                  {/* Upload Foto - WAJIB */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Bukti Foto *
                      <span className="text-red-500 ml-1">(Wajib)</span>
                    </Label>
                    <p className="text-sm text-gray-500 mb-3">
                      Upload foto untuk mendukung permintaan layanan tambahan (minimal 1 foto, maksimal 5 foto)
                    </p>

                    {/* Preview Images */}
                    {newServiceData.previews.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                        {newServiceData.previews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              disabled={isActionLoading(`add_service_${selectedOrder.id}`)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                            <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                              Foto {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload Button */}
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:border-[#7CE0A8] transition-colors bg-gray-50 dark:bg-gray-800">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Camera className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-medium text-[#7CE0A8]">Klik untuk upload</span>
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          PNG, JPG, maksimum 5MB
                        </p>
                        <p className="text-xs text-red-500 mt-1">
                          * Minimal 1 foto wajib diunggah
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        required
                        disabled={isActionLoading(`add_service_${selectedOrder.id}`)}
                      />
                    </label>

                    {/* Informasi jumlah foto */}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {newServiceData.images.length} foto terunggah (maks: 5)
                      </span>
                      {newServiceData.images.length === 0 && (
                        <span className="text-xs text-red-500">
                          Wajib mengunggah minimal 1 foto
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Informasi */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-800 dark:text-blue-300 mb-1">
                          Informasi Penting
                        </p>
                        <ul className="space-y-1 text-blue-700 dark:text-blue-400">
                          <li>• Permintaan layanan tambahan akan dikirim ke admin untuk konfirmasi</li>
                          <li>• Admin akan meninjau permintaan dan bukti foto yang Anda unggah</li>
                          <li>• Jika disetujui, layanan akan ditambahkan ke pesanan dan biaya akan diperbarui</li>
                          <li>• Anda akan menerima notifikasi via aplikasi</li>
                          <li>• Bukti foto wajib diunggah minimal 1 foto</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t px-6 py-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsAddServiceModalOpen(false)}
                    disabled={isActionLoading(`add_service_${selectedOrder.id}`)}
                  >
                    Batal
                  </Button>
                  <Button
                    className="flex-1 bg-[#7CE0A8] hover:bg-[#6bd097] text-white"
                    onClick={handleSubmitNewService}
                    disabled={
                      newServiceData.selectedServices.length === 0 ||
                      !newServiceData.reason.trim() ||
                      newServiceData.images.length === 0 ||
                      isActionLoading(`add_service_${selectedOrder.id}`)
                    }
                  >
                    {isActionLoading(`add_service_${selectedOrder.id}`) ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Kirim Permintaan ke Admin
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-center text-gray-500 mt-3">
                  Permintaan akan ditinjau oleh admin. Anda akan menerima notifikasi saat status berubah.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Konfirmasi Permintaan Dikirim */}
      <AnimatePresence>
        {showServiceRequestModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Permintaan Dikirim!
              </h3>
              <p className="text-gray-600 mb-4">
                Permintaan layanan tambahan Anda telah berhasil dikirim ke admin.
                Silakan tunggu konfirmasi dari admin.
              </p>
              <div className="space-y-3">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Info className="h-5 w-5 text-blue-600" />
                    <p className="font-medium text-blue-800">Proses Selanjutnya:</p>
                  </div>
                  <ul className="text-sm text-blue-700 text-left space-y-1">
                    <li>• Admin akan meninjau permintaan Anda</li>
                    <li>• Bukti foto akan diperiksa</li>
                    <li>• Anda akan menerima notifikasi saat ada update</li>
                    <li>• Jika disetujui, layanan akan ditambahkan ke pesanan</li>
                  </ul>
                </div>
                <Button
                  className="bg-[#7CE0A8] hover:bg-[#6bd097] text-white w-full"
                  onClick={() => setShowServiceRequestModal(false)}
                >
                  Tutup
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Konfirmasi Pekerjaan Selesai dan Rating */}
      <AnimatePresence>
        {showCompletionModal && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowCompletionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Konfirmasi Pekerjaan Selesai</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Pesanan #{selectedOrder.id} • {selectedOrder.vendorName}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCompletionModal(false)}
                    className="h-8 w-8 p-0"
                    disabled={isActionLoading(`complete_${selectedOrder.id}`)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content - Scrollable */}
              <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
                <div className="space-y-6">
                  {/* Konfirmasi Selesai */}
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-300 mb-1">
                          Apakah pekerjaan sudah selesai?
                        </p>
                        <p className="text-green-700 dark:text-green-400 text-sm">
                          Konfirmasi bahwa vendor telah menyelesaikan pekerjaan dengan baik
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Rating (Opsional) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">
                        Berikan Rating (Opsional)
                      </Label>
                      <span className="text-xs text-gray-500">
                        {ratingData.rating > 0 ? `${ratingData.rating}/5` : "Pilih bintang"}
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleStarClick(star)}
                          className="focus:outline-none transition-transform hover:scale-110"
                          disabled={isActionLoading(`complete_${selectedOrder.id}`)}
                        >
                          <Star
                            className={`h-10 w-10 ${star <= ratingData.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                          />
                        </button>
                      ))}
                    </div>

                    {/* OPSI ANONYMOUS */}
                    <AnimatePresence>
                      {ratingData.rating > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mb-4"
                        >
                          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <input
                              type="checkbox"
                              id="anonymous"
                              checked={ratingData.isAnonymous}
                              onChange={(e) => setRatingData(prev => ({
                                ...prev,
                                isAnonymous: e.target.checked
                              }))}
                              className="h-4 w-4 rounded border-gray-300 text-[#7CE0A8] focus:ring-[#7CE0A8]"
                              disabled={isActionLoading(`complete_${selectedOrder.id}`)}
                            />
                            <label htmlFor="anonymous" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                              Sembunyikan identitas saya (Anonymous)
                            </label>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 ml-1">
                            Nama Anda akan disembunyikan dari vendor
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-2">
                      <Label htmlFor="comment" className="text-sm font-medium">
                        Berikan Ulasan (Opsional)
                      </Label>
                      <Textarea
                        id="comment"
                        placeholder="Bagaimana pengalaman Anda dengan layanan ini?"
                        rows={3}
                        value={ratingData.comment}
                        onChange={(e) => setRatingData(prev => ({
                          ...prev,
                          comment: e.target.value
                        }))}
                        className="resize-none"
                        disabled={isActionLoading(`complete_${selectedOrder.id}`)}
                      />
                    </div>

                    {/* UPLOAD FOTO RATING */}
                    <div className="mt-4">
                      <Label className="text-sm font-medium mb-2 block">
                        Tambah Foto (Opsional)
                        <span className="text-gray-500 font-normal ml-1">Max 3 foto</span>
                      </Label>

                      {/* Preview Photos */}
                      {ratingData.photos.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {ratingData.photos.map((photo, index) => (
                            <div key={index} className="relative group">
                              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                <img
                                  src={photo}
                                  alt={`Foto ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeRatingPhoto(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                disabled={isActionLoading(`complete_${selectedOrder.id}`)}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Upload Button */}
                      {ratingData.photos.length < 3 && (
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:border-[#7CE0A8] transition-colors bg-gray-50 dark:bg-gray-800">
                          <div className="flex flex-col items-center justify-center pt-2 pb-2">
                            <Camera className="h-6 w-6 text-gray-400 mb-1" />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-medium text-[#7CE0A8]">Klik untuk upload</span>
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              PNG, JPG (max 5MB)
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={handleRatingPhotoUpload}
                            disabled={isActionLoading(`complete_${selectedOrder.id}`)}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-gray-500">
                    <p>Detail pesanan:</p>
                    <div className="mt-2 space-y-1">
                      <p><span className="font-medium">Layanan:</span> {selectedOrder.serviceType}</p>
                      <p><span className="font-medium">Vendor:</span> {selectedOrder.vendorName}</p>
                      <p><span className="font-medium">Tanggal:</span> {selectedOrder.serviceDate}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t px-6 py-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowCompletionModal(false)}
                    disabled={isActionLoading(`complete_${selectedOrder.id}`)}
                  >
                    Batal
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleConfirmCompletion}
                    disabled={isActionLoading(`complete_${selectedOrder.id}`)}
                  >
                    {isActionLoading(`complete_${selectedOrder.id}`) ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Mengonfirmasi...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Konfirmasi Selesai
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-center text-gray-500 mt-3">
                  Rating dan ulasan bersifat opsional. Anda dapat memberikan rating nanti.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Terima Kasih untuk Rating */}
      <AnimatePresence>
        {showThankYouModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Terima Kasih!
              </h3>
              <p className="text-gray-600 mb-4">
                Terima kasih telah memberikan rating dan ulasan.
                Ini akan membantu vendor meningkatkan kualitas layanan.
              </p>
              <div className="flex items-center justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-6 w-6 ${i < ratingData.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              {ratingData.comment && (
                <p className="text-gray-600 italic mb-4">
                  "{ratingData.comment}"
                </p>
              )}
              {ratingData.photos.length > 0 && (
                <div className="flex gap-2 justify-center mb-4 overflow-x-auto">
                  {ratingData.photos.slice(0, 3).map((photo, idx) => (
                    <img
                      key={idx}
                      src={photo}
                      alt={`Foto ${idx + 1}`}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ))}
                  {ratingData.photos.length > 3 && (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-sm text-gray-600">
                      +{ratingData.photos.length - 3}
                    </div>
                  )}
                </div>
              )}
              {ratingData.isAnonymous && (
                <p className="text-sm text-gray-500 mb-4">
                  ✓ Identitas Anda disembunyikan
                </p>
              )}
              <Button
                className="bg-[#7CE0A8] hover:bg-[#6bd097] text-white"
                onClick={() => setShowThankYouModal(false)}
              >
                Tutup
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Konfirmasi Pembatalan */}
      <AnimatePresence>
        {showCancelModal && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => {
              if (isActionLoading(`cancel_${selectedOrder.id}`)) {
                return;
              }
              setShowCancelModal(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Batalkan Pesanan</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Pesanan #{selectedOrder.id} • {selectedOrder.vendorName}
                    </p>
                  </div>
                  {!isActionLoading(`cancel_${selectedOrder.id}`) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCancelModal(false)}
                      className="h-8 w-8 p-0"
                      disabled={isActionLoading(`cancel_${selectedOrder.id}`)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="space-y-4">
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-red-800 dark:text-red-300 mb-1">
                          Perhatian!
                        </p>
                        <ul className="space-y-1 text-red-700 dark:text-red-400">
                          <li>• Pembatalan pesanan hanya dapat dilakukan untuk pesanan dengan status "Menunggu Pembayaran"</li>
                          <li>• Setelah dibatalkan, pesanan tidak dapat dikembalikan</li>
                          <li>• Vendor akan menerima notifikasi pembatalan</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cancelReason" className="text-sm font-medium mb-2 block">
                      Alasan Pembatalan *
                    </Label>
                    <Textarea
                      id="cancelReason"
                      placeholder="Mengapa Anda ingin membatalkan pesanan ini?"
                      rows={3}
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      disabled={isActionLoading(`cancel_${selectedOrder.id}`)}
                      className="resize-none"
                    />
                  </div>

                  <div className="text-sm text-gray-500">
                    <p>Detail pesanan yang akan dibatalkan:</p>
                    <div className="mt-2 space-y-1">
                      <p><span className="font-medium">Layanan:</span> {selectedOrder.serviceType}</p>
                      <p><span className="font-medium">Vendor:</span> {selectedOrder.vendorName}</p>
                      <p><span className="font-medium">Total:</span> Rp {formatPrice(selectedOrder.totalPrice)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t px-6 py-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  {!isActionLoading(`cancel_${selectedOrder.id}`) ? (
                    <>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowCancelModal(false)}
                        disabled={isActionLoading(`cancel_${selectedOrder.id}`)}
                      >
                        Batal
                      </Button>
                      <Button
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        onClick={handleCancelOrder}
                        disabled={!cancelReason.trim() || isActionLoading(`cancel_${selectedOrder.id}`)}
                      >
                        {isActionLoading(`cancel_${selectedOrder.id}`) ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Membatalkan...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Batalkan Pesanan
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center py-2">
                      <Loader2 className="h-5 w-5 animate-spin text-red-600 mr-2" />
                      <span className="text-red-600">Membatalkan pesanan...</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Sukses Pembayaran */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Pembayaran Berhasil!
              </h3>
              <p className="text-gray-600 mb-6">
                Anda berhasil melakukan pembayaran. Pesanan Anda sekarang dalam proses pengerjaan.
              </p>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7CE0A8]"></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
