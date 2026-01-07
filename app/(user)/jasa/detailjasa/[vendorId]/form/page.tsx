// app/jasa/detailjasa/{vendorId}/form/page.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Checkbox } from "@/app/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Calendar, User, Receipt, Home, MapPin, Navigation, CreditCard, Wallet, Smartphone, QrCode, Banknote, ChevronDown, ChevronUp, Building, Smartphone as SmartphoneIcon, CreditCard as CreditCardIcon, Check, Loader2, Tag, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { useParams, useRouter } from "next/navigation";
import { LoaderTwo } from "@/app/components/transition/loader";
import { toast } from "sonner";
import { Badge } from "@/app/components/ui/badge";

const PAYMENT_FEES = {
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

const SERVICE_FEE = 10000;

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
  const [currentStep, setCurrentStep] = useState<'form' | 'confirmation'>('form');
  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [cardData, setCardData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: ""
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [initialOrderId, setInitialOrderId] = useState<string>("");
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setUserProfile(data.profile);
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
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Gagal memuat data profil");
    }
  };

  const fetchVendor = async (vendorId: string) => {
    try {
      const response = await fetch(`/api/vendors/${vendorId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.vendor) {
          setVendor(data.vendor);
          return data.vendor;
        } else {
          toast.error("Data vendor tidak ditemukan");
          setVendor(null);
          return null;
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Gagal memuat data vendor");
        setVendor(null);
        return null;
      }
    } catch (error) {
      console.error("Error fetching vendor:", error);
      toast.error("Terjadi kesalahan saat memuat data vendor");
      setVendor(null);
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

        setIsLoading(false);
      } catch (error) {
        console.error("Error checking auth:", error);
        toast.error("Terjadi kesalahan");
        router.push("/login");
      }
    };

    checkAuthAndLoadData();
  }, [params.vendorId, router]);

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
    const vendorId = params.vendorId as string;
    handleNavigation(`/jasa/detailjasa/${vendorId}`);
  };

  const handleUseProfileLocation = () => {
    if (userProfile?.gps_link) {
      setFormData({ ...formData, gpsLink: userProfile.gps_link });
      toast.success("Lokasi dari profile berhasil dimuat!");
    } else {
      toast.error("Belum ada lokasi tersimpan di profile. Silakan isi di halaman Profile terlebih dahulu.");
    }
  };

  const saveOrderToDatabase = async (orderData: OrderData): Promise<{ success: boolean; orderId?: string; error?: string }> => {
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      console.error("Error saving order to database:", error);
      return { success: false, error: error.message };
    }
  };

  const updatePaymentStatus = async (orderId: string, paymentData: {
    paymentMethod: string;
    paymentStatus: string;
    transactionFee: number;
    totalAmount: number;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`/api/bookings/${orderId}/payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal memperbarui status pembayaran');
      }

      return { success: true };
    } catch (error: any) {
      console.error("Error updating payment status:", error);
      return { success: false, error: error.message };
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi tanggal
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate <= today) {
      toast.error("Tanggal harus mulai dari besok. Tidak bisa memilih tanggal hari ini atau yang sudah lewat.");
      return;
    }

    const hour = formData.hour || "00";
    const minute = formData.minute || "00";

    if (parseInt(hour) < 0 || parseInt(hour) > 23) {
      toast.error("Jam harus antara 00-23");
      return;
    }

    if (parseInt(minute) < 0 || parseInt(minute) > 59) {
      toast.error("Menit harus antara 00-59");
      return;
    }

    const formattedTime = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;

    const servicePrice = calculateServicePrice();
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    setInitialOrderId(orderId);

    const vendorId = params.vendorId as string;

    const orderData: OrderData = {
      orderId: orderId,
      customerName: formData.name || "",
      customerEmail: formData.email || "",
      customerPhone: formData.phone || "",
      customerAddress: formData.address || "",
      gpsLink: formData.gpsLink || "",
      vendorId: vendorId,
      serviceCategory: vendor?.category || (vendor?.tags?.[0] || "Lainnya"),
      serviceDetails: {
        selectedServices: formData.selectedServices || [],
        quantities: formData.quantities || {},
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

    const result = await saveOrderToDatabase(orderData);
    
    if (!result.success) {
      toast.error(result.error || "Gagal menyimpan pesanan");
      return;
    }

    setShowSuccessModal(true);

    setTimeout(() => {
      setShowSuccessModal(false);
      setCurrentStep('confirmation');
    }, 2000);
  };

  const handleFinalSubmit = async () => {
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

    setIsProcessingPayment(true);

    const transactionFee = PAYMENT_FEES[selectedPayment as keyof typeof PAYMENT_FEES] || 0;
    const totalPrice = calculateTotalPrice();

    const paymentData = {
      paymentMethod: selectedPayment,
      paymentStatus: "paid",
      transactionFee: transactionFee,
      totalAmount: totalPrice
    };

    const result = await updatePaymentStatus(initialOrderId, paymentData);

    if (!result.success) {
      toast.error(result.error || "Gagal memproses pembayaran");
      setIsProcessingPayment(false);
      return;
    }

    setTimeout(() => {
      setIsProcessingPayment(false);
      setShowPaymentSuccessModal(true);

      setTimeout(() => {
        setShowPaymentSuccessModal(false);
        router.push('/riwayat_pemesanan');
      }, 3000);
    }, 1500);
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
    const paymentFee = PAYMENT_FEES[selectedPayment as keyof typeof PAYMENT_FEES] || 0;
    return servicePrice + SERVICE_FEE + paymentFee;
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

  const getServiceDescription = () => {
    if (!vendor || !vendor.services) return "Layanan";

    const selectedServices = formData.selectedServices || [];
    if (selectedServices.length === 0) return "Layanan";

    const serviceNames = selectedServices.map((serviceId: string) => {
      const service = vendor.services?.find((s: Service) => s.service_id === serviceId);
      if (service) {
        const quantity = formData.quantities?.[serviceId] || 1;
        return `${service.name}${quantity > 1 ? ` (${quantity}x)` : ''}`;
      }
      return "";
    }).filter(Boolean).join(", ");

    return serviceNames || "Layanan";
  };

  const formatPrice = (price: number, priceType: string) => {
    const formattedPrice = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);

    switch (priceType) {
      case 'HOURLY':
        return `${formattedPrice}/jam`;
      case 'UNIT':
        return `${formattedPrice}/unit`;
      default:
        return formattedPrice;
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
          <p className="text-gray-600 mb-4">Vendor dengan ID {params.vendorId} tidak ditemukan dalam database.</p>
          <Button onClick={() => handleNavigation("/jasa")}>
            Kembali ke Daftar Jasa
          </Button>
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
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <motion.span whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                    <a
                      href="/"
                      className="cursor-pointer"
                      onClick={(e) => handleBreadcrumbClick(e, "/")}
                    >
                      Home
                    </a>
                  </motion.span>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <motion.span whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                    <a
                      href="/jasa"
                      className="cursor-pointer"
                      onClick={(e) => handleBreadcrumbClick(e, "/jasa")}
                    >
                      Jasa
                    </a>
                  </motion.span>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <motion.span whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                    <a
                      href={`/jasa/detailjasa/${vendor.vendor_id}`}
                      className="cursor-pointer"
                      onClick={(e) => handleBreadcrumbClick(e, `/jasa/detailjasa/${vendor.vendor_id}`)}
                    >
                      {vendor.name}
                    </a>
                  </motion.span>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {currentStep === 'form' ? 'Form Pemesanan' : 'Konfirmasi Pemesanan'}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

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
          />
        ) : (
          <ConfirmationStep
            vendor={vendor}
            formData={formData}
            servicePrice={servicePrice}
            selectedPayment={selectedPayment}
            setSelectedPayment={setSelectedPayment}
            cardData={cardData}
            setCardData={setCardData}
            formatCardNumber={formatCardNumber}
            formatExpiryDate={formatExpiryDate}
            totalPrice={totalPrice}
            onBack={() => setCurrentStep('form')}
            onConfirm={handleFinalSubmit}
            isProcessingPayment={isProcessingPayment}
            getServiceDescription={getServiceDescription}
            formatPrice={formatPrice}
          />
        )}
      </motion.main>

      {/* Modal Sukses Ajukan Pemesanan */}
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
                Berhasil Mengajukan Pemesanan!
              </h3>
              <p className="text-gray-600 mb-6">
                Pesanan Anda telah berhasil diajukan dan tersimpan di database.
                Silakan lanjutkan ke pembayaran.
              </p>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7CE0A8]"></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Sukses Pembayaran */}
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
                Pembayaran Berhasil!
              </h3>
              <p className="text-gray-600 mb-4">
                Pembayaran Anda telah berhasil diproses. Pesanan Anda sekarang dalam proses pengerjaan.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Anda akan diarahkan ke halaman riwayat pemesanan...
              </p>
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
            key="route-leave"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[9999] bg-white dark:bg-neutral-950 flex items-center justify-center"
          >
            <LoaderTwo />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// OrderForm component
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
  formatPrice
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
    let value = e.target.value;
    value = value.replace(/\D/g, '');
    if (value === '') {
      setFormData({ ...formData, hour: '' });
      return;
    }

    let hour = parseInt(value, 10);
    if (hour > 23) {
      hour = 23;
    }

    setFormData({ ...formData, hour: hour.toString() });
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/\D/g, '');
    if (value === '') {
      setFormData({ ...formData, minute: '' });
      return;
    }

    let minute = parseInt(value, 10);
    if (minute > 59) {
      minute = 59;
    }

    setFormData({ ...formData, minute: minute.toString() });
  };

  const activeServices = vendor.services?.filter((s: any) => s.is_active) || [];

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
          <CardDescription>
            Lengkapi formulir di bawah untuk memesan layanan dari {vendor.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFormSubmit} className="space-y-6">
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
                    placeholder="https://maps.google.com/... atau https://maps.app.goo.gl/..."
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
                    {gettingLocation ? (
                      <>
                        <span className="animate-spin mr-2">⟳</span>
                        Mencari...
                      </>
                    ) : (
                      <>
                        <Navigation className="h-4 w-4 mr-2" />
                        Lokasi Saya
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tempelkan link lokasi dari Google Maps atau klik tombol "Lokasi Saya"
                </p>
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

            {/* Pilihan Layanan dari Vendor */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Pilih Layanan
              </h3>

              {activeServices.length === 0 ? (
                <Card className="border-2 border-dashed">
                  <CardContent className="py-8 text-center">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Vendor belum menambahkan layanan aktif.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {activeServices.map((service: any) => (
                    <Card key={service.service_id} className="border hover:border-[#7CE0A8] transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <Checkbox
                              id={service.service_id}
                              checked={(formData.selectedServices || []).includes(service.service_id)}
                              onCheckedChange={(checked) => {
                                handleServiceToggle(service.service_id, checked as boolean);
                              }}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Label htmlFor={service.service_id} className="font-medium cursor-pointer">
                                  {service.name}
                                </Label>
                                <Badge variant="outline" className="text-xs">
                                  {service.price_type === 'FIXED' ? 'Harga Tetap' :
                                   service.price_type === 'HOURLY' ? 'Per Jam' :
                                   'Per Unit'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {service.description}
                              </p>
                              {service.estimated_time && (
                                <div className="flex items-center gap-1 mt-2">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {service.estimated_time}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-semibold text-primary">
                              {formatPrice(service.price, service.price_type)}
                            </div>

                            {(formData.selectedServices || []).includes(service.service_id) && (
                              <div className="mt-3 flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    const currentQty = formData.quantities?.[service.service_id] || 1;
                                    if (currentQty > 1) {
                                      handleQuantityChange(service.service_id, currentQty - 1);
                                    }
                                  }}
                                >
                                  -
                                </Button>
                                <Input
                                  type="number"
                                  min="1"
                                  value={formData.quantities?.[service.service_id] || 1}
                                  className="w-16 text-center"
                                  onChange={(e) => {
                                    const qty = parseInt(e.target.value) || 1;
                                    handleQuantityChange(service.service_id, qty);
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    const currentQty = formData.quantities?.[service.service_id] || 1;
                                    handleQuantityChange(service.service_id, currentQty + 1);
                                  }}
                                >
                                  +
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {activeServices.length > 0 && (
                <Card className="bg-gradient-to-r from-[#7CE0A8]/5 to-[#7CE0A8]/10">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">Total Estimasi Layanan:</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          * Harga belum termasuk biaya layanan dan biaya transaksi
                        </p>
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
                          className="border-0 text-center focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
                          placeholder="00"
                          value={formData.hour || ""}
                          onChange={handleHourChange}
                          maxLength={2}
                        />
                        <div className="px-2 py-2 bg-gray-50">:</div>
                        <Input
                          type="text"
                          className="border-0 text-center focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
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

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleCancel}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="flex-1 text-white transition-colors duration-200"
                style={{ backgroundColor: '#7CE0A8' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5CA68A'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7CE0A8'}
                disabled={!formData.selectedServices || formData.selectedServices.length === 0}
              >
                Ajukan Pemesanan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

// ConfirmationStep component
function ConfirmationStep({
  vendor,
  formData,
  servicePrice,
  selectedPayment,
  setSelectedPayment,
  cardData,
  setCardData,
  formatCardNumber,
  formatExpiryDate,
  totalPrice,
  onBack,
  onConfirm,
  isProcessingPayment,
  getServiceDescription,
  formatPrice
}: any) {
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    ewallet: true,
    va: false,
    card: false,
    qris: false,
    cash: false
  });

  const paymentMethods = {
    ewallet: [
      { id: "dana", name: "DANA", icon: Wallet, fee: 1440, color: "#10B981" },
      { id: "ovo", name: "OVO", icon: SmartphoneIcon, fee: 1440, color: "#4F46E5" },
      { id: "gopay", name: "GoPay", icon: SmartphoneIcon, fee: 1440, color: "#00AA13" },
    ],
    va: [
      { id: "bca-va", name: "BCA Virtual Account", icon: Building, fee: 3850, color: "#1E3A8A" },
      { id: "bni-va", name: "BNI Virtual Account", icon: Building, fee: 3700, color: "#F59E0B" },
      { id: "bri-va", name: "BRI Virtual Account", icon: Building, fee: 3700, color: "#DC2626" },
      { id: "mandiri-va", name: "Mandiri Virtual Account", icon: Building, fee: 3700, color: "#059669" },
      { id: "bsi-va", name: "BSI Virtual Account", icon: Building, fee: 3850, color: "#7C3AED" },
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

  const formatTimeForDisplay = () => {
    const hour = formData.hour || "0";
    const minute = formData.minute || "0";
    return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')} WIB`;
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Dapatkan detail layanan yang dipilih
  const getSelectedServicesDetails = () => {
    if (!vendor || !vendor.services) return [];
    
    return formData.selectedServices.map((serviceId: string) => {
      const service = vendor.services.find((s: any) => s.service_id === serviceId);
      const quantity = formData.quantities?.[serviceId] || 1;
      return {
        ...service,
        quantity,
        total: service ? service.price * quantity : 0
      };
    });
  };

  const selectedServicesDetails = getSelectedServicesDetails();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Informasi Pemesanan</span>
            <Button variant="outline" size="sm" onClick={onBack}>
              Ubah
            </Button>
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
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : "Tanggal belum dipilih"} • {formatTimeForDisplay()}
              </p>
            </div>
          </div>

          {/* Detail Layanan */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold">Detail Layanan</h4>
            </div>
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

          {/* Ringkasan Harga */}
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
                <span>
                  {selectedPayment ?
                    `Rp ${PAYMENT_FEES[selectedPayment as keyof typeof PAYMENT_FEES]?.toLocaleString('id-ID') || '0'}` :
                    "0"
                  }
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

      {/* Pilih Metode Pembayaran */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCardIcon className="h-5 w-5" />
              <span>Pilih Metode Pembayaran</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPaymentOptions(!showPaymentOptions)}
            >
              {selectedPayment ? 'Ubah' : 'Pilih'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedPayment ? (
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
            <div className="mb-6 p-6 border rounded-lg bg-white shadow-sm">
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
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Options Modal */}
          <AnimatePresence>
            {showPaymentOptions && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                onClick={() => setShowPaymentOptions(false)}
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="sticky top-0 bg-white border-b px-6 py-4">
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
                      {Object.entries(paymentMethods).map(([category, methods]) => (
                        <div key={category} className="border rounded-lg overflow-hidden">
                          <button
                            type="button"
                            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100"
                            onClick={() => toggleSection(category)}
                          >
                            <span className="font-medium capitalize">{category === 'va' ? 'Virtual Account' : category === 'ewallet' ? 'E-Wallet' : category}</span>
                            {expandedSections[category] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                          <AnimatePresence>
                            {expandedSections[category] && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 space-y-2">
                                  {methods.map((method) => (
                                    <label
                                      key={method.id}
                                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${selectedPayment === method.id ? 'border-primary bg-primary/5' : 'hover:border-primary'}`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <RadioGroupItem value={method.id} id={method.id} />
                                        <div className="flex items-center gap-2">
                                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: method.color }}>
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
                      ))}
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

          <div className="mt-6 pt-6 border-t">
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Estimasi Harga</span>
                <span className="font-bold text-lg">Rp {totalPrice.toLocaleString('id-ID')}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Minimum transaksi Rp75.000
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onBack}
              >
                Kembali
              </Button>
              <Button
                type="button"
                className="flex-1 text-white transition-colors duration-200"
                style={{ backgroundColor: '#7CE0A8' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5CA68A'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7CE0A8'}
                onClick={onConfirm}
                disabled={!selectedPayment || (selectedPayment === "debit-credit" && (!cardData.cardNumber || !cardData.expiryDate || !cardData.cvv)) || isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Bayar Sekarang'
                )}
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