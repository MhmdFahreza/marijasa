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
import { Calendar, User, Receipt, Home, MapPin, Navigation, CreditCard, Wallet, Smartphone, QrCode, Banknote, ChevronDown, ChevronUp, Building, Smartphone as SmartphoneIcon, CreditCard as CreditCardIcon, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Vendors } from "@/app/data/dataVendor";
import { useParams, useRouter } from "next/navigation";
import { LoaderTwo } from "@/app/components/transition/loader";
import { toast } from "sonner";

const PRICES = {
  ac: {
    instalasi: { base: 500000, label: "Instalasi AC Baru" },
    service: { base: 150000, label: "Perbaikan AC" },
    cuci: { base: 100000, label: "Cuci AC" },
    bongkar: { base: 300000, label: "Bongkar Pasang" }
  },
  electrical: {
    "Instalasi Baru": 750000,
    "Perbaikan": 200000,
    "Penambahan Titik Listrik": 150000,
    "Pemasangan Panel": 500000,
    "Ganti MCB": 100000
  },
  cleaning: {
    general: { base: 300000, label: "Pembersihan Rutin" },
    deep: { base: 500000, label: "Pembersihan Mendalam" },
    "renovasi": { base: 800000, label: "Pembersihan Renovasi" },
    "pindahan": { base: 800000, label: "Pindahan" },
  },
  plumbing: {
    "Instalasi Pipa": 250000,
    "Perbaikan Kebocoran": 200000,
    "Pelancaran Saluran Mampet": 600000,
    "Pemasangan Sanitary Fixture": 400000,
    "Instalasi water heater": 350000
  },
  sedotWC: {
    "Penyedotan Septictank": { base: 250000, label: "Penyedotan Septictank" },
    "Inspeksi": { base: 200000, label: "Inspeksi" },
    "Pelancaran Saluran WC": { base: 200000, label: "Pelancaran Saluran WC" },
  },
  garden: {
    "Pembuatan Taman Baru": 2000000,
    "Perawatan Rutin": 300000,
    "Pemangkasan": 150000,
    "Perawatan Rumput": 1500000,
    "Pengendalian Hama Tanaman": 3000000
  },
  furniture: {
    "Pembuatan Furnitur": 3000000,
    "Restorasi Furnitur Lama": 5000000,
    "Bongkar Pasang": 1500000,
    "Produksi Furnitur Dekoratif": 2000000,
    "Pemeliharaan Furnitur": 4000000,
  }
};

// Biaya transaksi untuk setiap metode pembayaran
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

// Biaya layanan tetap
const SERVICE_FEE = 10000;

function getServiceCategory(tags: string[]): string {
  const firstTag = tags[0]?.toLowerCase() || "";

  if (firstTag.includes("ac")) return "ac";
  if (firstTag.includes("listrik") || firstTag.includes("electrical")) return "electrical";
  if (firstTag.includes("pembersihan") || firstTag.includes("cleaning")) return "cleaning";
  if (firstTag.includes("ledeng") || firstTag.includes("pipa") || firstTag.includes("plumbing")) return "plumbing";
  if (firstTag.includes("sedot")) return "sedot-wc";
  if (firstTag.includes("kebun") || firstTag.includes("taman") || firstTag.includes("garden")) return "taman";
  if (firstTag.includes("mebel") || firstTag.includes("furnitur") || firstTag.includes("furniture")) return "furniture";

  return "general";
}

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

  // Load user profile saat component mount
  useEffect(() => {
    setMounted(true);

    // Load profile data dari localStorage
    const savedProfile = localStorage.getItem("userProfile");
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      // Auto-fill form dengan data dari profile
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
        gpsLink: profile.gpsLink || ""
      });
    }
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

  // Handler untuk menggunakan lokasi dari profile
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
    
    // Validasi waktu
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
    
    // Format waktu menjadi HH:MM
    const formattedTime = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    
    // Hitung harga service
    const servicePrice = calculateServicePrice();
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    setInitialOrderId(orderId);
    
    const vendorId = params.vendorId as string;
    const vendor = Vendors.find((v) => v.id === vendorId);
    
    // Buat data pesanan awal
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

    // Simpan ke localStorage
    const existingOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');
    localStorage.setItem('userOrders', JSON.stringify([...existingOrders, initialOrderData]));

    // Tampilkan popup sukses
    setShowSuccessModal(true);
    
    // Setelah 2 detik, pindah ke konfirmasi
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

    // Validasi untuk kartu debit/kredit
    if (selectedPayment === "debit-credit") {
      if (!cardData.cardNumber || !cardData.expiryDate || !cardData.cvv) {
        toast.error("Silakan lengkapi data kartu debit/kredit.");
        return;
      }

      // Validasi format nomor kartu (minimal 12 digit)
      const cleanedCardNumber = cardData.cardNumber.replace(/\s/g, '');
      if (cleanedCardNumber.length < 12 || !/^\d+$/.test(cleanedCardNumber)) {
        toast.error("Nomor kartu tidak valid. Harus minimal 12 digit angka.");
        return;
      }

      // Validasi format tanggal kadaluarsa (MM/YY)
      if (!/^\d{2}\/\d{2}$/.test(cardData.expiryDate)) {
        toast.error("Format masa berlaku tidak valid. Gunakan format MM/YY (contoh: 01/24).");
        return;
      }

      // Validasi CVV (3-4 digit)
      if (!/^\d{3,4}$/.test(cardData.cvv)) {
        toast.error("CVV tidak valid. Harus 3 atau 4 digit angka.");
        return;
      }
    }

    // Update data pesanan di localStorage
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

    toast.success("Pembayaran berhasil! Redirect ke riwayat pemesanan...");

    // Redirect ke riwayat pemesanan setelah delay
    setTimeout(() => {
      router.push('/riwayat_pemesanan');
    }, 1500);
  };

  const calculateServicePrice = () => {
    const vendorId = params.vendorId as string;
    const vendor = Vendors.find((v) => v.id === vendorId);
    if (!vendor) return 0;

    const serviceCategory = getServiceCategory(vendor.tags);

    switch (serviceCategory) {
      case "ac":
        const acServices = formData.acServices || [];
        let acTotal = 0;
        acServices.forEach((service: string) => {
          if (service && PRICES.ac[service as keyof typeof PRICES.ac]) {
            const servicePrice = PRICES.ac[service as keyof typeof PRICES.ac].base;
            const count = parseInt(formData.acCount) || 1;
            acTotal += servicePrice * count;
          }
        });
        return acTotal;
      
      case "electrical":
        const works = formData.electricalWork || [];
        return works.reduce((sum: number, work: string) => {
          return sum + (PRICES.electrical[work as keyof typeof PRICES.electrical] || 0);
        }, 0);
      
      case "cleaning":
        const cleaningServices = formData.cleaningServices || [];
        let cleaningTotal = 0;
        cleaningServices.forEach((service: string) => {
          if (service && PRICES.cleaning[service as keyof typeof PRICES.cleaning]) {
            cleaningTotal += PRICES.cleaning[service as keyof typeof PRICES.cleaning]?.base || 0;
          }
        });
        return cleaningTotal;
      
      case "plumbing":
        const plumbingIssues = formData.plumbingIssues || [];
        return plumbingIssues.reduce((sum: number, issue: string) => {
          return sum + (PRICES.plumbing[issue as keyof typeof PRICES.plumbing] || 0);
        }, 0);
      
      case "sedot-wc":
        const sedotWCServices = formData.sedotWCServices || [];
        let sedotWCTotal = 0;
        sedotWCServices.forEach((service: string) => {
          if (service && PRICES.sedotWC[service as keyof typeof PRICES.sedotWC]) {
            sedotWCTotal += PRICES.sedotWC[service as keyof typeof PRICES.sedotWC].base;
          }
        });
        return sedotWCTotal;
      
      case "taman":
        const gardenServices = formData.gardenServices || [];
        return gardenServices.reduce((sum: number, service: string) => {
          return sum + (PRICES.garden[service as keyof typeof PRICES.garden] || 0);
        }, 0);
      
      case "furniture":
        const furnitureTypes = formData.furnitureTypes || [];
        return furnitureTypes.reduce((sum: number, type: string) => {
          return sum + (PRICES.furniture[type as keyof typeof PRICES.furniture] || 0);
        }, 0);
      
      default:
        return formData.totalPrice || 0;
    }
  };

  const calculateTotalPrice = () => {
    const servicePrice = calculateServicePrice();
    const paymentFee = PAYMENT_FEES[selectedPayment as keyof typeof PAYMENT_FEES] || 0;
    return servicePrice + SERVICE_FEE + paymentFee;
  };

  // Format nomor kartu dengan spasi setiap 4 digit
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '').replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted.substring(0, 19); // Maksimal 16 digit + 3 spasi
  };

  // Format tanggal kadaluarsa (MM/YY)
  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    return cleaned;
  };

  // Helper function untuk mendapatkan deskripsi layanan
  const getServiceDescription = () => {
    const vendorId = params.vendorId as string;
    const vendor = Vendors.find((v) => v.id === vendorId);
    if (!vendor) return "Layanan";
    
    const serviceCategory = getServiceCategory(vendor.tags);
    
    if (serviceCategory === "ac") {
      const acServices = formData.acServices || [];
      if (acServices.length === 0) return "Layanan AC";
      
      const serviceNames = acServices.map((service: string) => {
        const serviceType = PRICES.ac[service as keyof typeof PRICES.ac]?.label || "Layanan AC";
        const acType = formData.acType || "";
        const acPk = formData.acPk || "";
        return `${serviceType} ${acType} ${acPk} PK`;
      }).join(", ");
      
      const acCount = formData.acCount || "1";
      return `${serviceNames} (${acCount} unit)`;
    }
    
    if (serviceCategory === "cleaning") {
      const cleaningServices = formData.cleaningServices || [];
      if (cleaningServices.length === 0) return "Layanan Pembersihan";
      
      const serviceNames = cleaningServices.map((service: string) => {
        return PRICES.cleaning[service as keyof typeof PRICES.cleaning]?.label || service;
      }).join(", ");
      
      return `${serviceNames}`;
    }

    if (serviceCategory === "sedot-wc") {
      const sedotWCServices = formData.sedotWCServices || [];
      if (sedotWCServices.length === 0) return "Layanan Sedot WC";
      
      const serviceNames = sedotWCServices.map((service: string) => {
        return PRICES.sedotWC[service as keyof typeof PRICES.sedotWC]?.label || service;
      }).join(", ");
      
      return `${serviceNames}`;
    }
    
    return vendor.tags[0] || "Layanan";
  };

  if (!mounted) {
    return null;
  }

  const vendorId = params.vendorId as string;
  const vendor = Vendors.find((v) => v.id === vendorId);

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

  const serviceCategory = getServiceCategory(vendor.tags);
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
            serviceCategory={serviceCategory}
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
            serviceCategory={serviceCategory}
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
          />
        )}
      </motion.main>

      {/* Modal Sukses */}
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
  serviceCategory,
  formData,
  setFormData,
  handleFormSubmit,
  handleCancel,
  handleUseProfileLocation,
  gettingLocation
}: any) {
  
  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Batasi input hanya angka dan maksimal 2 digit
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
    // Batasi input hanya angka dan maksimal 2 digit
    value = value.replace(/\D/g, '');
    if (value === '') {
      setFormData({ ...formData, minute: '' });
      return;
    }
    
    let minute = parseInt(value, 10);
    if (minute > 59) {
      minute = 59;
    }
    
    // Simpan tanpa padding - biarkan fleksibel
    setFormData({ ...formData, minute: minute.toString() });
  };

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

            <ServiceSpecificFormWithPrice
              category={serviceCategory}
              formData={formData}
              setFormData={setFormData}
            />

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
  serviceCategory,
  servicePrice,
  selectedPayment,
  setSelectedPayment,
  cardData,
  setCardData,
  formatCardNumber,
  formatExpiryDate,
  totalPrice,
  onBack,
  onConfirm
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

  const getServiceDescription = () => {
    if (serviceCategory === "ac") {
      const acServices = formData.acServices || [];
      if (acServices.length === 0) return "Layanan AC";
      
      const serviceNames = acServices.map((service: string) => {
        const serviceType = PRICES.ac[service as keyof typeof PRICES.ac]?.label || "Layanan AC";
        const acType = formData.acType || "";
        const acPk = formData.acPk || "";
        return `${serviceType} ${acType} ${acPk} PK`;
      }).join(", ");
      
      const acCount = formData.acCount || "1";
      return `${serviceNames} (${acCount} unit)`;
    }
    
    if (serviceCategory === "cleaning") {
      const cleaningServices = formData.cleaningServices || [];
      if (cleaningServices.length === 0) return "Layanan Pembersihan";
      
      const serviceNames = cleaningServices.map((service: string) => {
        return PRICES.cleaning[service as keyof typeof PRICES.cleaning]?.label || service;
      }).join(", ");
      
      return `${serviceNames}`;
    }

    if (serviceCategory === "sedot-wc") {
      const sedotWCServices = formData.sedotWCServices || [];
      if (sedotWCServices.length === 0) return "Layanan Sedot WC";
      
      const serviceNames = sedotWCServices.map((service: string) => {
        return PRICES.sedotWC[service as keyof typeof PRICES.sedotWC]?.label || service;
      }).join(", ");
      
      return `${serviceNames}`;
    }
    
    return vendor.tags[0];
  };

  // Format waktu untuk display - dengan padding nol
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
              <p className="text-muted-foreground">{formData.email || "dinosaur123@gmail.com"}</p>
              <p className="text-muted-foreground">{formData.phone || "08838553739"}</p>
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
              <CreditCard className="h-5 w-5" />
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
                disabled={!selectedPayment || (selectedPayment === "debit-credit" && (!cardData.cardNumber || !cardData.expiryDate || !cardData.cvv))}
              >
                Bayar Sekarang
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

// Komponen-komponen ServiceSpecificFormWithPrice dan lainnya...
function ServiceSpecificFormWithPrice({ category, formData, setFormData }: { category: string; formData: any; setFormData: (data: any) => void }) {
  switch (category) {
    case "ac":
      return <ACServiceForm formData={formData} setFormData={setFormData} />;
    case "electrical":
      return <ElectricalServiceForm formData={formData} setFormData={setFormData} />;
    case "cleaning":
      return <CleaningServiceForm formData={formData} setFormData={setFormData} />;
    case "plumbing":
      return <PlumbingServiceForm formData={formData} setFormData={setFormData} />;
    case "sedot-wc":
      return <SedotWCServiceForm formData={formData} setFormData={setFormData} />;
    case "taman":
      return <GardenServiceForm formData={formData} setFormData={setFormData} />;
    case "furniture":
      return <FurnitureServiceForm formData={formData} setFormData={setFormData} />;
    default:
      return <GeneralServiceForm formData={formData} setFormData={setFormData} />;
  }
}

function PriceSummary({ totalPrice }: { totalPrice: number }) {
  return (
    <Card className="bg-muted/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Ringkasan Harga
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-2xl font-bold">
            <span>Total Estimasi:</span>
            <span className="text-primary">
              Rp {totalPrice.toLocaleString('id-ID')}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            * Harga dapat berubah setelah survey lokasi
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ACServiceForm({ formData, setFormData }: any) {
  const totalPrice = useMemo(() => {
    const acServices = formData.acServices || [];
    let total = 0;
    acServices.forEach((service: string) => {
      if (service && PRICES.ac[service as keyof typeof PRICES.ac]) {
        const servicePrice = PRICES.ac[service as keyof typeof PRICES.ac].base;
        const count = parseInt(formData.acCount) || 1;
        total += servicePrice * count;
      }
    });
    return total;
  }, [formData.acServices, formData.acCount]);

  const handleServiceChange = (serviceId: string, checked: boolean) => {
    const current = formData.acServices || [];
    if (checked) {
      setFormData({ ...formData, acServices: [...current, serviceId] });
    } else {
      setFormData({ ...formData, acServices: current.filter((i: string) => i !== serviceId) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Detail Layanan AC</h3>
        <div className="space-y-2">
          <Label>Jenis Layanan *</Label>
          <div className="space-y-2">
            {Object.entries(PRICES.ac).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={(formData.acServices || []).includes(key)}
                    onCheckedChange={(checked) => handleServiceChange(key, checked as boolean)}
                  />
                  <Label htmlFor={key} className="font-normal cursor-pointer">
                    {value.label}
                  </Label>
                </div>
                <span className="text-sm font-semibold text-primary">
                  Rp {value.base.toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="acType">Tipe AC *</Label>
          <Select onValueChange={(value) => setFormData({ ...formData, acType: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih tipe AC" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="split">Split</SelectItem>
              <SelectItem value="cassette">Cassette</SelectItem>
              <SelectItem value="standing">Standing/Floor</SelectItem>
              <SelectItem value="central">Central</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="acCount">Jumlah Unit *</Label>
          <Input
            id="acCount"
            type="number"
            min="1"
            defaultValue="1"
            placeholder="Jumlah unit AC"
            onChange={(e) => setFormData({ ...formData, acCount: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="acPk">Kapasitas (PK) *</Label>
          <Select onValueChange={(value) => setFormData({ ...formData, acPk: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih kapasitas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.5">0.5 PK</SelectItem>
              <SelectItem value="0.75">0.75 PK</SelectItem>
              <SelectItem value="1">1 PK</SelectItem>
              <SelectItem value="1.5">1.5 PK</SelectItem>
              <SelectItem value="2">2 PK</SelectItem>
              <SelectItem value="2.5">2.5 PK</SelectItem>
              <SelectItem value="3">3 PK</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {totalPrice > 0 && <PriceSummary totalPrice={totalPrice} />}
    </div>
  );
}

function ElectricalServiceForm({ formData, setFormData }: any) {
  const totalPrice = useMemo(() => {
    const works = formData.electricalWork || [];
    return works.reduce((sum: number, work: string) => {
      return sum + (PRICES.electrical[work as keyof typeof PRICES.electrical] || 0);
    }, 0);
  }, [formData.electricalWork]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Detail Layanan Listrik</h3>
        <div className="space-y-2">
          <Label>Jenis Pekerjaan *</Label>
          <div className="space-y-2">
            {Object.entries(PRICES.electrical).map(([item, price]) => (
              <div key={item} className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={item.toLowerCase().replace(/\s/g, "-")}
                    checked={(formData.electricalWork || []).includes(item)}
                    onCheckedChange={(checked) => {
                      const current = formData.electricalWork || [];
                      if (checked) {
                        setFormData({ ...formData, electricalWork: [...current, item] });
                      } else {
                        setFormData({ ...formData, electricalWork: current.filter((i: string) => i !== item) });
                      }
                    }}
                  />
                  <Label htmlFor={item.toLowerCase().replace(/\s/g, "-")} className="font-normal cursor-pointer">
                    {item}
                  </Label>
                </div>
                <span className="text-sm font-semibold text-primary">
                  Rp {price.toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="buildingType">Tipe Bangunan *</Label>
          <Select onValueChange={(value) => setFormData({ ...formData, buildingType: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih tipe bangunan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rumah">Rumah Tinggal</SelectItem>
              <SelectItem value="ruko">Ruko</SelectItem>
              <SelectItem value="kantor">Kantor</SelectItem>
              <SelectItem value="gudang">Gudang</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="powerCapacity">Daya Listrik Rumah *</Label>
          <Select onValueChange={(value) => setFormData({ ...formData, powerCapacity: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih daya" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="900">900 VA</SelectItem>
              <SelectItem value="1300">1300 VA</SelectItem>
              <SelectItem value="2200">2200 VA</SelectItem>
              <SelectItem value="3500">3500 VA</SelectItem>
              <SelectItem value="5500">5500 VA</SelectItem>
              <SelectItem value="7700">7700 VA</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {totalPrice > 0 && <PriceSummary totalPrice={totalPrice} />}
    </div>
  );
}

function CleaningServiceForm({ formData, setFormData }: any) {
  const totalPrice = useMemo(() => {
    const cleaningServices = formData.cleaningServices || [];
    let total = 0;
    cleaningServices.forEach((service: string) => {
      if (service && PRICES.cleaning[service as keyof typeof PRICES.cleaning]) {
        total += PRICES.cleaning[service as keyof typeof PRICES.cleaning]?.base || 0;
      }
    });
    return total;
  }, [formData.cleaningServices]);

  const handleServiceChange = (serviceId: string, checked: boolean) => {
    const current = formData.cleaningServices || [];
    if (checked) {
      setFormData({ ...formData, cleaningServices: [...current, serviceId] });
    } else {
      setFormData({ ...formData, cleaningServices: current.filter((i: string) => i !== serviceId) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Detail Layanan Pembersihan</h3>
        <div className="space-y-2">
          <Label>Jenis Layanan *</Label>
          <div className="space-y-2">
            {Object.entries(PRICES.cleaning).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`cleaning-${key}`}
                    checked={(formData.cleaningServices || []).includes(key)}
                    onCheckedChange={(checked) => handleServiceChange(key, checked as boolean)}
                  />
                  <Label htmlFor={`cleaning-${key}`} className="font-normal cursor-pointer">
                    {value.label}
                  </Label>
                </div>
                <span className="text-sm font-semibold text-primary">
                  Rp {value.base.toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="propertyType">Tipe Properti *</Label>
          <Select onValueChange={(value) => setFormData({ ...formData, propertyType: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih tipe properti" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apartment">Apartemen</SelectItem>
              <SelectItem value="house">Rumah</SelectItem>
              <SelectItem value="office">Kantor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="areaSize">Luas Area (m²) *</Label>
          <Input
            id="areaSize"
            type="number"
            min="1"
            placeholder="Contoh: 50"
            onChange={(e) => setFormData({ ...formData, areaSize: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rooms">Jumlah Ruangan *</Label>
          <Input
            id="rooms"
            type="number"
            placeholder="Jumlah ruangan"
            onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
          />
        </div>
      </div>

      {totalPrice > 0 && <PriceSummary totalPrice={totalPrice} />}
    </div>
  );
}

function PlumbingServiceForm({ formData, setFormData }: any) {
  const totalPrice = useMemo(() => {
    const issues = formData.plumbingIssues || [];
    return issues.reduce((sum: number, issue: string) => {
      return sum + (PRICES.plumbing[issue as keyof typeof PRICES.plumbing] || 0);
    }, 0);
  }, [formData.plumbingIssues]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Detail Layanan Ledeng/Pipa</h3>
        <div className="space-y-2">
          <Label>Jenis Masalah *</Label>
          <div className="space-y-2">
            {Object.entries(PRICES.plumbing).map(([item, price]) => (
              <div key={item} className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={item.toLowerCase().replace(/\s/g, "-")}
                    checked={(formData.plumbingIssues || []).includes(item)}
                    onCheckedChange={(checked) => {
                      const current = formData.plumbingIssues || [];
                      if (checked) {
                        setFormData({ ...formData, plumbingIssues: [...current, item] });
                      } else {
                        setFormData({ ...formData, plumbingIssues: current.filter((i: string) => i !== item) });
                      }
                    }}
                  />
                  <Label htmlFor={item.toLowerCase().replace(/\s/g, "-")} className="font-normal cursor-pointer">
                    {item}
                  </Label>
                </div>
                <span className="text-sm font-semibold text-primary">
                  Rp {price.toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="urgency">Tingkat Urgensi *</Label>
          <Select onValueChange={(value) => setFormData({ ...formData, urgency: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih urgensi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="emergency">Darurat (dalam 24 jam)</SelectItem>
              <SelectItem value="urgent">Mendesak (1-2 hari)</SelectItem>
              <SelectItem value="normal">Normal (3-5 hari)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {totalPrice > 0 && <PriceSummary totalPrice={totalPrice} />}
    </div>
  );
}

function SedotWCServiceForm({ formData, setFormData }: any) {
  const totalPrice = useMemo(() => {
    const services = formData.sedotWCServices || [];
    let total = 0;
    services.forEach((service: string) => {
      if (service && PRICES.sedotWC[service as keyof typeof PRICES.sedotWC]) {
        total += PRICES.sedotWC[service as keyof typeof PRICES.sedotWC].base;
      }
    });
    return total;
  }, [formData.sedotWCServices]);

  const handleServiceChange = (serviceId: string, checked: boolean) => {
    const current = formData.sedotWCServices || [];
    if (checked) {
      setFormData({ ...formData, sedotWCServices: [...current, serviceId] });
    } else {
      setFormData({ ...formData, sedotWCServices: current.filter((i: string) => i !== serviceId) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Detail Layanan Sedot WC</h3>
        <div className="space-y-2">
          <Label>Jenis Layanan *</Label>
          <div className="space-y-2">
            {Object.entries(PRICES.sedotWC).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`sedot-wc-${key}`}
                    checked={(formData.sedotWCServices || []).includes(key)}
                    onCheckedChange={(checked) => handleServiceChange(key, checked as boolean)}
                  />
                  <Label htmlFor={`sedot-wc-${key}`} className="font-normal cursor-pointer">
                    {value.label}
                  </Label>
                </div>
                <span className="text-sm font-semibold text-primary">
                  Rp {value.base.toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {totalPrice > 0 && <PriceSummary totalPrice={totalPrice} />}
    </div>
  );
}

function GardenServiceForm({ formData, setFormData }: any) {
  const totalPrice = useMemo(() => {
    const services = formData.gardenServices || [];
    return services.reduce((sum: number, service: string) => {
      return sum + (PRICES.garden[service as keyof typeof PRICES.garden] || 0);
    }, 0);
  }, [formData.gardenServices]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Detail Layanan Taman</h3>
        <div className="space-y-2">
          <Label>Jenis Layanan *</Label>
          <div className="space-y-2">
            {Object.entries(PRICES.garden).map(([item, price]) => (
              <div key={item} className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={item.toLowerCase().replace(/\s/g, "-")}
                    checked={(formData.gardenServices || []).includes(item)}
                    onCheckedChange={(checked) => {
                      const current = formData.gardenServices || [];
                      if (checked) {
                        setFormData({ ...formData, gardenServices: [...current, item] });
                      } else {
                        setFormData({ ...formData, gardenServices: current.filter((i: string) => i !== item) });
                      }
                    }}
                  />
                  <Label htmlFor={item.toLowerCase().replace(/\s/g, "-")} className="font-normal cursor-pointer">
                    {item}
                  </Label>
                </div>
                <span className="text-sm font-semibold text-primary">
                  Rp {price.toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gardenSize">Luas Taman (m²) *</Label>
          <Input
            id="gardenSize"
            type="number"
            placeholder="Luas area taman"
            onChange={(e) => setFormData({ ...formData, gardenSize: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gardenStyle">Gaya Taman *</Label>
          <Select onValueChange={(value) => setFormData({ ...formData, gardenStyle: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih gaya taman" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minimalis">Minimalis</SelectItem>
              <SelectItem value="tropis">Tropis</SelectItem>
              <SelectItem value="modern">Modern</SelectItem>
              <SelectItem value="natural">Natural</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {totalPrice > 0 && <PriceSummary totalPrice={totalPrice} />}
    </div>
  );
}

function FurnitureServiceForm({ formData, setFormData }: any) {
  const totalPrice = useMemo(() => {
    const types = formData.furnitureTypes || [];
    return types.reduce((sum: number, type: string) => {
      return sum + (PRICES.furniture[type as keyof typeof PRICES.furniture] || 0);
    }, 0);
  }, [formData.furnitureTypes]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Detail Pesanan Furniture</h3>
        <div className="space-y-2">
          <Label>Jenis Furniture *</Label>
          <div className="space-y-2">
            {Object.entries(PRICES.furniture).map(([item, price]) => (
              <div key={item} className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={item.toLowerCase().replace(/\s/g, "-")}
                    checked={(formData.furnitureTypes || []).includes(item)}
                    onCheckedChange={(checked) => {
                      const current = formData.furnitureTypes || [];
                      if (checked) {
                        setFormData({ ...formData, furnitureTypes: [...current, item] });
                      } else {
                        setFormData({ ...formData, furnitureTypes: current.filter((i: string) => i !== item) });
                      }
                    }}
                  />
                  <Label htmlFor={item.toLowerCase().replace(/\s/g, "-")} className="font-normal cursor-pointer">
                    {item}
                  </Label>
                </div>
                <span className="text-sm font-semibold text-primary">
                  Rp {price.toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="material">Material Utama *</Label>
          <Select onValueChange={(value) => setFormData({ ...formData, material: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih material" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kayu-jati">Kayu Jati</SelectItem>
              <SelectItem value="kayu-mahoni">Kayu Mahoni</SelectItem>
              <SelectItem value="mdf">MDF</SelectItem>
              <SelectItem value="multiplek">Multiplek</SelectItem>
              <SelectItem value="hpl">HPL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="finishing">Finishing *</Label>
          <Select onValueChange={(value) => setFormData({ ...formData, finishing: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih finishing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="duco">Duco</SelectItem>
              <SelectItem value="natural">Natural/Politur</SelectItem>
              <SelectItem value="hpl">HPL</SelectItem>
              <SelectItem value="melamine">Melamine</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dimensions">Ukuran/Dimensi</Label>
          <Textarea
            id="dimensions"
            placeholder="Contoh: Lemari 200cm x 60cm x 180cm"
            rows={2}
            onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
          />
        </div>
      </div>

      {totalPrice > 0 && <PriceSummary totalPrice={totalPrice} />}
    </div>
  );
}

function GeneralServiceForm({ formData, setFormData }: any) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Detail Layanan</h3>
      <div className="space-y-2">
        <Label htmlFor="serviceDescription">Deskripsi Pekerjaan *</Label>
        <Textarea
          id="serviceDescription"
          placeholder="Jelaskan detail pekerjaan yang dibutuhkan..."
          rows={5}
          required
          onChange={(e) => setFormData({ ...formData, serviceDescription: e.target.value })}
        />
      </div>

      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Untuk estimasi harga yang akurat, kami akan menghubungi Anda setelah form dikirim.
        </p>
      </div>
    </div>
  );
}