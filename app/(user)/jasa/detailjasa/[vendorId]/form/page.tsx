// app/jasa/detailjasa/[vendorId]/form/page.tsx
"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/app/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Checkbox } from "@/app/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import {
  Calendar, User, Receipt, MapPin, Navigation, CreditCard, Wallet,
  QrCode, Banknote, ChevronDown, ChevronUp, Building, Check, Loader2,
  Tag, AlertCircle, Copy, Clock, Store, ExternalLink, X, Smartphone,
  CheckCircle, RefreshCw,
  Download,
  Info
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { useParams, useRouter } from "next/navigation";
import { LoaderTwo } from "@/app/components/transition/loader";
import { toast } from "sonner";
import { Badge } from "@/app/components/ui/badge";
import { QRCodeSVG } from 'qrcode.react';

// ==========================================
// XENDIT PAYMENT FEES (Client-side)
// Updated January 2025 - Source: xendit.co/id/pricing
// ==========================================

const XENDIT_PAYMENT_FEES: Record<string, {
  type: 'fixed' | 'percentage' | 'combined';
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

interface OrderData {
  id?: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  gpsLink: string;
  vendorId: string;
  serviceCategory: string;
  serviceDetails: {
    selectedServices: string[];
    quantities: { [key: string]: number };
    notes?: string;
  };
  workDate: string;
  workTime: string;
  additionalNotes?: string;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  orderDate: string;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  subtotal: number;
  serviceFee: number;
  paymentMethod?: string;
  totalAmount: number;
  transactionFee?: number;
}

interface Vendor {
  vendor_id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  description?: string;
  verified: boolean;
  status: string;
  rating: number;
  review_count: number;
  service_areas: string[];
  specialties: string[];
  tags: string[];
  category?: string;
  join_date: string;
  services?: Service[];
  gallery?: any[];
}

interface Service {
  service_id: string;
  name: string;
  description: string;
  price: number;
  price_type: string;
  estimated_time?: string;
  is_active: boolean;
}

interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  gps_link?: string;
  avatar?: string;
}

interface PaymentResponse {
  success: boolean;
  paymentType: string;
  paymentMethod?: string;
  paymentMethodName?: string;
  orderId: string;
  amount: number;
  transactionFee: number;
  totalAmount: number;
  // Xendit specific fields
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
}

// ==========================================
// SESSION STORAGE KEYS
// ==========================================
const STORAGE_KEYS = {
  FORM_STATE: `booking_form_${typeof window !== 'undefined' ? window.location.pathname : ''}`,
  CURRENT_STEP: `booking_step_${typeof window !== 'undefined' ? window.location.pathname : ''}`,
  PAYMENT_DATA: `booking_payment_${typeof window !== 'undefined' ? window.location.pathname : ''}`,
  ORDER_ID: `booking_order_${typeof window !== 'undefined' ? window.location.pathname : ''}`,
  SELECTED_PAYMENT: `booking_payment_method_${typeof window !== 'undefined' ? window.location.pathname : ''}`,
};

// ==========================================
// HELPER FUNCTIONS FOR SESSION STORAGE
// ==========================================

const saveToSessionStorage = (key: string, data: any) => {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to sessionStorage:', error);
    }
  }
};

const getFromSessionStorage = (key: string) => {
  if (typeof window !== 'undefined') {
    try {
      const data = sessionStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading from sessionStorage:', error);
      return null;
    }
  }
  return null;
};

const clearSessionStorage = () => {
  if (typeof window !== 'undefined') {
    Object.values(STORAGE_KEYS).forEach(key => {
      sessionStorage.removeItem(key);
    });
  }
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function VendorFormPage() {
  const params = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState<any>({
    selectedServices: [],
    quantities: {},
    notes: ""
  });
  const [mounted, setMounted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [navigationUrl, setNavigationUrl] = useState<string>("");
  const [gettingLocation, setGettingLocation] = useState(false);
  const [currentStep, setCurrentStep] = useState<'form' | 'confirmation' | 'payment'>('form');
  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [initialOrderId, setInitialOrderId] = useState<string>("");
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Payment response data
  const [paymentData, setPaymentData] = useState<PaymentResponse | null>(null);

  // ==========================================
  // SESSION STORAGE MANAGEMENT
  // ==========================================

  // Save state to session storage
  useEffect(() => {
    if (mounted && vendor) {
      saveToSessionStorage(STORAGE_KEYS.FORM_STATE, formData);
    }
  }, [formData, mounted, vendor]);

  useEffect(() => {
    if (mounted && vendor) {
      saveToSessionStorage(STORAGE_KEYS.CURRENT_STEP, currentStep);
    }
  }, [currentStep, mounted, vendor]);

  useEffect(() => {
    if (mounted && vendor) {
      saveToSessionStorage(STORAGE_KEYS.PAYMENT_DATA, paymentData);
    }
  }, [paymentData, mounted, vendor]);

  useEffect(() => {
    if (mounted && vendor) {
      saveToSessionStorage(STORAGE_KEYS.ORDER_ID, initialOrderId);
    }
  }, [initialOrderId, mounted, vendor]);

  useEffect(() => {
    if (mounted && vendor) {
      saveToSessionStorage(STORAGE_KEYS.SELECTED_PAYMENT, selectedPayment);
    }
  }, [selectedPayment, mounted, vendor]);

  // Restore state from session storage
  const restoreFromSessionStorage = useCallback(() => {
    const savedFormData = getFromSessionStorage(STORAGE_KEYS.FORM_STATE);
    const savedStep = getFromSessionStorage(STORAGE_KEYS.CURRENT_STEP);
    const savedPaymentData = getFromSessionStorage(STORAGE_KEYS.PAYMENT_DATA);
    const savedOrderId = getFromSessionStorage(STORAGE_KEYS.ORDER_ID);
    const savedPaymentMethod = getFromSessionStorage(STORAGE_KEYS.SELECTED_PAYMENT);

    if (savedFormData) {
      console.log('[SessionStorage] Restoring form data');
      setFormData(savedFormData);
    }

    if (savedStep && ['form', 'confirmation', 'payment'].includes(savedStep)) {
      console.log('[SessionStorage] Restoring step:', savedStep);
      setCurrentStep(savedStep);
    }

    if (savedPaymentData) {
      console.log('[SessionStorage] Restoring payment data');
      setPaymentData(savedPaymentData);
    }

    if (savedOrderId) {
      console.log('[SessionStorage] Restoring order ID:', savedOrderId);
      setInitialOrderId(savedOrderId);
    }

    if (savedPaymentMethod) {
      console.log('[SessionStorage] Restoring payment method:', savedPaymentMethod);
      setSelectedPayment(savedPaymentMethod);
    }
  }, []);

  // Clear session storage when leaving
  const handleClearStorage = () => {
    clearSessionStorage();
  };

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setUserProfile(data.profile);
          // Only set form data if not already restored from session storage
          const savedFormData = getFromSessionStorage(STORAGE_KEYS.FORM_STATE);
          if (!savedFormData) {
            setFormData((prev: any) => ({
              ...prev,
              name: data.profile.name || "",
              email: data.profile.email || "",
              phone: data.profile.phone || "",
              address: data.profile.address || "",
              gpsLink: data.profile.gps_link || ""
            }));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Gagal memuat data profil");
    }
  };

  const fetchVendor = async (vendorId: string) => {
    try {
      const response = await fetch(`/api/vendors/${vendorId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.vendor) {
          const normalizedVendor = {
            ...data.vendor,
            vendor_id: data.vendor.id || data.vendor.vendor_id,
            services: data.vendor.services?.map((s: any) => ({
              service_id: s.id || s.service_id,
              name: s.name,
              description: s.description,
              price: s.price,
              price_type: s.priceType || s.price_type,
              estimated_time: s.estimatedTime || s.estimated_time,
              is_active: s.isActive !== undefined ? s.isActive : s.is_active
            })) || []
          };
          setVendor(normalizedVendor);
          return normalizedVendor;
        }
      }
      return null;
    } catch (error) {
      console.error("Error fetching vendor:", error);
      toast.error("Terjadi kesalahan saat memuat data vendor");
      return null;
    }
  };

  useEffect(() => {
    setMounted(true);

    const checkAuthAndLoadData = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          toast.error("Anda harus login terlebih dahulu");
          router.push("/login");
          return;
        }

        await fetchUserProfile();

        const vendorId = params.vendorId as string;
        if (!vendorId) {
          toast.error("ID vendor tidak valid");
          router.push("/jasa");
          return;
        }

        const vendorData = await fetchVendor(vendorId);
        if (!vendorData) {
          setIsLoading(false);
          return;
        }

        // Restore from session storage AFTER vendor is loaded
        restoreFromSessionStorage();
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error checking auth:", error);
        toast.error("Terjadi kesalahan");
        router.push("/login");
      }
    };

    checkAuthAndLoadData();

    // Clear storage on page unload
    const handleBeforeUnload = () => {
      // Don't clear on refresh, only when navigating away
      if (!performance.navigation.type || performance.navigation.type !== 1) {
        handleClearStorage();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [params.vendorId, router, restoreFromSessionStorage]);

  const handleNavigation = async (url: string) => {
    setLeaving(true);
    setNavigationUrl(url);
    await new Promise(resolve => setTimeout(resolve, 300));
    router.push(url);
  };

  const handleBreadcrumbClick = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    handleNavigation(url);
  };

  const handleCancel = () => {
    handleClearStorage();
    const vendorId = params.vendorId as string;
    handleNavigation(`/jasa/detailjasa/${vendorId}`);
  };

  const handleUseProfileLocation = () => {
    if (userProfile?.gps_link) {
      setFormData({ ...formData, gpsLink: userProfile.gps_link });
      toast.success("Lokasi dari profile berhasil dimuat!");
    } else {
      toast.error("Belum ada lokasi tersimpan di profile.");
    }
  };

  const saveOrderToDatabase = async (orderData: OrderData): Promise<{ success: boolean; orderId?: string; error?: string }> => {
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal menyimpan pesanan');
      }

      const data = await response.json();
      return { success: true, orderId: data.orderId };
    } catch (error: any) {
      console.error("Error saving order:", error);
      return { success: false, error: error.message };
    }
  };

  const validateFormData = () => {
    const errors: string[] = [];

    if (!formData.name || formData.name.trim() === '') {
      errors.push('Nama pelanggan harus diisi');
    }

    if (!formData.email || formData.email.trim() === '') {
      errors.push('Email pelanggan harus diisi');
    }

    if (!formData.phone || formData.phone.trim() === '') {
      errors.push('Nomor telepon harus diisi');
    }

    if (!formData.address || formData.address.trim() === '') {
      errors.push('Alamat harus diisi');
    }

    if (!formData.date) {
      errors.push('Tanggal pengerjaan harus dipilih');
    }

    if (!formData.selectedServices || formData.selectedServices.length === 0) {
      errors.push('Minimal pilih satu layanan');
    }

    return errors;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('[Form] Validating form data...');

    // Validate form
    const validationErrors = validateFormData();
    if (validationErrors.length > 0) {
      console.error('[Form] Validation errors:', validationErrors);
      toast.error(validationErrors[0]);
      return;
    }

    // Validate date
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate <= today) {
      toast.error("Tanggal harus mulai dari besok.");
      return;
    }

    const hour = formData.hour || "00";
    const minute = formData.minute || "00";
    const formattedTime = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;

    const servicePrice = calculateServicePrice();
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    setInitialOrderId(orderId);

    const vendorId = params.vendorId as string;

    const orderData: OrderData = {
      orderId: orderId,
      customerName: formData.name,
      customerEmail: formData.email,
      customerPhone: formData.phone,
      customerAddress: formData.address,
      gpsLink: formData.gpsLink || "",
      vendorId: vendorId,
      serviceCategory: vendor?.category || (vendor?.tags?.[0] || "Lainnya"),
      serviceDetails: {
        selectedServices: formData.selectedServices,
        quantities: formData.quantities,
        notes: formData.notes || ""
      },
      workDate: formData.date,
      workTime: formattedTime,
      additionalNotes: formData.notes || "",
      status: "pending",
      orderDate: new Date().toISOString().split('T')[0],
      paymentStatus: "pending",
      subtotal: servicePrice,
      serviceFee: SERVICE_FEE,
      totalAmount: servicePrice + SERVICE_FEE
    };

    console.log('[Form] Submitting order:', JSON.stringify(orderData, null, 2));
    setIsSubmittingOrder(true);

    try {
      const result = await saveOrderToDatabase(orderData);

      if (!result.success) {
        toast.error(result.error || "Gagal menyimpan pesanan");
        setIsSubmittingOrder(false);
        return;
      }

      console.log('[Form] Order saved successfully');
      setShowSuccessModal(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setShowSuccessModal(false);
      setCurrentStep('confirmation');

    } catch (error) {
      console.error('[Form] Error submitting order:', error);
      toast.error("Terjadi kesalahan saat memproses pesanan");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!selectedPayment) {
      toast.error("Silakan pilih metode pembayaran terlebih dahulu.");
      return;
    }

    setIsProcessingPayment(true);

    const servicePrice = calculateServicePrice();
    const baseAmount = servicePrice + SERVICE_FEE;
    const transactionFee = calculateTransactionFee(selectedPayment, baseAmount);
    const totalAmount = baseAmount + transactionFee;

    // Prepare request payload
    const requestPayload = {
      orderId: initialOrderId,
      paymentMethod: selectedPayment,
      customerName: formData.name || vendor?.name || 'Customer',
      customerEmail: formData.email || userProfile?.email || '',
      customerPhone: formData.phone || userProfile?.phone || '',
      amount: baseAmount,
      description: `Pembayaran untuk layanan dari ${vendor?.name || 'Vendor'}`,
    };

    console.log('='.repeat(60));
    console.log('[Payment Frontend] Starting payment process');
    console.log('[Payment Frontend] Selected payment method:', selectedPayment);
    console.log('[Payment Frontend] Request payload:', JSON.stringify(requestPayload, null, 2));

    try {
      console.log('[Payment Frontend] Sending POST request to /api/payments/xendit');

      const response = await fetch('/api/payments/xendit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestPayload),
      });

      console.log('[Payment Frontend] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      // Try to parse response
      let data: PaymentResponse;
      try {
        data = await response.json();
        console.log('[Payment Frontend] Response data:', JSON.stringify(data, null, 2));
      } catch (parseError) {
        console.error('[Payment Frontend] Failed to parse response:', parseError);
        toast.error('Server mengembalikan response yang tidak valid', { duration: 5000 });
        setIsProcessingPayment(false);
        return;
      }

      // Handle error responses
      if (!response.ok || !data.success) {
        console.error('[Payment Frontend] API returned error:', data);
        const errorMessage = data.message || 'Gagal membuat pembayaran';
        toast.error(errorMessage, { duration: 5000 });
        setIsProcessingPayment(false);
        return;
      }

      // Success - save payment data
      setPaymentData(data);
      console.log('[Payment Frontend] Payment created successfully:', data);

      // Handle different payment types
      if (data.paymentType === 'tunai') {
        console.log('[Payment Frontend] Handling cash payment');
        toast.success('Pembayaran tunai berhasil dikonfirmasi!');
        setShowPaymentSuccessModal(true);

        await new Promise(resolve => setTimeout(resolve, 2000));
        setShowPaymentSuccessModal(false);
        handleClearStorage(); // Clear storage after successful payment

        console.log('[Payment Frontend] Redirecting to /riwayat_pemesanan');
        router.push('/riwayat_pemesanan');

      } else {
        // For all other payment types, show the payment step with instructions
        console.log('[Payment Frontend] Showing payment instructions');
        toast.success('Instruksi pembayaran berhasil dibuat');
        setCurrentStep('payment');
      }

    } catch (error: any) {
      console.error('[Payment Frontend] Error caught:', error);
      const errorMessage = error.message || "Terjadi kesalahan saat memproses pembayaran";
      toast.error(errorMessage, { duration: 5000 });

    } finally {
      console.log('[Payment Frontend] Payment process completed');
      setIsProcessingPayment(false);
    }
  };

  const calculateServicePrice = () => {
    if (!vendor || !vendor.services) return 0;

    const selectedServices = formData.selectedServices || [];
    let total = 0;

    selectedServices.forEach((serviceId: string) => {
      const service = vendor.services?.find((s: Service) => s.service_id === serviceId);
      if (service) {
        const quantity = formData.quantities?.[serviceId] || 1;
        total += service.price * quantity;
      }
    });

    return total;
  };

  const calculateTotalPrice = () => {
    const servicePrice = calculateServicePrice();
    const baseAmount = servicePrice + SERVICE_FEE;
    const transactionFee = selectedPayment ? calculateTransactionFee(selectedPayment, baseAmount) : 0;
    return baseAmount + transactionFee;
  };

  const formatPrice = (price: number, priceType: string) => {
    const formattedPrice = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);

    switch (priceType) {
      case 'HOURLY': return `${formattedPrice}/jam`;
      case 'UNIT': return `${formattedPrice}/unit`;
      default: return formattedPrice;
    }
  };

  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    const current = formData.selectedServices || [];
    if (checked) {
      setFormData({
        ...formData,
        selectedServices: [...current, serviceId],
        quantities: { ...formData.quantities, [serviceId]: 1 }
      });
    } else {
      const newQuantities = { ...formData.quantities };
      delete newQuantities[serviceId];
      setFormData({
        ...formData,
        selectedServices: current.filter((id: string) => id !== serviceId),
        quantities: newQuantities
      });
    }
  };

  const handleQuantityChange = (serviceId: string, quantity: number) => {
    setFormData({
      ...formData,
      quantities: { ...formData.quantities, [serviceId]: Math.max(1, quantity) }
    });
  };

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderTwo />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Vendor Tidak Ditemukan</h1>
          <p className="text-gray-600 mb-4">Vendor dengan ID {params.vendorId} tidak ditemukan.</p>
          <Button onClick={() => handleNavigation("/jasa")}>Kembali ke Daftar Jasa</Button>
        </div>
      </div>
    );
  }

  const servicePrice = calculateServicePrice();
  const totalPrice = calculateTotalPrice();

  return (
    <>
      <motion.main
        className="min-h-screen w-full max-w-4xl mx-auto px-4 py-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <a href="/" onClick={(e) => handleBreadcrumbClick(e, "/")}>Home</a>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <a href="/jasa" onClick={(e) => handleBreadcrumbClick(e, "/jasa")}>Jasa</a>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <a href={`/jasa/detailjasa/${vendor.vendor_id}`} onClick={(e) => handleBreadcrumbClick(e, `/jasa/detailjasa/${vendor.vendor_id}`)}>
                    {vendor.name}
                  </a>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {currentStep === 'form' ? 'Form Pemesanan' : currentStep === 'confirmation' ? 'Konfirmasi' : 'Pembayaran'}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Step Content */}
        {currentStep === 'form' ? (
          <OrderForm
            vendor={vendor}
            formData={formData}
            setFormData={setFormData}
            handleFormSubmit={handleFormSubmit}
            handleCancel={handleCancel}
            handleUseProfileLocation={handleUseProfileLocation}
            gettingLocation={gettingLocation}
            userProfile={userProfile}
            handleServiceToggle={handleServiceToggle}
            handleQuantityChange={handleQuantityChange}
            formatPrice={formatPrice}
            isSubmittingOrder={isSubmittingOrder}
          />
        ) : currentStep === 'confirmation' ? (
          <ConfirmationStep
            vendor={vendor}
            formData={formData}
            servicePrice={servicePrice}
            selectedPayment={selectedPayment}
            setSelectedPayment={setSelectedPayment}
            totalPrice={totalPrice}
            onBack={() => setCurrentStep('form')}
            onConfirm={handlePaymentSubmit}
            isProcessingPayment={isProcessingPayment}
            formatPrice={formatPrice}
            calculateTransactionFee={calculateTransactionFee}
          />
        ) : (
          <PaymentStep
            paymentData={paymentData}
            selectedPayment={selectedPayment}
            onBack={() => setCurrentStep('confirmation')}
            orderId={initialOrderId}
            router={router}
            handleClearStorage={handleClearStorage}
          />
        )}
      </motion.main>

      {/* Success Modals */}
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
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Berhasil Mengajukan Pemesanan!</h3>
              <p className="text-gray-600 mb-6">Silakan lanjutkan ke pembayaran.</p>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7CE0A8]"></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPaymentSuccessModal && (
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
                {selectedPayment === 'tunai' ? 'Pesanan Tunai Dikonfirmasi!' : 'Pembayaran Berhasil!'}
              </h3>
              <p className="text-gray-600 mb-4">
                {selectedPayment === 'tunai'
                  ? 'Siapkan pembayaran tunai saat layanan diberikan.'
                  : 'Pesanan Anda sedang diproses.'}
              </p>
              <p className="text-sm text-gray-500 mb-6">Anda akan diarahkan ke halaman riwayat pemesanan...</p>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7CE0A8]"></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {leaving && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-white flex items-center justify-center"
          >
            <LoaderTwo />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ==========================================
// ORDER FORM COMPONENT
// ==========================================

function OrderForm({
  vendor,
  formData,
  setFormData,
  handleFormSubmit,
  handleCancel,
  handleUseProfileLocation,
  gettingLocation,
  userProfile,
  handleServiceToggle,
  handleQuantityChange,
  formatPrice,
  isSubmittingOrder
}: any) {
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const [minDate, setMinDate] = useState("");

  useEffect(() => {
    setMinDate(getTomorrowDate());
  }, []);

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value === '') {
      setFormData({ ...formData, hour: '' });
      return;
    }
    let hour = parseInt(value, 10);
    if (hour > 23) hour = 23;
    setFormData({ ...formData, hour: hour.toString() });
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value === '') {
      setFormData({ ...formData, minute: '' });
      return;
    }
    let minute = parseInt(value, 10);
    if (minute > 59) minute = 59;
    setFormData({ ...formData, minute: minute.toString() });
  };

  const activeServices = useMemo(() => {
    if (!vendor || !vendor.services || !Array.isArray(vendor.services)) return [];
    return vendor.services.filter((s: any) => s.is_active === true);
  }, [vendor]);

  return (
    <>
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={vendor.avatar ?? ""} alt={vendor.name} />
              <AvatarFallback>
                {vendor.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{vendor.name}</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                {vendor.tags?.map((tag: string, i: number) => (
                  <Badge key={i} variant="outline" className="px-2 py-1">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Form Pemesanan Layanan</CardTitle>
          <CardDescription>Lengkapi formulir untuk memesan layanan dari {vendor.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Customer Data */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Data Pelanggan
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap *</Label>
                  <Input
                    id="name"
                    placeholder="Masukkan nama lengkap"
                    required
                    value={formData.name || userProfile?.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">No. Telepon *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="08xxxxxxxxxx"
                    required
                    value={formData.phone || userProfile?.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gpsLink" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Link Google Maps / GPS *
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="gpsLink"
                    type="url"
                    placeholder="https://maps.google.com/..."
                    required
                    value={formData.gpsLink || ""}
                    onChange={(e) => setFormData({ ...formData, gpsLink: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUseProfileLocation}
                    disabled={gettingLocation}
                    className="whitespace-nowrap"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Lokasi Saya
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Alamat Lengkap *</Label>
                <Textarea
                  id="address"
                  placeholder="Masukkan alamat lengkap"
                  rows={3}
                  required
                  value={formData.address || userProfile?.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            {/* Services Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Pilih Layanan *
              </h3>

              {activeServices.length === 0 ? (
                <Card className="border-2 border-dashed">
                  <CardContent className="py-8 text-center">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium mb-2">Vendor belum menambahkan layanan aktif.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {activeServices.map((service: any) => {
                    const isSelected = (formData.selectedServices || []).includes(service.service_id);

                    return (
                      <Card
                        key={service.service_id}
                        className={`border transition-colors ${isSelected ? 'border-[#7CE0A8] bg-[#7CE0A8]/5' : 'hover:border-[#7CE0A8]'}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              <Checkbox
                                id={service.service_id}
                                checked={isSelected}
                                onCheckedChange={(checked) => handleServiceToggle(service.service_id, checked as boolean)}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Label htmlFor={service.service_id} className="font-medium cursor-pointer">
                                    {service.name}
                                  </Label>
                                  <Badge variant="outline" className="text-xs">
                                    {service.price_type === 'FIXED' ? 'Harga Tetap' : service.price_type === 'HOURLY' ? 'Per Jam' : 'Per Unit'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                                {service.estimated_time && (
                                  <div className="flex items-center gap-1 mt-2">
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">{service.estimated_time}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="font-semibold text-primary">{formatPrice(service.price, service.price_type)}</div>
                              {isSelected && (
                                <div className="mt-3 flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => {
                                      const currentQty = formData.quantities?.[service.service_id] || 1;
                                      if (currentQty > 1) handleQuantityChange(service.service_id, currentQty - 1);
                                    }}
                                  >-</Button>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={formData.quantities?.[service.service_id] || 1}
                                    className="w-16 text-center h-8"
                                    onChange={(e) => handleQuantityChange(service.service_id, parseInt(e.target.value) || 1)}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => {
                                      const currentQty = formData.quantities?.[service.service_id] || 1;
                                      handleQuantityChange(service.service_id, currentQty + 1);
                                    }}
                                  >+</Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {activeServices.length > 0 && (
                <Card className="bg-gradient-to-r from-[#7CE0A8]/5 to-[#7CE0A8]/10">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">Total Estimasi Layanan:</span>
                        <p className="text-xs text-muted-foreground mt-1">* Belum termasuk biaya layanan dan biaya transaksi</p>
                      </div>
                      <span className="text-xl font-bold text-primary">
                        Rp {(() => {
                          const selectedServices = formData.selectedServices || [];
                          let total = 0;
                          selectedServices.forEach((serviceId: string) => {
                            const service = activeServices.find((s: any) => s.service_id === serviceId);
                            if (service) {
                              const quantity = formData.quantities?.[serviceId] || 1;
                              total += service.price * quantity;
                            }
                          });
                          return total.toLocaleString('id-ID');
                        })()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Jadwal Layanan
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Tanggal Pengerjaan *</Label>
                  <Input
                    id="date"
                    type="date"
                    required
                    value={formData.date || ""}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    min={minDate}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Waktu Pengerjaan *</Label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1">
                      <div className="flex items-center border rounded-md overflow-hidden">
                        <Input
                          type="text"
                          className="border-0 text-center focus-visible:ring-0 rounded-none"
                          placeholder="00"
                          value={formData.hour || ""}
                          onChange={handleHourChange}
                          maxLength={2}
                        />
                        <div className="px-2 py-2 bg-gray-50">:</div>
                        <Input
                          type="text"
                          className="border-0 text-center focus-visible:ring-0 rounded-none"
                          placeholder="00"
                          value={formData.minute || ""}
                          onChange={handleMinuteChange}
                          maxLength={2}
                        />
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">WIB</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan Tambahan</Label>
              <Textarea
                id="notes"
                placeholder="Informasi tambahan untuk vendor..."
                rows={4}
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={handleCancel}>Batal</Button>
              <Button
                type="submit"
                className="flex-1 text-white transition-colors duration-200"
                style={{ backgroundColor: '#7CE0A8' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5CA68A'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7CE0A8'}
                disabled={!formData.selectedServices || formData.selectedServices.length === 0 || isSubmittingOrder}
              >
                {isSubmittingOrder ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Memproses...</>
                ) : 'Ajukan Pemesanan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

// ==========================================
// CONFIRMATION STEP COMPONENT
// ==========================================

function ConfirmationStep({
  vendor,
  formData,
  servicePrice,
  selectedPayment,
  setSelectedPayment,
  totalPrice,
  onBack,
  onConfirm,
  isProcessingPayment,
  formatPrice,
  calculateTransactionFee
}: any) {
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    ewallet: true,
    va: false,
    card: false,
    qris: false,
    retail: false,
    tunai: false
  });

  const paymentCategories = {
    ewallet: {
      name: 'E-Wallet',
      icon: Wallet,
      methods: ['ewallet_dana', 'ewallet_ovo', 'ewallet_shopeepay', 'ewallet_linkaja']
    },
    va: {
      name: 'Virtual Account',
      icon: Building,
      methods: ['va_bca', 'va_bni', 'va_bri', 'va_mandiri', 'va_permata', 'va_bsi', 'va_cimb']
    },
    qris: {
      name: 'QRIS',
      icon: QrCode,
      methods: ['qris']
    },
    card: {
      name: 'Kartu Kredit/Debit',
      icon: CreditCard,
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

  const baseAmount = servicePrice + SERVICE_FEE;
  const transactionFee = selectedPayment ? calculateTransactionFee(selectedPayment, baseAmount) : 0;

  const formatTimeForDisplay = () => {
    const hour = formData.hour || "0";
    const minute = formData.minute || "0";
    return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')} WIB`;
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getSelectedServicesDetails = () => {
    if (!vendor || !vendor.services) return [];
    return formData.selectedServices.map((serviceId: string) => {
      const service = vendor.services.find((s: any) => s.service_id === serviceId);
      const quantity = formData.quantities?.[serviceId] || 1;
      return { ...service, quantity, total: service ? service.price * quantity : 0 };
    });
  };

  const selectedServicesDetails = getSelectedServicesDetails();

  return (
    <div className="space-y-6">
      {/* Order Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Informasi Pemesanan</span>
            <Button variant="outline" size="sm" onClick={onBack}>Ubah</Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div>
              <h3 className="font-bold text-lg">{formData.name || "Nama Pelanggan"}</h3>
              <p className="text-muted-foreground">{formData.email || "email@example.com"}</p>
              <p className="text-muted-foreground">{formData.phone || "08xxxxxxxxxx"}</p>
            </div>

            <div className="border-t pt-3">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Alamat:</span>
              </div>
              <p className="text-sm">{formData.address || "Alamat lengkap belum diisi"}</p>
            </div>

            <div className="border-t pt-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Jadwal:</span>
              </div>
              <p className="text-sm">
                {formData.date ? new Date(formData.date).toLocaleDateString('id-ID', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                }) : "Tanggal belum dipilih"} • {formatTimeForDisplay()}
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Detail Layanan</h4>
            <div className="space-y-3">
              {selectedServicesDetails.map((service: any) => (
                <div key={service.service_id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-muted-foreground">Qty: {service.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(service.price, service.price_type)}</p>
                    <p className="text-sm text-muted-foreground">Total: Rp {(service.total).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Ringkasan Harga</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal Layanan</span>
                <span>Rp {servicePrice.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Biaya Layanan</span>
                <span>Rp {SERVICE_FEE.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Biaya Transaksi</span>
                <span className="text-right">
                  {selectedPayment ? (
                    <span>
                      {getCalculatedFeeDisplay(selectedPayment, baseAmount)}
                      <span className="text-xs text-muted-foreground block">
                        ({getFeeDescription(selectedPayment)})
                      </span>
                    </span>
                  ) : '-'}
                </span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>Rp {totalPrice.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <span>Pilih Metode Pembayaran</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedPayment ? (
            <div className="mb-6 p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{XENDIT_PAYMENT_FEES[selectedPayment]?.name || selectedPayment}</p>
                  <p className="text-sm text-muted-foreground">
                    Biaya Transaksi: {getCalculatedFeeDisplay(selectedPayment, baseAmount)}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowPaymentOptions(true)}>Ubah</Button>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 border-2 border-dashed rounded-lg text-center">
              <p className="text-muted-foreground">Belum memilih metode pembayaran</p>
              <Button variant="outline" className="mt-2" onClick={() => setShowPaymentOptions(true)}>
                Pilih Metode Pembayaran
              </Button>
            </div>
          )}

          {/* Payment Modal */}
          <AnimatePresence>
            {showPaymentOptions && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                onClick={() => setShowPaymentOptions(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Pilih Metode Pembayaran</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowPaymentOptions(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="overflow-y-auto max-h-[60vh] p-6">
                    <RadioGroup
                      value={selectedPayment}
                      onValueChange={setSelectedPayment}
                      className="space-y-4"
                    >
                      {Object.entries(paymentCategories).map(([categoryKey, category]) => (
                        <div key={categoryKey} className="border rounded-lg overflow-hidden">
                          <button
                            type="button"
                            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100"
                            onClick={() => toggleSection(categoryKey)}
                          >
                            <div className="flex items-center gap-2">
                              <category.icon className="h-5 w-5" />
                              <span className="font-medium">{category.name}</span>
                            </div>
                            {expandedSections[categoryKey] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>

                          <AnimatePresence>
                            {expandedSections[categoryKey] && (
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
                                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${selectedPayment === methodId ? 'border-[#7CE0A8] bg-[#7CE0A8]/5' : 'hover:border-[#7CE0A8]'
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
                                              {method.icon === 'building' && <Building className="h-4 w-4" />}
                                              {method.icon === 'qrcode' && <QrCode className="h-4 w-4" />}
                                              {method.icon === 'credit-card' && <CreditCard className="h-4 w-4" />}
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

          {/* Action Buttons */}
          <div className="mt-6 pt-6 border-t">
            <div className="bg-muted/30 p-4 rounded-lg mb-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Pembayaran</span>
                <span className="font-bold text-xl">Rp {totalPrice.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={onBack}>Kembali</Button>
              <Button
                type="button"
                className="flex-1 text-white"
                style={{ backgroundColor: '#7CE0A8' }}
                onClick={onConfirm}
                disabled={!selectedPayment || isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Memproses...</>
                ) : 'Bayar Sekarang'}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground mt-4">
              Dengan mengklik "Bayar Sekarang", Anda menyetujui kebijakan dan privasi dari Selsas
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ==========================================
// PAYMENT STEP COMPONENT (Fixed - No proxy fetching)
// ==========================================

function PaymentStep({ paymentData, selectedPayment, onBack, orderId, router, handleClearStorage }: {
  paymentData: PaymentResponse | null;
  selectedPayment: string;
  onBack: () => void;
  orderId: string;
  router: any;
  handleClearStorage: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [qrRefreshTime, setQrRefreshTime] = useState<number>(300); // 5 minutes in seconds
  const [isRefreshingQR, setIsRefreshingQR] = useState(false);
  const [currentQrString, setCurrentQrString] = useState<string>('');

  // Initialize QR string from payment data
  useEffect(() => {
    if (paymentData?.qrString) {
      setCurrentQrString(paymentData.qrString);
    }
  }, [paymentData]);

  // Start countdown timer for QR refresh
  useEffect(() => {
    if (selectedPayment === 'qris' && qrRefreshTime > 0) {
      const interval = setInterval(() => {
        setQrRefreshTime(prev => {
          if (prev <= 1) {
            refreshQRCode();
            return 300; // Reset to 5 minutes
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [selectedPayment, qrRefreshTime]);

  const refreshQRCode = async () => {
    if (isRefreshingQR) return;
    
    setIsRefreshingQR(true);
    try {
      const response = await fetch(`/api/payments/xendit?orderId=${orderId}&refreshQR=true`, {
        method: 'GET',
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (data.success && data.booking?.refreshedQR) {
        const refreshed = data.booking.refreshedQR;
        if (refreshed.qrString) {
          setCurrentQrString(refreshed.qrString);
          toast.success('QR code berhasil diperbarui');
          setQrRefreshTime(300); // Reset timer
        }
      }
    } catch (error) {
      console.error('Error refreshing QR code:', error);
      toast.error('Gagal memperbarui QR code');
    } finally {
      setIsRefreshingQR(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} berhasil disalin`);
    setTimeout(() => setCopied(null), 2000);
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

  const handleCheckStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const response = await fetch(`/api/payments/xendit?orderId=${orderId}`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success && data.booking) {
        if (data.booking.paymentStatus === 'PAID') {
          handleClearStorage(); // Clear storage before redirect
          toast.success('Pembayaran berhasil! Mengarahkan ke riwayat pemesanan...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          router.push('/riwayat_pemesanan');
        } else {
          toast.info(`Status: ${data.booking.paymentStatus}`);
        }
      }
    } catch (error) {
      toast.error('Gagal memeriksa status pembayaran');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Simulate payment for testing
  const handleSimulatePayment = async () => {
    setIsSimulating(true);
    try {
      const response = await fetch('/api/payments/xendit/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (data.success) {
        handleClearStorage(); // Clear storage before redirect
        toast.success('Pembayaran berhasil! Mengarahkan ke riwayat pemesanan...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        router.push('/riwayat_pemesanan');
      } else {
        toast.error(data.message || 'Gagal mensimulasikan pembayaran');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat mensimulasikan pembayaran');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleGoToOrderHistory = () => {
    handleClearStorage(); // Clear storage before redirect
    router.push('/riwayat_pemesanan');
  };

  const handleDownloadQRCode = () => {
    if (paymentData?.qrCodeUrl) {
      // Download langsung dari Xendit URL
      const link = document.createElement('a');
      link.href = paymentData.qrCodeUrl;
      link.download = `qris-${orderId}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('QR code berhasil diunduh');
    } else if (currentQrString) {
      // Generate download dari QR string (opsional)
      toast.info('Fitur download dari QR string sedang dikembangkan');
    }
  };

  // Generate QR code dari string menggunakan qrcode.react
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

  if (!paymentData) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-muted-foreground">Data pembayaran tidak ditemukan</p>
          <Button variant="outline" className="mt-4" onClick={onBack}>Kembali</Button>
        </CardContent>
      </Card>
    );
  }

  const methodInfo = XENDIT_PAYMENT_FEES[selectedPayment];
  const isQRIS = selectedPayment === 'qris';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {paymentData.vaNumber && <Building className="h-5 w-5" />}
            {isQRIS && <QrCode className="h-5 w-5" />}
            {paymentData.ewalletType && <Wallet className="h-5 w-5" />}
            {paymentData.cardType && <CreditCard className="h-5 w-5" />}
            {paymentData.paymentCode && <Store className="h-5 w-5" />}
            <span>Instruksi Pembayaran</span>
          </CardTitle>
          <CardDescription>
            Selesaikan pembayaran sebelum waktu berakhir
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Method Info */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: methodInfo?.color || '#6B7280' }}
                >
                  {methodInfo?.icon === 'wallet' && <Wallet className="h-5 w-5" />}
                  {methodInfo?.icon === 'building' && <Building className="h-5 w-5" />}
                  {methodInfo?.icon === 'qrcode' && <QrCode className="h-5 w-5" />}
                  {methodInfo?.icon === 'credit-card' && <CreditCard className="h-5 w-5" />}
                  {methodInfo?.icon === 'store' && <Store className="h-5 w-5" />}
                  {methodInfo?.icon === 'banknote' && <Banknote className="h-5 w-5" />}
                </div>
                <div>
                  <p className="font-medium">{paymentData.paymentMethodName || methodInfo?.name || selectedPayment}</p>
                  <p className="text-sm text-muted-foreground">Order ID: {orderId}</p>
                  {isQRIS && paymentData.xenditId && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Xendit ID: {paymentData.xenditId?.slice(-8) || 'N/A'}
                    </p>
                  )}
                </div>
              </div>
              {isQRIS && (
                <Badge variant="outline" className={qrRefreshTime <= 60 ? 'text-red-600' : ''}>
                  <Clock className="h-3 w-3 mr-1" />
                  QR Berubah: {formatTime(qrRefreshTime)}
                </Badge>
              )}
            </div>
          </div>

          {/* ==========================================
              QRIS DISPLAY - FIXED (No proxy fetching)
              ========================================== */}
          {isQRIS && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg flex flex-col items-center">
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  Scan QR Code dengan aplikasi e-wallet atau mobile banking<br />
                  <span className="text-xs">QR code akan otomatis diperbarui setiap 5 menit untuk keamanan</span>
                </p>
                
                {/* QR Code Display - Fixed */}
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

                {/* QR String Info (for debugging) */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg w-full">
                  <p className="text-xs text-gray-500 text-center">
                    QR String: {currentQrString ? `${currentQrString.substring(0, 50)}...` : 'Tidak tersedia'}
                  </p>
                </div>

                {/* Download QR Code Button */}
                <div className="mt-6 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleDownloadQRCode}
                    disabled={!paymentData?.qrCodeUrl}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {paymentData?.qrCodeUrl ? 'Download QR Code' : 'Download Tidak Tersedia'}
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
                        <li>Berlaku hingga: {paymentData.expirationDate ? formatExpiration(paymentData.expirationDate) : '24 jam'}</li>
                        {paymentData.isTestMode && (
                          <li className="font-semibold text-yellow-700">⚠️ Mode Testing - QR code ini untuk pengujian</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alternative Payment URL */}
              {paymentData.invoiceUrl && (
                <div className="p-4 bg-gray-50 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Atau gunakan link pembayaran:</p>
                  <div className="flex items-center gap-2">
                    <Input
                      value={paymentData.invoiceUrl}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(paymentData.invoiceUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Buka
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==========================================
              VIRTUAL ACCOUNT DISPLAY
              ========================================== */}
          {paymentData.vaNumber && !isQRIS && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Nomor Virtual Account</p>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-2xl font-mono font-bold tracking-wider">{paymentData.vaNumber}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(paymentData.vaNumber!, 'Nomor VA')}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {copied === 'Nomor VA' ? 'Tersalin!' : 'Salin'}
                  </Button>
                </div>
              </div>

              {/* VA Instructions */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Cara Pembayaran:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Buka aplikasi mobile banking atau ATM {paymentData.bankCode}</li>
                  <li>Pilih menu Transfer / Virtual Account</li>
                  <li>Masukkan nomor VA: <strong>{paymentData.vaNumber}</strong></li>
                  <li>Masukkan nominal: <strong>Rp {paymentData.totalAmount.toLocaleString('id-ID')}</strong></li>
                  <li>Konfirmasi dan selesaikan pembayaran</li>
                </ol>
              </div>
            </div>
          )}

          {/* ==========================================
              E-WALLET DISPLAY
              ========================================== */}
          {paymentData.ewalletType && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Smartphone className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Pembayaran {paymentData.ewalletType}</p>
                    <p className="text-sm text-muted-foreground">Buka aplikasi {paymentData.ewalletType} untuk menyelesaikan pembayaran</p>
                  </div>
                </div>
              </div>

              {/* E-Wallet Instructions */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Cara Pembayaran:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Buka aplikasi {paymentData.ewalletType} di smartphone Anda</li>
                  <li>Cek notifikasi pembayaran masuk</li>
                  <li>Atau klik tombol "Simulasi Pembayaran" di bawah untuk testing</li>
                  <li>Konfirmasi pembayaran dengan PIN atau biometrik</li>
                </ol>
              </div>
            </div>
          )}

          {/* ==========================================
              CARD PAYMENT DISPLAY
              ========================================== */}
          {paymentData.cardType && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Pembayaran Kartu {paymentData.cardType}</p>
                    <p className="text-sm text-muted-foreground">Pembayaran dengan kartu kredit/debit</p>
                  </div>
                </div>
              </div>

              {/* Card Instructions */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Informasi:</h4>
                <p className="text-sm text-blue-800">
                  Untuk testing, klik tombol "Simulasi Pembayaran Berhasil" di bawah untuk melanjutkan.
                </p>
              </div>
            </div>
          )}

          {/* ==========================================
              RETAIL OUTLET DISPLAY
              ========================================== */}
          {paymentData.paymentCode && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Kode Pembayaran</p>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-2xl font-mono font-bold tracking-wider">{paymentData.paymentCode}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(paymentData.paymentCode!, 'Kode Pembayaran')}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {copied === 'Kode Pembayaran' ? 'Tersalin!' : 'Salin'}
                  </Button>
                </div>
              </div>

              {/* Retail Instructions */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Cara Pembayaran di {paymentData.retailOutlet}:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Kunjungi gerai {paymentData.retailOutlet} terdekat</li>
                  <li>Sampaikan kepada kasir untuk pembayaran SELSAS</li>
                  <li>Berikan kode pembayaran: <strong>{paymentData.paymentCode}</strong></li>
                  <li>Bayar sejumlah: <strong>Rp {paymentData.totalAmount.toLocaleString('id-ID')}</strong></li>
                  <li>Simpan bukti pembayaran</li>
                </ol>
              </div>
            </div>
          )}

          {/* ==========================================
              AMOUNT DISPLAY
              ========================================== */}
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Total Pembayaran</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-primary">
                Rp {paymentData.totalAmount.toLocaleString('id-ID')}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(paymentData.totalAmount.toString(), 'Nominal')}
              >
                <Copy className="h-4 w-4 mr-2" />
                {copied === 'Nominal' ? 'Tersalin!' : 'Salin'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Termasuk biaya transaksi: Rp {paymentData.transactionFee.toLocaleString('id-ID')}
            </p>
          </div>

          {/* ==========================================
              EXPIRATION
              ========================================== */}
          {paymentData.expirationDate && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2 text-yellow-800">
                <Clock className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Batas Waktu Pembayaran</p>
                  <p className="text-sm">{formatExpiration(paymentData.expirationDate)}</p>
                  {isQRIS && (
                    <p className="text-xs mt-1">
                      QR code akan berubah otomatis setiap 5 menit hingga waktu habis
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              ACTION BUTTONS
              ========================================== */}
          <div className="space-y-3 pt-4">
            {/* Simulate Payment Button (For Testing) */}
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={handleSimulatePayment}
              disabled={isSimulating}
            >
              {isSimulating ? (
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

            <Button
              className="w-full text-white"
              style={{ backgroundColor: '#7CE0A8' }}
              onClick={handleCheckStatus}
              disabled={isCheckingStatus}
            >
              {isCheckingStatus ? (
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
              onClick={handleGoToOrderHistory}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Lihat Riwayat Pemesanan
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={onBack}
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
        </CardContent>
      </Card>
    </div>
  );
}