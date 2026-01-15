// app/riwayat_pemesanan/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation"; // TAMBAHKAN IMPORT INI
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
  ChevronDown
} from "lucide-react";
import { LoaderTwo } from "@/app/components/transition/loader";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Separator } from "@/app/components/ui/separator";

const SERVICE_FEE = 10000;

const PAYMENT_FEES: Record<string, number> = {
  "dana": 1440,
  "ovo": 1440,
  "gopay": 1440,
  "bca-va": 3850,
  "bni-va": 3700,
  "bri-va": 3700,
  "mandiri-va": 3700,
  "bsi-va": 3850,
  "debit-credit": 2784,
  "qris": 1571,
  "tunai": 0
};

export default function OrderHistoryPage() {
  const router = useRouter(); // TAMBAHKAN INI
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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

  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [cardData, setCardData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: ""
  });
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    ewallet: true,
    va: false,
    card: false,
    qris: false,
    cash: false
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

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

  // Additional service payment modal
  const [showAdditionalPaymentModal, setShowAdditionalPaymentModal] = useState(false);
  const [selectedAdditionalService, setSelectedAdditionalService] = useState<any>(null);
  const [paymentForAdditional, setPaymentForAdditional] = useState<"main" | "additional">("main");

  // TAMBAHKAN FUNGSI INI UNTUK HANDLE CHAT VENDOR
  const handleChatVendor = (vendorId: string) => {
    if (!vendorId) {
      toast.error("Vendor ID tidak ditemukan");
      return;
    }
    router.push(`/chat/${vendorId}`);
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '').replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted.substring(0, 19);
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    return cleaned;
  };

  const paymentMethods = {
    ewallet: [
      { id: "dana", name: "DANA", icon: Wallet, fee: 1440, color: "#10B981" },
      { id: "ovo", name: "OVO", icon: Smartphone, fee: 1440, color: "#4F46E5" },
      { id: "gopay", name: "GoPay", icon: Smartphone, fee: 1440, color: "#00AA13" },
    ],
    va: [
      { id: "bca-va", name: "BCA Virtual Account", icon: BuildingIcon, fee: 3850, color: "#1E3A8A" },
      { id: "bni-va", name: "BNI Virtual Account", icon: BuildingIcon, fee: 3700, color: "#F59E0B" },
      { id: "bri-va", name: "BRI Virtual Account", icon: BuildingIcon, fee: 3700, color: "#DC2626" },
      { id: "mandiri-va", name: "Mandiri Virtual Account", icon: BuildingIcon, fee: 3700, color: "#059669" },
      { id: "bsi-va", name: "BSI Virtual Account", icon: BuildingIcon, fee: 3850, color: "#7C3AED" },
    ],
    card: [
      { id: "debit-credit", name: "Kartu Debit/Kredit", icon: CreditCardIcon, fee: 2784, color: "#3B82F6" },
    ],
    qris: [
      { id: "qris", name: "QRIS", icon: QrCode, fee: 1571, color: "#EF4444" },
    ],
    cash: [
      { id: "tunai", name: "Tunai", icon: Banknote, fee: 0, color: "#6B7280" },
    ]
  };

  const getPaymentMethodName = (id: string) => {
    for (const category of Object.values(paymentMethods)) {
      const method = category.find(m => m.id === id);
      if (method) return method.name;
    }
    return "";
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const loadOrders = useCallback(async () => {
    try {
      setIsLoading(true);
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
        // Pastikan setiap order memiliki struktur data pembayaran yang benar
        const processedOrders = data.orders.map((order: any) => ({
          ...order,
          // Pastikan ada paymentDetails
          paymentDetails: order.paymentDetails || {
            subtotal: order.totalPrice - SERVICE_FEE,
            serviceFee: SERVICE_FEE,
            transactionFee: 0,
            total: order.totalPrice
          }
        }));
        setOrders(processedOrders);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      toast.error("Gagal memuat data pesanan");
      setOrders([]);
    } finally {
      setIsLoading(false);
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

  const handleOrderClick = (order: any) => {
    if (expandedOrderId === order.id) {
      setExpandedOrderId(null);
      setSelectedOrder(null);
    } else {
      setExpandedOrderId(order.id);
      setSelectedOrder(order);
      if (order.paymentMethod && order.paymentMethod !== "Belum Dibayar") {
        setSelectedPayment(order.paymentMethod.toLowerCase());
      }
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
    }
  };

  const handleOpenPaymentModal = (order: any, forAdditional: boolean = false, additionalService?: any) => {
    setSelectedOrder(order);
    setPaymentForAdditional(forAdditional ? "additional" : "main");
    
    if (forAdditional && additionalService) {
      setSelectedAdditionalService(additionalService);
    }
    
    if (order.paymentMethod && order.paymentMethod !== "Belum Dibayar") {
      setSelectedPayment(order.paymentMethod.toLowerCase());
    } else {
      setSelectedPayment("");
    }
    setShowPaymentModal(true);
  };

  const handleSavePaymentMethod = async () => {
    if (!selectedPayment) {
      toast.error("Silakan pilih metode pembayaran terlebih dahulu.");
      return;
    }

    if (selectedPayment === "debit-credit") {
      if (!cardData.cardNumber || !cardData.expiryDate || !cardData.cvv) {
        toast.error("Silakan lengkapi data kartu debit/kredit.");
        return;
      }

      const cleanedCardNumber = cardData.cardNumber.replace(/\s/g, '');
      if (cleanedCardNumber.length < 12 || !/^\d+$/.test(cleanedCardNumber)) {
        toast.error("Nomor kartu tidak valid. Harus minimal 12 digit angka.");
        return;
      }

      if (!/^\d{2}\/\d{2}$/.test(cardData.expiryDate)) {
        toast.error("Format masa berlaku tidak valid. Gunakan format MM/YY (contoh: 01/24).");
        return;
      }

      if (!/^\d{3,4}$/.test(cardData.cvv)) {
        toast.error("CVV tidak valid. Harus 3 atau 4 digit angka.");
        return;
      }
    }

    try {
      const transactionFee = PAYMENT_FEES[selectedPayment as keyof typeof PAYMENT_FEES] || 0;

      if (paymentForAdditional === "additional" && selectedAdditionalService) {
        // Bayar layanan tambahan
        const response = await fetch('/api/user/orders/additional-service/payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            orderId: selectedOrder.id,
            additionalServiceId: selectedAdditionalService.id,
            paymentMethod: selectedPayment,
            transactionFee: transactionFee
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Payment failed');
        }

        // Update state untuk layanan tambahan
        setOrders(prevOrders => prevOrders.map(order => {
          if (order.id === selectedOrder.id) {
            const updatedAdditionalServices = order.additionalServices?.map((service: any) => 
              service.id === selectedAdditionalService.id 
                ? { 
                    ...service, 
                    isPaid: true, 
                    paidAt: new Date().toISOString(), 
                    paymentMethod: selectedPayment,
                    transactionFee: transactionFee
                  }
                : service
            ) || [];
            
            return {
              ...order,
              additionalServices: updatedAdditionalServices
            };
          }
          return order;
        }));

        toast.success("Pembayaran layanan tambahan berhasil!");
      } else {
        // Bayar pembayaran utama
        const response = await fetch('/api/user/orders', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            action: 'updatePayment',
            orderId: selectedOrder.id,
            paymentMethod: selectedPayment,
            transactionFee: transactionFee
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update payment method');
        }

        const subtotal = selectedOrder.paymentDetails.subtotal || (selectedOrder.totalPrice - SERVICE_FEE - transactionFee);
        const total = subtotal + SERVICE_FEE + transactionFee;

        setOrders(prevOrders => prevOrders.map(order => {
          if (order.id === selectedOrder.id) {
            return {
              ...order,
              paymentMethod: selectedPayment,
              paymentId: `#${Math.floor(1000000 + Math.random() * 9000000)}`,
              paymentDetails: {
                ...order.paymentDetails,
                subtotal: subtotal,
                transactionFee: transactionFee,
                total: total
              },
              totalPrice: total
            };
          }
          return order;
        }));

        toast.success("Metode pembayaran berhasil disimpan!");
      }

      setShowPaymentModal(false);
      setShowPaymentOptions(false);
      setSelectedAdditionalService(null);
      setPaymentForAdditional("main");

    } catch (error) {
      console.error("Error updating payment method:", error);
      toast.error("Gagal menyimpan metode pembayaran");
    }
  };

  const handlePayNow = async (order: any, forAdditional: boolean = false, additionalService?: any) => {
    if (forAdditional && additionalService) {
      handleOpenPaymentModal(order, true, additionalService);
      return;
    }

    if (!order.paymentMethod || order.paymentMethod === "Belum Dibayar") {
      toast.error("Silakan pilih metode pembayaran terlebih dahulu.");
      handleOpenPaymentModal(order);
      return;
    }

    setShowSuccessModal(true);

    try {
      const response = await fetch('/api/user/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'pay',
          orderId: order.id
        })
      });

      if (!response.ok) {
        throw new Error('Payment failed');
      }

      setOrders(prevOrders => prevOrders.map(o => {
        if (o.id === order.id) {
          return {
            ...o,
            status: "diproses",
            statusColor: "bg-blue-100 text-blue-800",
            orderHistory: [
              ...o.orderHistory,
              {
                status: "Pembayaran Diterima",
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
        }
        return o;
      }));

      setTimeout(() => {
        setShowSuccessModal(false);
        toast.success("Pembayaran berhasil! Status pesanan telah diperbarui.");
      }, 2000);

    } catch (error) {
      console.error("Error processing payment:", error);
      setShowSuccessModal(false);
      toast.error("Gagal memproses pembayaran");
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

    setIsCancelling(true);

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

    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Gagal membatalkan pesanan");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleOpenCompletionModal = (order: any) => {
    if (order.status !== "diproses") {
      toast.error("Hanya pesanan yang sedang diproses yang dapat dikonfirmasi selesai.");
      return;
    }

    // Check if there's unpaid additional service
    const hasUnpaidAdditionalService = order.additionalServices?.some(
      (addService: any) => addService.status === "disetujui" && !addService.isPaid
    );

    if (hasUnpaidAdditionalService) {
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

    } catch (error) {
      console.error("Error completing order:", error);
      toast.error("Gagal mengkonfirmasi pesanan selesai");
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

  const filteredOrders = orders.filter(order => {
    if (activeTab === "semua") return true;
    if (activeTab === "aktif") return order.status === "diproses" || order.status === "menunggu pembayaran";
    if (activeTab === "selesai") return order.status === "selesai";
    if (activeTab === "dibatalkan") return order.status === "dibatalkan";
    return true;
  });

  const getStatusText = (status: string) => {
    switch (status) {
      case "dibatalkan": return "Dibatalkan";
      case "diproses": return "Diproses";
      case "selesai": return "Selesai";
      case "menunggu pembayaran": return "Menunggu Pembayaran";
      default: return status;
    }
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID').format(price);
  };

  const calculateTotalWithFee = (order: any) => {
    if (!selectedPayment) {
      return order.paymentDetails?.total || order.totalPrice || 0;
    }
    const subtotal = order.paymentDetails?.subtotal || 0;
    const transactionFee = PAYMENT_FEES[selectedPayment as keyof typeof PAYMENT_FEES] || 0;
    return subtotal + SERVICE_FEE + transactionFee;
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

  // Fungsi untuk memeriksa apakah ada layanan tambahan yang belum dibayar
  const hasUnpaidAdditionalServices = (order: any) => {
    const approvedServices = order.additionalServices?.filter((addService: any) => 
      addService.status === "disetujui" || addService.status === "approved" || addService.status === "diterima"
    ) || [];
    
    return approvedServices.some((addService: any) => !addService.isPaid);
  };

  // Fungsi untuk menghitung total layanan tambahan yang belum dibayar
  const getUnpaidAdditionalServicesTotal = (order: any) => {
    let total = 0;
    const approvedServices = order.additionalServices?.filter((addService: any) => 
      addService.status === "disetujui" || addService.status === "approved" || addService.status === "diterima"
    ) || [];
    
    approvedServices.forEach((addService: any) => {
      if (!addService.isPaid) {
        const serviceFee = addService.serviceFee || 10000;
        const transactionFee = addService.transactionFee || 0;
        total += (addService.totalPrice || 0) + serviceFee + transactionFee;
      }
    });
    return total;
  };

  // Fungsi untuk menghitung total semua layanan tambahan (baik yang sudah dibayar maupun belum)
  const getAllAdditionalServicesTotal = (order: any) => {
    let total = 0;
    const approvedServices = order.additionalServices?.filter((addService: any) => 
      addService.status === "disetujui" || addService.status === "approved" || addService.status === "diterima"
    ) || [];
    
    approvedServices.forEach((addService: any) => {
      const serviceFee = addService.serviceFee || 10000;
      const transactionFee = addService.transactionFee || 0;
      total += (addService.totalPrice || 0) + serviceFee + transactionFee;
    });
    return total;
  };

  // Fungsi untuk mendapatkan semua layanan tambahan yang disetujui
  const getApprovedAdditionalServices = (order: any) => {
    return order.additionalServices?.filter((addService: any) => 
      addService.status === "disetujui" || addService.status === "approved" || addService.status === "diterima"
    ) || [];
  };

  if (isLoading) {
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
          {filteredOrders.map((order) => (
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
                      <div className="text-right">
                        <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                          Rp {formatPrice(order.totalPrice)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Total Pembayaran
                        </p>
                      </div>

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

                            {/* Detail Pembayaran - DIPERBAIKI */}
                            <TabsContent value="payment" className="space-y-6 m-0">
                              <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                  <CreditCard className="h-5 w-5" />
                                  Detail Pembayaran
                                </h3>

                                {/* Pembayaran Utama */}
                                <div className="mb-8">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium flex items-center gap-2">
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                      Pembayaran Utama
                                    </h4>
                                    {order.status === "menunggu pembayaran" ? (
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
                                          <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                                          <span className="font-medium">Rp {formatPrice(order.paymentDetails.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-gray-600 dark:text-gray-400">Biaya Layanan:</span>
                                          <span className="font-medium">Rp {formatPrice(order.paymentDetails.serviceFee)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-gray-600 dark:text-gray-400">Biaya Transaksi:</span>
                                          <span className="font-medium">Rp {formatPrice(order.paymentDetails.transactionFee)}</span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between items-center">
                                          <span className="font-semibold">Total:</span>
                                          <span className="font-bold text-green-600">Rp {formatPrice(order.paymentDetails.total)}</span>
                                        </div>
                                      </div>

                                      {order.status === "menunggu pembayaran" && (
                                        <div className="mt-4">
                                          <div className="flex flex-col sm:flex-row gap-2">
                                            <Button
                                              variant="outline"
                                              className="flex-1"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenPaymentModal(order);
                                              }}
                                            >
                                              <CreditCard className="h-4 w-4 mr-2" />
                                              Pilih Metode
                                            </Button>
                                            <Button
                                              className="flex-1 bg-[#7CE0A8] hover:bg-[#6bd097] text-white"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handlePayNow(order);
                                              }}
                                              disabled={!order.paymentMethod || order.paymentMethod === "Belum Dibayar"}
                                            >
                                              <CreditCard className="h-4 w-4 mr-2" />
                                              Bayar Sekarang
                                            </Button>
                                          </div>
                                          <p className="text-xs text-center text-gray-500 mt-2">
                                            Minimum transaksi Rp75.000
                                          </p>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                </div>

                                {/* Layanan Tambahan */}
                                {(() => {
                                  const approvedAdditionalServices = getApprovedAdditionalServices(order);
                                  const hasUnpaid = hasUnpaidAdditionalServices(order);
                                  const totalAdditional = getAllAdditionalServicesTotal(order);
                                  
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
                                        {hasUnpaid ? (
                                          <Badge className="bg-yellow-100 text-yellow-800">
                                            Transaksi Belum Tuntas
                                          </Badge>
                                        ) : (
                                          <Badge className="bg-green-100 text-green-800">
                                            Semua Lunas
                                          </Badge>
                                        )}
                                      </div>

                                      <div className="space-y-4">
                                        {approvedAdditionalServices.map((addService: any, idx: number) => {
                                          const isPaid = addService.isPaid;
                                          const totalPrice = addService.totalPrice || 0;
                                          const serviceFee = addService.serviceFee || 10000;
                                          const transactionFee = addService.transactionFee || 0;
                                          const total = totalPrice + serviceFee + transactionFee;

                                          return (
                                            <Card key={idx} className="border-blue-200">
                                              <CardContent className="p-4">
                                                <div className="flex justify-between items-center mb-3">
                                                  <div>
                                                    <p className="font-medium text-blue-800 dark:text-blue-300">{addService.description}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                      Ditambahkan: {new Date(addService.submittedAt).toLocaleDateString('id-ID')}
                                                    </p>
                                                  </div>
                                                  {isPaid ? (
                                                    <Badge className="bg-green-100 text-green-800">Lunas</Badge>
                                                  ) : (
                                                    <Badge className="bg-yellow-100 text-yellow-800">Belum Bayar</Badge>
                                                  )}
                                                </div>

                                                <div className="space-y-2">
                                                  <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-600 dark:text-gray-400">Subtotal Layanan:</span>
                                                    <span>Rp {formatPrice(totalPrice)}</span>
                                                  </div>
                                                  <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-600 dark:text-gray-400">Biaya Layanan:</span>
                                                    <span>Rp {formatPrice(serviceFee)}</span>
                                                  </div>
                                                  <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-600 dark:text-gray-400">Biaya Transaksi:</span>
                                                    <span>Rp {formatPrice(transactionFee)}</span>
                                                  </div>
                                                  <Separator className="my-2" />
                                                  <div className="flex justify-between items-center">
                                                    <span className="font-semibold">Total:</span>
                                                    <span className="font-bold text-blue-600">
                                                      Rp {formatPrice(total)}
                                                    </span>
                                                  </div>
                                                </div>

                                                {!isPaid && (
                                                  <div className="mt-4">
                                                    <div className="flex flex-col sm:flex-row gap-2">
                                                      <Button
                                                        variant="outline"
                                                        className="flex-1"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleOpenPaymentModal(order, true, addService);
                                                        }}
                                                      >
                                                        <CreditCard className="h-4 w-4 mr-2" />
                                                        Pilih Metode
                                                      </Button>
                                                      <Button
                                                        className="flex-1 bg-[#7CE0A8] hover:bg-[#6bd097] text-white"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handlePayNow(order, true, addService);
                                                        }}
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

                                        {/* Total Semua Layanan Tambahan */}
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                          <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold">Total Layanan Tambahan:</span>
                                            <span className="font-bold text-blue-600">
                                              Rp {formatPrice(totalAdditional)}
                                            </span>
                                          </div>
                                          <p className="text-xs text-gray-500">
                                            {hasUnpaid
                                              ? "Ada layanan tambahan yang belum dibayar"
                                              : "Semua layanan tambahan sudah dibayar"}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* Informasi Status Pembayaran */}
                                <div className="mt-6 pt-4 border-t">
                                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div>
                                      <h4 className="font-semibold text-lg">Status Pembayaran</h4>
                                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                                        {(() => {
                                          const approvedAdditionalServices = getApprovedAdditionalServices(order);
                                          const hasUnpaid = hasUnpaidAdditionalServices(order);
                                          const totalAdditional = getAllAdditionalServicesTotal(order);
                                          
                                          if (approvedAdditionalServices.length === 0) {
                                            return "Pembayaran utama sudah lunas";
                                          }
                                          
                                          if (hasUnpaid) {
                                            return "Harap lunasi semua pembayaran sebelum konfirmasi selesai";
                                          }
                                          
                                          return "Semua pembayaran sudah lunas";
                                        })()}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-2xl font-bold text-[#7CE0A8]">
                                        {(() => {
                                          const approvedAdditionalServices = getApprovedAdditionalServices(order);
                                          const hasUnpaid = hasUnpaidAdditionalServices(order);
                                          const unpaidTotal = getUnpaidAdditionalServicesTotal(order);
                                          const totalAdditional = getAllAdditionalServicesTotal(order);
                                          
                                          if (approvedAdditionalServices.length === 0) {
                                            return `Rp ${formatPrice(order.paymentDetails.total)}`;
                                          }
                                          
                                          if (hasUnpaid) {
                                            return `Rp ${formatPrice(order.paymentDetails.total + unpaidTotal)}`;
                                          }
                                          
                                          return `Rp ${formatPrice(order.paymentDetails.total)}`;
                                        })()}
                                      </p>
                                      <p className="text-sm text-gray-500">Total Keseluruhan</p>
                                    </div>
                                  </div>
                                </div>
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

                                  {/* Layanan Tambahan - DIPERBARUI STATUS */}
                                  {order.additionalServices && order.additionalServices.length > 0 && (
                                    <div className="mt-6 pt-4 border-t">
                                      <h4 className="font-medium mb-3 text-[#7CE0A8]">Layanan Tambahan</h4>
                                      <div className="space-y-3">
                                        {order.additionalServices.map((addService: any, idx: number) => {
                                          // Perbarui status untuk ditampilkan
                                          let statusText = "";
                                          let statusClass = "";
                                          let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "outline";

                                          if (addService.status === "disetujui" || addService.status === "approved" || addService.status === "diterima") {
                                            statusText = "Disetujui";
                                            statusClass = "bg-green-100 text-green-800 border-green-300";
                                            badgeVariant = "default";
                                          } else if (addService.status === "ditolak" || addService.status === "rejected") {
                                            statusText = "Ditolak";
                                            statusClass = "bg-red-100 text-red-800 border-red-300";
                                            badgeVariant = "destructive";
                                          } else {
                                            statusText = "Menunggu Persetujuan";
                                            statusClass = "bg-yellow-100 text-yellow-800 border-yellow-300";
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
                                                    Rp {formatPrice(addService.totalPrice || 400000)}
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
                                                          handleOpenPaymentModal(order, true, addService);
                                                        }}
                                                      >
                                                        <CreditCard className="h-4 w-4 mr-2" />
                                                        Pilih Metode
                                                      </Button>
                                                      <Button
                                                        className="flex-1 bg-[#7CE0A8] hover:bg-[#6bd097] text-white"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handlePayNow(order, true, addService);
                                                        }}
                                                      >
                                                        <CreditCard className="h-4 w-4 mr-2" />
                                                        Bayar Sekarang
                                                      </Button>
                                                    </div>
                                                  </div>
                                                )}

                                                {/* Tampilkan status pembayaran jika sudah dibayar */}
                                                {addService.isPaid && (
                                                  <div className="mt-3 pt-3 border-t">
                                                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                                      <p className="text-sm text-green-800 dark:text-green-300 flex items-center gap-2">
                                                        <CheckCircle className="h-4 w-4" />
                                                        Layanan tambahan sudah dibayar
                                                      </p>
                                                      <p className="text-xs text-gray-500 mt-1">
                                                        Dibayar pada: {addService.paidAt ? new Date(addService.paidAt).toLocaleDateString('id-ID') : '-'}
                                                      </p>
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
                                    disabled={order.status === "dibatalkan" || order.status === "selesai"}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Tambah Layanan
                                  </Button>
                                </div>
                              </div>
                            </TabsContent>
                          </div>
                        </Tabs>

                        {/* Action Buttons - DIPERBARUI KONDISI DISABLE */}
                        <div className="border-t p-4 md:p-6 bg-gray-50 dark:bg-gray-800/50">
                          <div className="flex flex-wrap gap-3">
                            {/* TOMBOL CHAT VENDOR - DIPERBARUI */}
                            <Button 
                              variant="outline" 
                              className="flex-1 min-w-[140px]"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (selectedOrder?.vendorId) {
                                  handleChatVendor(selectedOrder.vendorId);
                                } else {
                                  toast.error("Vendor ID tidak ditemukan");
                                }
                              }}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Chat Vendor
                            </Button>

                            {/* Tombol Konfirmasi Pekerjaan Selesai */}
                            {order.status === "diproses" && (
                              <Button
                                className="flex-1 min-w-[140px] bg-green-600 hover:bg-green-700 text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenCompletionModal(order);
                                }}
                                disabled={order.status === "menunggu pembayaran" || hasUnpaidAdditionalServices(order)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Konfirmasi Selesai
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
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Batalkan Pesanan
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
          ))}
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
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Ringkasan Layanan yang Dipilih */}
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
                  >
                    Batal
                  </Button>
                  <Button
                    className="flex-1 bg-[#7CE0A8] hover:bg-[#6bd097] text-white"
                    onClick={handleSubmitNewService}
                    disabled={
                      newServiceData.selectedServices.length === 0 ||
                      !newServiceData.reason.trim() ||
                      newServiceData.images.length === 0
                    }
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Kirim Permintaan ke Admin
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

      {/* Modal Metode Pembayaran (untuk semua jenis pembayaran) */}
      <AnimatePresence>
        {showPaymentModal && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => {
              setShowPaymentModal(false);
              setShowPaymentOptions(false);
              setSelectedAdditionalService(null);
              setPaymentForAdditional("main");
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
                      {paymentForAdditional === "additional" ? "Bayar Layanan Tambahan" : "Pilih Metode Pembayaran"}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {paymentForAdditional === "additional" 
                        ? `Layanan: ${selectedAdditionalService?.description}` 
                        : `Pesanan #${selectedOrder.id} • ${selectedOrder.vendorName}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setShowPaymentOptions(false);
                      setSelectedAdditionalService(null);
                      setPaymentForAdditional("main");
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
                <div className="space-y-6">
                  {/* Ringkasan Pembayaran */}
                  {paymentForAdditional === "additional" && selectedAdditionalService && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Ringkasan Layanan</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-400 mb-1">
                        {selectedAdditionalService.description}
                      </p>
                      <div className="space-y-1 mt-2">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>Rp {formatPrice(selectedAdditionalService.totalPrice || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Biaya Layanan:</span>
                          <span>Rp {formatPrice(selectedAdditionalService.serviceFee || 10000)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Biaya Transaksi:</span>
                          <span>Rp {formatPrice(selectedAdditionalService.transactionFee || 0)}</span>
                        </div>
                        <Separator className="my-1" />
                        <div className="flex justify-between font-bold">
                          <span>Total:</span>
                          <span className="text-blue-600">
                            Rp {formatPrice(
                              (selectedAdditionalService.totalPrice || 0) + 
                              (selectedAdditionalService.serviceFee || 10000) + 
                              (selectedAdditionalService.transactionFee || 0)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pilihan Metode Pembayaran */}
                  <div className="mb-4">
                    {selectedPayment && selectedPayment !== "" ? (
                      <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{getPaymentMethodName(selectedPayment)}</p>
                            <p className="text-sm text-muted-foreground">
                              Biaya Transaksi: Rp {PAYMENT_FEES[selectedPayment as keyof typeof PAYMENT_FEES]?.toLocaleString('id-ID')}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowPaymentOptions(true)}
                          >
                            Ubah
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-6 p-4 border-2 border-dashed rounded-lg text-center">
                        <p className="text-muted-foreground">Belum memilih metode pembayaran</p>
                        <Button
                          variant="outline"
                          className="mt-2"
                          onClick={() => setShowPaymentOptions(true)}
                        >
                          Pilih Metode Pembayaran
                        </Button>
                      </div>
                    )}

                    {/* Form Kartu Debit/Kredit */}
                    {selectedPayment === "debit-credit" && (
                      <div className="mb-6 p-6 border rounded-lg bg-white shadow-sm dark:bg-gray-800">
                        <div className="mb-4">
                          <h3 className="text-xl font-bold">Kartu Debit/Kredit</h3>
                          <p className="text-muted-foreground">
                            <strong>Kartu Debit/Kredit</strong><br />
                            Biaya Transaksi Rp2.784
                          </p>
                        </div>

                        <div className="space-y-6">
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <CreditCardIcon className="h-5 w-5" />
                              VISA
                            </h4>
                            <div className="space-y-2">
                              <Label htmlFor="cardNumber" className="text-sm font-medium">
                                Nomor Kartu
                              </Label>
                              <Input
                                id="cardNumber"
                                placeholder="Contoh: 1234 5678 9012 3456"
                                value={formatCardNumber(cardData.cardNumber)}
                                onChange={(e) => {
                                  const formatted = formatCardNumber(e.target.value);
                                  setCardData({ ...cardData, cardNumber: formatted });
                                }}
                                maxLength={19}
                              />
                              <p className="text-xs text-muted-foreground">
                                Nomor yang terletak pada kartu debit/credit Anda
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="expiryDate" className="text-sm font-medium">
                                Masa Berlaku
                              </Label>
                              <Input
                                id="expiryDate"
                                placeholder="MM/YY"
                                value={cardData.expiryDate}
                                onChange={(e) => {
                                  const formatted = formatExpiryDate(e.target.value);
                                  setCardData({ ...cardData, expiryDate: formatted });
                                }}
                                maxLength={5}
                              />
                              <p className="text-xs text-muted-foreground">
                                Masa berlaku pada kartu Anda
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="cvv" className="text-sm font-medium">
                                CVV
                              </Label>
                              <Input
                                id="cvv"
                                type="password"
                                placeholder="123"
                                value={cardData.cvv}
                                onChange={(e) => {
                                  const cleaned = e.target.value.replace(/\D/g, '');
                                  if (cleaned.length <= 4) {
                                    setCardData({ ...cardData, cvv: cleaned });
                                  }
                                }}
                                maxLength={4}
                              />
                              <p className="text-xs text-muted-foreground">
                                3 atau 4 digit terakhir pada kartu Anda
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Modal/Popup Payment Options */}
                    <AnimatePresence>
                      {showPaymentOptions && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          transition={{ duration: 0.2 }}
                          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
                          onClick={() => setShowPaymentOptions(false)}
                        >
                          <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b px-6 py-4">
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Pilih Metode Pembayaran</h3>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowPaymentOptions(false)}
                                >
                                  ✕
                                </Button>
                              </div>
                            </div>

                            <div className="overflow-y-auto max-h-[60vh] p-6">
                              <RadioGroup
                                value={selectedPayment}
                                onValueChange={(value) => {
                                  setSelectedPayment(value);
                                  if (value !== "debit-credit") {
                                    setCardData({ cardNumber: "", expiryDate: "", cvv: "" });
                                  }
                                }}
                                className="space-y-4"
                              >
                                {/* E-Wallet */}
                                <div className="border rounded-lg overflow-hidden">
                                  <button
                                    type="button"
                                    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    onClick={() => toggleSection('ewallet')}
                                  >
                                    <div className="flex items-center gap-3">
                                      <Wallet className="h-5 w-5" />
                                      <span className="font-medium">E-Wallet</span>
                                    </div>
                                    {expandedSections.ewallet ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </button>

                                  <AnimatePresence>
                                    {expandedSections.ewallet && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="p-4 space-y-2">
                                          {paymentMethods.ewallet.map((method) => (
                                            <label
                                              key={method.id}
                                              className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${selectedPayment === method.id ? 'border-primary bg-primary/5' : 'hover:border-primary'
                                                }`}
                                            >
                                              <div className="flex items-center gap-3">
                                                <RadioGroupItem value={method.id} id={method.id} />
                                                <div className="flex items-center gap-2">
                                                  <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center"
                                                    style={{ backgroundColor: method.color }}
                                                  >
                                                    <method.icon className="h-4 w-4 text-white" />
                                                  </div>
                                                  <span>{method.name}</span>
                                                </div>
                                              </div>
                                              <span className="text-sm text-muted-foreground">
                                                Rp{method.fee.toLocaleString('id-ID')}
                                              </span>
                                            </label>
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>

                                {/* Virtual Account */}
                                <div className="border rounded-lg overflow-hidden">
                                  <button
                                    type="button"
                                    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    onClick={() => toggleSection('va')}
                                  >
                                    <div className="flex items-center gap-3">
                                      <BuildingIcon className="h-5 w-5" />
                                      <span className="font-medium">Virtual Account</span>
                                    </div>
                                    {expandedSections.va ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </button>

                                  <AnimatePresence>
                                    {expandedSections.va && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="p-4 space-y-2">
                                          {paymentMethods.va.map((method) => (
                                            <label
                                              key={method.id}
                                              className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${selectedPayment === method.id ? 'border-primary bg-primary/5' : 'hover:border-primary'
                                                }`}
                                            >
                                              <div className="flex items-center gap-3">
                                                <RadioGroupItem value={method.id} id={method.id} />
                                                <div className="flex items-center gap-2">
                                                  <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center"
                                                    style={{ backgroundColor: method.color }}
                                                  >
                                                    <method.icon className="h-4 w-4 text-white" />
                                                  </div>
                                                  <span>{method.name}</span>
                                                </div>
                                              </div>
                                              <span className="text-sm text-muted-foreground">
                                                Rp{method.fee.toLocaleString('id-ID')}
                                              </span>
                                            </label>
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>

                                {/* Kartu Debit/Kredit */}
                                <div className="border rounded-lg overflow-hidden">
                                  <button
                                    type="button"
                                    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    onClick={() => toggleSection('card')}
                                  >
                                    <div className="flex items-center gap-3">
                                      <CreditCardIcon className="h-5 w-5" />
                                      <span className="font-medium">Kartu Debit/Kredit</span>
                                    </div>
                                    {expandedSections.card ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </button>

                                  <AnimatePresence>
                                    {expandedSections.card && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="p-4">
                                          {paymentMethods.card.map((method) => (
                                            <label
                                              key={method.id}
                                              className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${selectedPayment === method.id ? 'border-primary bg-primary/5' : 'hover:border-primary'
                                                }`}
                                            >
                                              <div className="flex items-center gap-3">
                                                <RadioGroupItem value={method.id} id={method.id} />
                                                <div className="flex items-center gap-2">
                                                  <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center"
                                                    style={{ backgroundColor: method.color }}
                                                  >
                                                    <method.icon className="h-4 w-4 text-white" />
                                                  </div>
                                                  <span>{method.name}</span>
                                                </div>
                                              </div>
                                              <span className="text-sm text-muted-foreground">
                                                Rp{method.fee.toLocaleString('id-ID')}
                                              </span>
                                            </label>
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>

                                {/* QRIS */}
                                <div className="border rounded-lg overflow-hidden">
                                  <button
                                    type="button"
                                    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    onClick={() => toggleSection('qris')}
                                  >
                                    <div className="flex items-center gap-3">
                                      <QrCode className="h-5 w-5" />
                                      <span className="font-medium">Code QR</span>
                                    </div>
                                    {expandedSections.qris ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </button>

                                  <AnimatePresence>
                                    {expandedSections.qris && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="p-4">
                                          {paymentMethods.qris.map((method) => (
                                            <label
                                              key={method.id}
                                              className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${selectedPayment === method.id ? 'border-primary bg-primary/5' : 'hover:border-primary'
                                                }`}
                                            >
                                              <div className="flex items-center gap-3">
                                                <RadioGroupItem value={method.id} id={method.id} />
                                                <div className="flex items-center gap-2">
                                                  <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center"
                                                    style={{ backgroundColor: method.color }}
                                                  >
                                                    <method.icon className="h-4 w-4 text-white" />
                                                  </div>
                                                  <span>{method.name}</span>
                                                </div>
                                              </div>
                                              <span className="text-sm text-muted-foreground">
                                                Rp{method.fee.toLocaleString('id-ID')}
                                              </span>
                                            </label>
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>

                                {/* Tunai */}
                                <div className="border rounded-lg overflow-hidden">
                                  <button
                                    type="button"
                                    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    onClick={() => toggleSection('cash')}
                                  >
                                    <div className="flex items-center gap-3">
                                      <Banknote className="h-5 w-5" />
                                      <span className="font-medium">Tunai</span>
                                    </div>
                                    {expandedSections.cash ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </button>

                                  <AnimatePresence>
                                    {expandedSections.cash && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="p-4">
                                          {paymentMethods.cash.map((method) => (
                                            <label
                                              key={method.id}
                                              className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${selectedPayment === method.id ? 'border-primary bg-primary/5' : 'hover:border-primary'
                                                }`}
                                            >
                                              <div className="flex items-center gap-3">
                                                <RadioGroupItem value={method.id} id={method.id} />
                                                <div className="flex items-center gap-2">
                                                  <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center"
                                                    style={{ backgroundColor: method.color }}
                                                  >
                                                    <method.icon className="h-4 w-4 text-white" />
                                                  </div>
                                                  <span>{method.name}</span>
                                                </div>
                                              </div>
                                              <span className="text-sm text-muted-foreground">
                                                {method.fee === 0 ? 'Gratis' : `Rp${method.fee.toLocaleString('id-ID')}`}
                                              </span>
                                            </label>
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </RadioGroup>

                              <div className="mt-6 pt-4 border-t">
                                <Button
                                  type="button"
                                  className="w-full text-white transition-colors duration-200"
                                  style={{ backgroundColor: '#7CE0A8' }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5CA68A'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7CE0A8'}
                                  onClick={() => setShowPaymentOptions(false)}
                                >
                                  Simpan Metode Pembayaran
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Ringkasan Harga */}
                    <div className="mt-6 pt-6 border-t">
                      <div className="bg-muted/30 p-4 rounded-lg mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Total Pembayaran</span>
                          <span className="font-bold text-lg">
                            {paymentForAdditional === "additional" && selectedAdditionalService ? (
                              <>
                                Rp {formatPrice(
                                  (selectedAdditionalService.totalPrice || 0) + 
                                  (selectedAdditionalService.serviceFee || 10000) + 
                                  (selectedAdditionalService.transactionFee || 0) +
                                  (PAYMENT_FEES[selectedPayment as keyof typeof PAYMENT_FEES] || 0)
                                )}
                              </>
                            ) : (
                              <>Rp {formatPrice(calculateTotalWithFee(selectedOrder))}</>
                            )}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {paymentForAdditional === "additional" 
                            ? "Pembayaran untuk layanan tambahan" 
                            : "Minimum transaksi Rp75.000"}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setShowPaymentModal(false);
                            setShowPaymentOptions(false);
                            setSelectedAdditionalService(null);
                            setPaymentForAdditional("main");
                          }}
                        >
                          Batal
                        </Button>
                        <Button
                          type="button"
                          className="flex-1 text-white transition-colors duration-200"
                          style={{ backgroundColor: '#7CE0A8' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5CA68A'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7CE0A8'}
                          onClick={handleSavePaymentMethod}
                          disabled={!selectedPayment || (selectedPayment === "debit-credit" && (!cardData.cardNumber || !cardData.expiryDate || !cardData.cvv))}
                        >
                          {paymentForAdditional === "additional" ? "Bayar Sekarang" : "Simpan Metode Pembayaran"}
                        </Button>
                      </div>

                      <p className="text-xs text-center text-muted-foreground mt-4">
                        {paymentForAdditional === "additional" 
                          ? "Setelah pembayaran, layanan tambahan akan diaktifkan"
                          : "Setelah menyimpan metode pembayaran, Anda dapat melanjutkan ke pembayaran"}
                      </p>
                    </div>
                  </div>
                </div>
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
                  >
                    Batal
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleConfirmCompletion}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Konfirmasi Selesai
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
            onClick={() => !isCancelling && setShowCancelModal(false)}
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
                  {!isCancelling && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCancelModal(false)}
                      className="h-8 w-8 p-0"
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
                      disabled={isCancelling}
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
                  {!isCancelling ? (
                    <>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowCancelModal(false)}
                        disabled={isCancelling}
                      >
                        Batal
                      </Button>
                      <Button
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        onClick={handleCancelOrder}
                        disabled={!cancelReason.trim() || isCancelling}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Batalkan Pesanan
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