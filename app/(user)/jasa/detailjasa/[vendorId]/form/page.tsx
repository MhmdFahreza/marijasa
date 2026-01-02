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
import { Calendar, User, Receipt, Home, MapPin, Navigation, CreditCard, Wallet, Smartphone, QrCode, Banknote, ChevronDown, ChevronUp, Building, Smartphone as SmartphoneIcon, CreditCard as CreditCardIcon, Check, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { getVendorById, getCategoryFromTags } from "@/app/data/dataVendor";
import { useParams, useRouter } from "next/navigation";
import { LoaderTwo } from "@/app/components/transition/loader";
import { toast } from "sonner";

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

// Fungsi untuk mendapatkan info user dari Gmail (sama seperti di profile)
const getUserInfoFromGmail = (email: string): { name: string; phone: string } => {
  const emailPrefix = email.split('@')[0];
  const capitalizedName = emailPrefix
    .split(/[._-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  const phoneNumber = `08${Math.abs(emailPrefix.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100000000).toString().padStart(9, '0')}`;
  
  return {
    name: capitalizedName,
    phone: phoneNumber
  };
};

export default function VendorFormPage() {
  const params = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState<any>({});
  const [mounted, setMounted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [navigationUrl, setNavigationUrl] = useState<string | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [currentStep, setCurrentStep] = useState<'form' | 'confirmation'>('form');
  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [cardData, setCardData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: ""
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [initialOrderId, setInitialOrderId] = useState<string | null>(null);
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [vendor, setVendor] = useState<any>(null);

  // PERBAIKAN: Fungsi untuk load profile data dengan fallback ke user data
  // gpsLink TIDAK auto-fill, hanya terisi saat klik tombol "Lokasi Saya"
  const loadProfileData = () => {
    // Cek apakah ada userProfile yang tersimpan
    const savedProfile = localStorage.getItem("userProfile");
    
    if (savedProfile) {
      // Jika ada profile tersimpan, gunakan itu (KECUALI gpsLink)
      const profile = JSON.parse(savedProfile);
      setFormData((prev: any) => ({
        ...prev,
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
        // gpsLink sengaja TIDAK di-auto fill, biarkan kosong
        gpsLink: prev.gpsLink || ""
      }));
      return;
    }
    
    // PERBAIKAN: Jika belum ada userProfile, buat dari data login (user dan authData)
    const userData = localStorage.getItem("user");
    const authData = localStorage.getItem("authData");
    
    if (userData) {
      try {
        const parsedUserData = JSON.parse(userData);
        const parsedAuthData = authData ? JSON.parse(authData) : null;
        
        // Generate nama dan nomor telepon dari email (sama seperti di profile)
        const userInfo = getUserInfoFromGmail(parsedUserData.email);
        
        // Buat profile baru
        const newProfile = {
          id: `user-${Date.now()}`,
          name: userInfo.name,
          email: parsedUserData.email,
          phone: userInfo.phone,
          address: "",
          gpsLink: "",
          joinDate: parsedAuthData?.loginTime 
            ? new Date(parsedAuthData.loginTime).toISOString().split('T')[0] 
            : new Date().toISOString().split('T')[0],
          avatar: parsedUserData.avatar || "/avatars/user-avatar.jpg",
        };
        
        // Simpan profile baru ke localStorage untuk sinkronisasi dengan halaman profile
        localStorage.setItem("userProfile", JSON.stringify(newProfile));
        
        // Set form data (gpsLink tetap kosong)
        setFormData((prev: any) => ({
          ...prev,
          name: newProfile.name,
          email: newProfile.email,
          phone: newProfile.phone,
          address: newProfile.address,
          // gpsLink sengaja TIDAK di-auto fill, biarkan kosong
          gpsLink: ""
        }));
        
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  };

  useEffect(() => {
    setMounted(true);
    
    // PERBAIKAN: Cek apakah user sudah login terlebih dahulu
    const authData = localStorage.getItem("authData");
    const userData = localStorage.getItem("user");
    const userToken = localStorage.getItem("userToken");

    if (!authData || !userData || !userToken) {
      toast.error("Anda harus login terlebih dahulu");
      router.push("/login");
      return;
    }
    
    // Load initial profile data
    loadProfileData();

    // Load vendor data
    const vendorId = params.vendorId as string;
    const vendorData = getVendorById(vendorId);
    setVendor(vendorData);

    // Listen untuk profile updates (KECUALI gpsLink - tidak auto update)
    const handleProfileUpdate = (event: CustomEvent) => {
      const updatedProfile = event.detail;
      setFormData((prev: any) => ({
        ...prev,
        name: updatedProfile.name || "",
        phone: updatedProfile.phone || "",
        address: updatedProfile.address || "",
        // gpsLink TIDAK di-update otomatis, hanya via tombol "Lokasi Saya"
      }));
      toast.success("Data profil telah diperbarui!");
    };

    window.addEventListener('profileUpdated', handleProfileUpdate as EventListener);

    // Cleanup listener
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener);
    };
  }, [params.vendorId, router]);

  // Tambahkan effect untuk reload profile data ketika kembali dari halaman lain
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Reload profile data when page becomes visible again
        loadProfileData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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
    const savedProfile = localStorage.getItem("userProfile");
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      if (profile.gpsLink) {
        setFormData({ ...formData, gpsLink: profile.gpsLink });
        toast.success("Lokasi dari profile berhasil dimuat!");
      } else {
        toast.error("Belum ada lokasi tersimpan di profile. Silakan isi di halaman Profile terlebih dahulu.");
      }
    } else {
      toast.error("Belum ada data profile. Silakan isi profile terlebih dahulu.");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi tanggal: tidak boleh memilih tanggal hari ini atau yang sudah lewat
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

    // Buat data pesanan untuk user
    const initialOrderData = {
      id: orderId,
      orderId: orderId,
      vendorName: vendor?.name || "",
      serviceType: getServiceDescription(),
      serviceDate: formData.date ? new Date(formData.date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }) : "",
      serviceTime: formattedTime,
      status: "menunggu pembayaran",
      statusColor: "bg-yellow-100 text-yellow-800",
      totalPrice: servicePrice + SERVICE_FEE,
      vendorAvatar: vendor?.avatar ?? "",
      orderDate: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }) + " - " + new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      paymentMethod: null,
      paymentId: null,
      customerInfo: {
        name: formData.name || "",
        email: formData.email || "",
        phone: formData.phone || "",
        address: formData.address || "",
        gpsLink: formData.gpsLink || ""
      },
      serviceDetails: {
        complaints: [],
        services: [getServiceDescription()],
        repairs: [],
        freon: false,
        installation: false,
        propertyType: formData.propertyType || "",
        date: formData.date || "",
        time: formattedTime,
        budget: ""
      },
      paymentDetails: {
        subtotal: servicePrice,
        minTransaction: 75000,
        serviceFee: SERVICE_FEE,
        transactionFee: 0,
        total: servicePrice + SERVICE_FEE
      },
      orderHistory: [
        {
          status: "Permintaan Dibuat",
          date: new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }) + " - " + new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
          })
        }
      ],
      vendorNotes: ""
    };

    // Simpan pesanan user
    const existingOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');
    localStorage.setItem('userOrders', JSON.stringify([...existingOrders, initialOrderData]));

    // LANGSUNG SIMPAN KE MITRA (sebelum pembayaran)
    const serviceCategory = getCategoryFromTags(vendor?.tags || []);
    const buildServiceDetails = (category: string, formData: any, servicePrice: number) => {
      const selectedServices = formData.selectedServices || [];
      return {
        selectedServices: selectedServices,
        additionalInfo: formData.additionalInfo || {},
        totalPrice: servicePrice
      };
    };

    const serviceDetails = buildServiceDetails(serviceCategory, formData, servicePrice);

    const newOrderForMitra = {
      id: orderId,
      customerName: formData.name || "",
      customerEmail: formData.email || "",
      customerPhone: formData.phone || "",
      customerAddress: formData.address || "",
      gpsLink: formData.gpsLink || "",
      vendorId: vendorId,
      serviceCategory: serviceCategory,
      serviceDetails: serviceDetails,
      workDate: formData.date || new Date().toISOString().split('T')[0],
      workTime: formattedTime,
      additionalNotes: formData.notes || "",
      status: "pending",
      orderDate: new Date().toISOString().split('T')[0],
      paymentStatus: "unpaid"
    };

    const allOrders = JSON.parse(localStorage.getItem('allOrders') || '[]');
    localStorage.setItem('allOrders', JSON.stringify([...allOrders, newOrderForMitra]));

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

    setTimeout(() => {
      // Update pesanan user: status jadi diproses
      const existingOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');
      const updatedOrders = existingOrders.map((order: any) => {
        if (order.id === initialOrderId) {
          const transactionFee = PAYMENT_FEES[selectedPayment as keyof typeof PAYMENT_FEES] || 0;
          const total = calculateTotalPrice();

          return {
            ...order,
            paymentMethod: selectedPayment,
            paymentId: `#${Math.floor(1000000 + Math.random() * 9000000)}`,
            status: "diproses",
            statusColor: "bg-blue-100 text-blue-800",
            totalPrice: total,
            paymentDetails: {
              ...order.paymentDetails,
              transactionFee: transactionFee,
              total: total
            },
            orderHistory: [
              ...order.orderHistory,
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
        return order;
      });

      localStorage.setItem('userOrders', JSON.stringify(updatedOrders));

      // Update pesanan mitra: status jadi in-progress, paymentStatus jadi paid
      const allOrders = JSON.parse(localStorage.getItem('allOrders') || '[]');
      const updatedAllOrders = allOrders.map((order: any) => {
        if (order.id === initialOrderId) {
          return {
            ...order,
            status: "in-progress",
            paymentStatus: "paid"
          };
        }
        return order;
      });

      localStorage.setItem('allOrders', JSON.stringify(updatedAllOrders));

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
      const service = vendor.services.find((s: any) => s.id === serviceId);
      if (service && service.active) {
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
      const service = vendor.services.find((s: any) => s.id === serviceId);
      if (service) {
        const quantity = formData.quantities?.[serviceId] || 1;
        return `${service.name}${quantity > 1 ? ` (${quantity}x)` : ''}`;
      }
      return "";
    }).filter(Boolean).join(", ");

    return serviceNames || "Layanan";
  };

  if (!mounted) {
    return null;
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Vendor Tidak Ditemukan</h1>
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
                      href={`/jasa/detailjasa/${vendor.id}`}
                      className="cursor-pointer"
                      onClick={(e) => handleBreadcrumbClick(e, `/jasa/detailjasa/${vendor.id}`)}
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
                Pesanan Anda telah berhasil diajukan dan tersimpan di riwayat pemesanan.
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

function OrderForm({
  vendor,
  formData,
  setFormData,
  handleFormSubmit,
  handleCancel,
  handleUseProfileLocation,
  gettingLocation
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

  const activeServices = vendor.services?.filter((s: any) => s.active) || [];

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
              <p className="text-sm text-muted-foreground">{vendor.tags.join(" • ")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Form Pemesanan Layanan</CardTitle>
          <CardDescription>
            Lengkapi formulir di bawah untuk memesan layanan {vendor.tags[0]}
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
                    value={formData.name || ""}
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
                    value={formData.phone || ""}
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
                  Tempelkan link lokasi dari Google Maps atau klik tombol "Lokasi Saya" untuk otomatis mengisi lokasi yang tersimpan di Profile Anda
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Alamat Lengkap *</Label>
                <Textarea
                  id="address"
                  placeholder="Masukkan alamat lengkap (jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota)"
                  rows={3}
                  required
                  value={formData.address || ""}
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
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">
                    Vendor belum menambahkan layanan aktif.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeServices.map((service: any) => (
                    <div key={service.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <Checkbox
                            id={service.id}
                            checked={(formData.selectedServices || []).includes(service.id)}
                            onCheckedChange={(checked) => {
                              const current = formData.selectedServices || [];
                              if (checked) {
                                setFormData({ 
                                  ...formData, 
                                  selectedServices: [...current, service.id],
                                  quantities: { ...(formData.quantities || {}), [service.id]: 1 }
                                });
                              } else {
                                const newQuantities = { ...(formData.quantities || {}) };
                                delete newQuantities[service.id];
                                setFormData({ 
                                  ...formData, 
                                  selectedServices: current.filter((i: string) => i !== service.id),
                                  quantities: newQuantities
                                });
                              }
                            }}
                          />
                          <div className="flex-1">
                            <Label htmlFor={service.id} className="font-medium cursor-pointer">
                              {service.name}
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              {service.description}
                            </p>
                            {service.estimatedTime && (
                              <p className="text-xs text-muted-foreground mt-1">
                                ⏱️ Estimasi: {service.estimatedTime}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-semibold text-primary">
                            Rp {service.price.toLocaleString('id-ID')}
                            {service.priceType === 'hourly' && '/jam'}
                            {service.priceType === 'unit' && '/unit'}
                          </div>
                          
                          {(formData.selectedServices || []).includes(service.id) && (
                            <div className="mt-2">
                              <Label htmlFor={`qty-${service.id}`} className="text-xs">Jumlah:</Label>
                              <Input
                                id={`qty-${service.id}`}
                                type="number"
                                min="1"
                                defaultValue="1"
                                className="w-20 mt-1"
                                onChange={(e) => {
                                  const qty = parseInt(e.target.value) || 1;
                                  setFormData({
                                    ...formData,
                                    quantities: {
                                      ...(formData.quantities || {}),
                                      [service.id]: qty
                                    }
                                  });
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeServices.length > 0 && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Estimasi Layanan:</span>
                    <span className="text-xl font-bold text-primary">
                      Rp {(() => {
                        const selectedServices = formData.selectedServices || [];
                        let total = 0;
                        selectedServices.forEach((serviceId: string) => {
                          const service = activeServices.find((s: any) => s.id === serviceId);
                          if (service) {
                            const quantity = formData.quantities?.[serviceId] || 1;
                            total += service.price * quantity;
                          }
                        });
                        return total.toLocaleString('id-ID');
                      })()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    * Harga belum termasuk biaya layanan dan biaya transaksi
                  </p>
                </div>
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
                  <p className="text-xs text-muted-foreground">
                    Hanya bisa memilih tanggal mulai besok dan seterusnya
                  </p>
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
                  <p className="text-xs text-muted-foreground">
                    Jam (00-23) : Menit (00-59). Contoh: 9:5 (untuk 09:05), 14:30
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan Tambahan</Label>
              <Textarea
                id="notes"
                placeholder="Informasi tambahan yang perlu diketahui vendor..."
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
  getServiceDescription
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

  return (
    <div className="space-y-6">
      {/* Informasi Pemesanan */}
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
              {formData.gpsLink && (
                <a
                  href={formData.gpsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline inline-flex items-center gap-1 mt-1"
                >
                  <Navigation className="h-3 w-3" />
                  Lihat di Google Maps
                </a>
              )}
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
              <Button variant="outline" size="sm" onClick={onBack}>
                Ubah
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{getServiceDescription()}</p>
                  <p className="text-sm text-muted-foreground">{vendor.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">Rp {servicePrice.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ringkasan Harga */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Ringkasan Harga</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
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
                <p className="text-xs text-muted-foreground mt-1">
                  * Biaya transaksi tidak bisa dikembalikan
                </p>
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
                      {/* E-Wallet */}
                      <div className="border rounded-lg overflow-hidden">
                        <button
                          type="button"
                          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100"
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
                          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100"
                          onClick={() => toggleSection('va')}
                        >
                          <div className="flex items-center gap-3">
                            <Building className="h-5 w-5" />
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
                          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100"
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
                          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100"
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
                          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100"
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