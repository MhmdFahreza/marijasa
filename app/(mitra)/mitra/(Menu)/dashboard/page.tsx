"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage
} from "@/app/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  CheckCircle,
  Clock,
  Download,
  CreditCard,
  Banknote,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  ChevronRight,
  RefreshCw,
  Plus,
  X,
  Info,
  Star,
  Lock
} from 'lucide-react';
import { Separator } from "@/app/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/app/components/ui/dropdown-menu";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/app/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Skeleton } from "@/app/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";

// Data dummy untuk metode pembayaran
const paymentMethods = [
  { id: "bca", name: "BCA", type: "bank", accountNumber: "1234567890", accountName: "John Doe" },
  { id: "mandiri", name: "Mandiri", type: "bank", accountNumber: "0987654321", accountName: "John Doe" },
  { id: "bri", name: "BRI", type: "bank", accountNumber: "1122334455", accountName: "John Doe" },
  { id: "gopay", name: "GoPay", type: "ewallet", accountNumber: "081234567890", accountName: "John Doe" },
  { id: "ovo", name: "OVO", type: "ewallet", accountNumber: "082345678901", accountName: "John Doe" },
  { id: "dana", name: "Dana", type: "ewallet", accountNumber: "083456789012", accountName: "John Doe" }
];

// Komponen WithdrawDialog
const WithdrawDialog = ({
  open,
  onOpenChange,
  balance,
  onWithdraw,
  loading
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance: number;
  onWithdraw: (amount: number, method: string) => void;
  loading: boolean;
}) => {
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");

  const maxWithdrawal = Math.floor(balance * 0.9);

  const handleWithdraw = () => {
    if (!withdrawAmount || !selectedMethod) {
      alert('Harap isi jumlah dan pilih metode penarikan');
      return;
    }

    const amount = parseInt(withdrawAmount.replace(/\D/g, ''));
    if (amount > balance) {
      alert('Jumlah penarikan melebihi saldo tersedia');
      return;
    }

    if (amount < 50000) {
      alert('Minimum penarikan adalah Rp 50.000');
      return;
    }

    onWithdraw(amount, selectedMethod);
  };

  const resetForm = () => {
    setWithdrawAmount("");
    setSelectedMethod("");
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetForm();
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg">Tarik Saldo</DialogTitle>
          <DialogDescription className="text-sm">
            Tarik saldo Anda ke rekening bank atau e-wallet
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 px-1">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Saldo Tersedia</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help">
                      <Info className="h-3 w-3 text-blue-500" />
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        90% dari total
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">Maksimal penarikan 90% dari saldo total</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
              }).format(balance)}
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600 dark:text-neutral-400">Bisa ditarik:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0
                }).format(maxWithdrawal)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm">Jumlah Penarikan</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 text-sm">Rp</span>
              <Input
                id="amount"
                value={withdrawAmount}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value) {
                    const formatted = parseInt(value).toLocaleString('id-ID');
                    setWithdrawAmount(formatted);
                  } else {
                    setWithdrawAmount('');
                  }
                }}
                placeholder="Masukkan jumlah"
                className="pl-10 h-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setWithdrawAmount('50000')}
              >
                Rp 50.000
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setWithdrawAmount('100000')}
              >
                Rp 100.000
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setWithdrawAmount('500000')}
              >
                Rp 500.000
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setWithdrawAmount(maxWithdrawal.toLocaleString('id-ID'))}
              >
                Max
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Pilih Metode Penarikan</Label>
            <div className="max-h-60 overflow-y-auto border border-neutral-200 dark:border-neutral-700 rounded-lg p-2">
              <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod} className="space-y-2">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center space-x-2 p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-md">
                    <RadioGroupItem value={method.id} id={method.id} />
                    <Label htmlFor={method.id} className="flex items-center gap-3 cursor-pointer flex-1">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${method.type === 'bank'
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                        : 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                        }`}>
                        {method.type === 'bank' ? (
                          <Banknote className="h-4 w-4" />
                        ) : (
                          <CreditCard className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{method.name}</div>
                        <div className="text-xs text-neutral-500 truncate">{method.accountNumber}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {method.type === 'bank' ? 'Bank' : 'E-Wallet'}
                      </Badge>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 dark:text-yellow-300 text-xs">Biaya Admin</p>
                <p className="text-yellow-700 dark:text-yellow-400 text-xs">
                  Biaya admin sebesar Rp 2.500 akan dikenakan untuk setiap penarikan.
                  Dana akan masuk dalam 1-2 jam kerja.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-700 mt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="sm:flex-1 h-10 text-sm"
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            onClick={handleWithdraw}
            disabled={loading || !withdrawAmount || !selectedMethod}
            className="sm:flex-1 h-10 text-sm bg-gradient-to-r from-[#7CE0A8] to-[#5DD494] hover:from-[#6bcb96] hover:to-[#4cc383] text-white"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              'Tarik Sekarang'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Komponen Skeleton
const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-lg" />
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Skeleton className="h-96 rounded-lg" />
      <div className="lg:col-span-2 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [statData, setStatData] = useState({
    availableBalance: 0,
    pendingBalance: 0,
    monthlyIncome: 0,
    monthlyWithdrawal: 0,
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    inProgressOrders: 0,
    averageRating: 0,
    totalReviews: 0,
    totalRevenue: 0
  });
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentVendorId, setCurrentVendorId] = useState<string | null>(null);

  // Load vendor ID dari localStorage
  useEffect(() => {
    const mitraUser = localStorage.getItem('mitraUser');
    if (mitraUser) {
      try {
        const parsedMitra = JSON.parse(mitraUser);
        setCurrentVendorId(parsedMitra.id);
        console.log('Current Vendor ID:', parsedMitra.id);
      } catch (error) {
        console.error('Error parsing mitraUser:', error);
      }
    }
  }, []);

  // Load data dari localStorage
  useEffect(() => {
    if (!currentVendorId) return;

    loadDashboardData();

    const interval = setInterval(loadDashboardData, 5000);
    return () => clearInterval(interval);
  }, [currentVendorId]);

  const loadDashboardData = () => {
    if (!currentVendorId) {
      console.log('No vendor ID, skipping load');
      return;
    }

    try {
      setIsLoading(true);
      const allOrders = JSON.parse(localStorage.getItem('allOrders') || '[]');

      console.log('All Orders:', allOrders);
      console.log('Filtering for vendor:', currentVendorId);

      // FILTER HANYA PESANAN UNTUK VENDOR INI
      const vendorOrders = allOrders.filter((order: any) => {
        return order.vendorId === currentVendorId;
      });

      console.log('Vendor Orders (filtered):', vendorOrders);

      // Hitung statistik HANYA dari pesanan vendor ini
      let availableBalance = 0;
      let pendingBalance = 0;
      let monthlyIncome = 0;
      let monthlyWithdrawal = 0;
      let totalOrders = vendorOrders.length;
      let completedOrders = 0;
      let pendingOrders = 0;
      let inProgressOrders = 0;
      let totalRating = 0;
      let ratingCount = 0;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const transactions: any[] = [];

      // Hitung total dari completed orders VENDOR INI
      vendorOrders.forEach((order: any) => {
        const orderDate = new Date(order.orderDate);
        const orderMonth = orderDate.getMonth();
        const orderYear = orderDate.getFullYear();

        // Hitung berdasarkan status
        if (order.status === 'completed') {
          completedOrders++;
          const orderAmount = order.serviceDetails?.totalPrice || 0;
          availableBalance += orderAmount;

          // Tambahkan ke transaksi income
          transactions.push({
            id: `INC-${order.id}`,
            type: "income",
            amount: orderAmount,
            date: order.orderDate,
            description: `Pembayaran dari ${order.customerName}`,
            customerName: order.customerName,
            orderId: order.id,
            service: getServiceLabel(order),
            status: "completed",
            paymentMethod: "transfer_bank"
          });

          if (orderMonth === currentMonth && orderYear === currentYear) {
            monthlyIncome += orderAmount;
          }
        } else if (order.status === 'in-progress') {
          // Pesanan yang sedang dikerjakan = pending (belum selesai)
          pendingOrders++;
          inProgressOrders++;
          // Hanya tambahkan ke pending balance jika sudah dibayar
          if (order.paymentStatus === 'paid') {
            pendingBalance += order.serviceDetails?.totalPrice || 0;
          }
        } else if (order.status === 'pending') {
          pendingOrders++;
        }

        // Hitung rating
        if (order.rating) {
          totalRating += order.rating;
          ratingCount++;
        }
      });

      console.log('Available Balance BEFORE withdrawal:', availableBalance);

      // Load withdrawal history VENDOR INI dan kurangi dari available balance
      const allWithdrawals = JSON.parse(localStorage.getItem('withdrawalHistory') || '[]');

      // FILTER withdrawal hanya untuk vendor ini
      const vendorWithdrawals = allWithdrawals.filter((w: any) => w.vendorId === currentVendorId);

      console.log('All Withdrawals:', allWithdrawals);
      console.log('Vendor Withdrawals (filtered):', vendorWithdrawals);

      let totalWithdrawn = 0;

      vendorWithdrawals.forEach((withdrawal: any) => {
        transactions.push(withdrawal);

        // Kurangi available balance dengan withdrawal yang sudah completed
        if (withdrawal.status === 'completed') {
          totalWithdrawn += withdrawal.amount;
          console.log('Withdrawal:', withdrawal.amount, 'Total withdrawn so far:', totalWithdrawn);
        }

        const withdrawDate = new Date(withdrawal.date);
        if (withdrawDate.getMonth() === currentMonth && withdrawDate.getFullYear() === currentYear) {
          monthlyWithdrawal += withdrawal.amount;
        }
      });

      console.log('Total Withdrawn (this vendor):', totalWithdrawn);

      // Kurangi available balance dengan total yang sudah ditarik
      availableBalance = Math.max(0, availableBalance - totalWithdrawn);

      console.log('Available Balance AFTER withdrawal:', availableBalance);

      // Sort transactions by date
      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setStatData({
        availableBalance,
        pendingBalance,
        monthlyIncome,
        monthlyWithdrawal,
        totalOrders,
        completedOrders,
        pendingOrders,
        inProgressOrders,
        averageRating: ratingCount > 0 ? totalRating / ratingCount : 0,
        totalReviews: ratingCount,
        totalRevenue: availableBalance + pendingBalance
      });

      setTransactionHistory(transactions);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setIsLoading(false);
    }
  };

  const getServiceLabel = (order: any) => {
    const category = order.serviceCategory;
    const details = order.serviceDetails;

    switch (category) {
      case 'ac':
        return `Layanan AC - ${details.acCount || 1} Unit ${details.acType || ''} ${details.acPk || ''} PK`;
      case 'cleaning':
        return `Pembersihan - ${details.areaSize || 0} m²`;
      case 'electrical':
        return `Listrik - ${details.buildingType || ''}`;
      case 'plumbing':
        return `Ledeng/Pipa`;
      case 'sedot-wc':
        return `Sedot WC`;
      case 'taman':
        return `Taman - ${details.gardenSize || 0} m²`;
      case 'furniture':
        return `Furniture`;
      default:
        return 'Layanan Umum';
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      loadDashboardData();
      setRefreshKey(prev => prev + 1);
    }, 1000);
  };

  const filteredTransactions = transactionHistory.filter(transaction => {
    if (activeTab === "all") return true;
    if (activeTab === "income") return transaction.type === "income";
    if (activeTab === "withdrawal") return transaction.type === "withdrawal";
    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd MMM yyyy, HH:mm', { locale: id });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3 md:h-4 md:w-4" />;
      case 'pending':
        return <Clock className="h-3 w-3 md:h-4 md:w-4" />;
      case 'processing':
        return <RefreshCw className="h-3 w-3 md:h-4 md:w-4" />;
      case 'failed':
        return <X className="h-3 w-3 md:h-4 md:w-4" />;
      default:
        return <Info className="h-3 w-3 md:h-4 md:w-4" />;
    }
  };

  const handleWithdraw = (amount: number, method: string) => {
    if (!currentVendorId) {
      alert('Error: Vendor ID tidak ditemukan');
      return;
    }

    setWithdrawLoading(true);

    setTimeout(() => {
      const methodData = paymentMethods.find(m => m.id === method);

      // Set status completed langsung agar langsung mengurangi saldo
      const newWithdrawal = {
        id: `WD-${Date.now()}`,
        type: "withdrawal",
        amount: amount,
        date: new Date().toISOString(),
        description: `Penarikan ke ${methodData?.name}`,
        bankName: methodData?.name || '',
        accountNumber: methodData?.accountNumber || '',
        status: "completed",
        reference: `WD-${Date.now()}`,
        vendorId: currentVendorId // TAMBAHKAN VENDOR ID
      };

      // Simpan withdrawal history
      const withdrawalHistory = JSON.parse(localStorage.getItem('withdrawalHistory') || '[]');
      withdrawalHistory.push(newWithdrawal);
      localStorage.setItem('withdrawalHistory', JSON.stringify(withdrawalHistory));

      console.log('New withdrawal saved:', newWithdrawal);

      setWithdrawLoading(false);
      setShowWithdrawDialog(false);

      // Reload data untuk memperbarui saldo
      loadDashboardData();
    }, 1500);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 md:h-4 md:w-4 ${star <= Math.floor(rating)
              ? 'fill-yellow-400 text-yellow-400'
              : star === Math.ceil(rating) && rating % 1 !== 0
                ? 'fill-yellow-400/50 text-yellow-400'
                : 'text-neutral-300 dark:text-neutral-600'
              }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <motion.div
        className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-4 md:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        key={refreshKey}
      >
        <div className="max-w-7xl mx-auto">
          <DashboardSkeleton />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-4 md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      key={refreshKey}
    >
      <WithdrawDialog
        open={showWithdrawDialog}
        onOpenChange={setShowWithdrawDialog}
        balance={statData.availableBalance}
        onWithdraw={handleWithdraw}
        loading={withdrawLoading}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <Breadcrumb className="mb-2">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold text-neutral-900 dark:text-white">
                    Dashboard
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white">
              Dashboard Mitra
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1 text-sm md:text-base">
              Selamat datang kembali! Kelola keuangan dan pesanan Anda di sini
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-neutral-300 dark:border-neutral-600"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {isLoading ? 'Memperbarui...' : 'Refresh'}
            </Button>

            <Button
              className="bg-gradient-to-r from-[#7CE0A8] to-[#5DD494] hover:from-[#6bcb96] hover:to-[#4cc383] text-white shadow-md"
              onClick={() => setShowWithdrawDialog(true)}
              disabled={statData.availableBalance === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Tarik Saldo
            </Button>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 md:mb-8">
          {/* Available Balance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="bg-gradient-to-r from-[#7CE0A8] to-[#5DD494] text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <Badge className="bg-white/20 text-white border-0">
                    Siap Ditarik
                  </Badge>
                </div>
                <p className="text-sm opacity-90 mb-1">Saldo Tersedia</p>
                <p className="text-3xl md:text-4xl font-bold">
                  {formatCurrency(statData.availableBalance)}
                </p>
                <p className="text-xs opacity-75 mt-2">
                  Dari pesanan yang sudah selesai
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pending Balance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Lock className="h-6 w-6" />
                  </div>
                  <Badge className="bg-white/20 text-white border-0">
                    Menunggu
                  </Badge>
                </div>
                <p className="text-sm opacity-90 mb-1">Saldo Pending</p>
                <p className="text-3xl md:text-4xl font-bold">
                  {formatCurrency(statData.pendingBalance)}
                </p>
                <p className="text-xs opacity-75 mt-2">
                  Dari pesanan yang sedang dikerjakan
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          {/* Pemasukan Bulan Ini */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 mb-1">Pemasukan Bulan Ini</p>
                    <p className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white">
                      {formatCurrency(statData.monthlyIncome)}
                    </p>
                  </div>
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Penarikan Bulan Ini */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 mb-1">Penarikan Bulan Ini</p>
                    <p className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white">
                      {formatCurrency(statData.monthlyWithdrawal)}
                    </p>
                  </div>
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <TrendingDown className="h-5 w-5 md:h-6 md:w-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Rating */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 mb-1">Total Rating</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white">
                        {statData.averageRating > 0 ? statData.averageRating.toFixed(1) : '-'}
                      </p>
                      {statData.averageRating > 0 && (
                        <div className="flex items-center">
                          {renderStars(statData.averageRating)}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      {statData.totalReviews > 0 ? `dari ${statData.totalReviews} ulasan` : 'Belum ada ulasan'}
                    </p>
                  </div>
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                    <Star className="h-5 w-5 md:h-6 md:w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Pesanan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 mb-1">Total Pesanan</p>
                    <p className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white">
                      {statData.totalOrders}
                    </p>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-neutral-500 mt-1">
                      <span className="text-green-600">{statData.completedOrders} selesai</span>
                      <span>•</span>
                      <span className="text-yellow-600">{statData.pendingOrders} pending</span>
                    </div>
                  </div>
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Calendar className="h-5 w-5 md:h-6 md:w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Payment Methods */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
            className="lg:col-span-1"
          >
            <Card className="h-full">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <CreditCard className="h-4 w-4 md:h-5 md:w-5" />
                  Metode Pembayaran
                </CardTitle>
                <CardDescription className="text-sm">
                  Rekening yang terhubung untuk penarikan
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <div className="space-y-3">
                  {paymentMethods.slice(0, 4).map((method) => (
                    <div key={method.id} className="flex items-center gap-3 p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                      <div className={`h-9 w-9 md:h-10 md:w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${method.type === 'bank'
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                        : 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                        }`}>
                        {method.type === 'bank' ? (
                          <Banknote className="h-4 w-4 md:h-5 md:w-5" />
                        ) : (
                          <CreditCard className="h-4 w-4 md:h-5 md:w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{method.name}</p>
                        <p className="text-xs text-neutral-500 truncate">{method.accountNumber}</p>
                      </div>
                      <Badge className={`text-xs ${method.type === 'bank'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                        {method.type === 'bank' ? 'Bank' : 'E-Wallet'}
                      </Badge>
                    </div>
                  ))}

                  <Button variant="outline" className="w-full text-sm h-9 md:h-10">
                    <Plus className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                    Tambah Metode
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Transaction History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.8 }}
            className="lg:col-span-2"
          >
            <Card className="h-full">
              <CardHeader className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <History className="h-4 w-4 md:h-5 md:w-5" />
                    Riwayat Transaksi
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Catatan pemasukan dan penarikan Anda
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                    <TabsList className="grid grid-cols-3 w-full sm:w-auto">
                      <TabsTrigger value="all" className="text-xs px-2 sm:px-3">Semua</TabsTrigger>
                      <TabsTrigger value="income" className="text-xs px-2 sm:px-3">Pemasukan</TabsTrigger>
                      <TabsTrigger value="withdrawal" className="text-xs px-2 sm:px-3">Penarikan</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8 md:h-9 md:w-9">
                        <Filter className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Hari Ini</DropdownMenuItem>
                      <DropdownMenuItem>Minggu Ini</DropdownMenuItem>
                      <DropdownMenuItem>Bulan Ini</DropdownMenuItem>
                      <DropdownMenuItem>Tahun Ini</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="p-4 md:p-6 pt-0">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="h-14 w-14 md:h-16 md:w-16 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center mb-4">
                      <History className="h-6 w-6 md:h-8 md:w-8 text-neutral-400" />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                      Tidak ada transaksi
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {activeTab === 'all'
                        ? 'Belum ada transaksi yang tercatat'
                        : activeTab === 'income'
                          ? 'Belum ada pemasukan yang tercatat'
                          : 'Belum ada penarikan yang tercatat'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 md:space-y-4">
                    <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
                      <div className="col-span-5">Transaksi</div>
                      <div className="col-span-2">Tanggal</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-3 text-right">Jumlah</div>
                    </div>

                    <div className="space-y-2 md:space-y-3">
                      {filteredTransactions.slice(0, 5).map((transaction) => (
                        <motion.div
                          key={transaction.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="group"
                        >
                          <div className="flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 p-3 md:p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                            {/* Mobile View */}
                            <div className="md:hidden flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-start gap-2 mb-2">
                                  <div className={`h-8 w-8 rounded-full flex items-center justify-center mt-0.5 ${transaction.type === 'income'
                                    ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                                    : 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                                    }`}>
                                    {transaction.type === 'income' ? (
                                      <ArrowDownRight className="h-4 w-4" />
                                    ) : (
                                      <ArrowUpRight className="h-4 w-4" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{transaction.description}</p>
                                    <p className="text-xs text-neutral-500 mt-1">
                                      {formatDate(transaction.date)}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge className={`${getStatusColor(transaction.status)} flex items-center gap-1 text-xs`}>
                                        {getStatusIcon(transaction.status)}
                                        {transaction.status === 'completed' ? 'Selesai' :
                                          transaction.status === 'pending' ? 'Pending' :
                                            transaction.status === 'processing' ? 'Diproses' : 'Gagal'}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between mt-2">
                                  <div className={`font-bold text-sm ${transaction.type === 'income'
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-blue-600 dark:text-blue-400'
                                    }`}>
                                    {transaction.type === 'income' ? '+' : '-'}
                                    {formatCurrency(transaction.amount)}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Desktop View */}
                            <div className="hidden md:contents">
                              <div className="col-span-5 flex items-center gap-3">
                                <div className={`h-9 w-9 rounded-full flex items-center justify-center ${transaction.type === 'income'
                                  ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                                  : 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                                  }`}>
                                  {transaction.type === 'income' ? (
                                    <ArrowDownRight className="h-4 w-4" />
                                  ) : (
                                    <ArrowUpRight className="h-4 w-4" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium truncate text-sm">{transaction.description}</p>
                                  {transaction.type === 'income' ? (
                                    <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                                      <User className="h-3 w-3" />
                                      <span className="truncate">{transaction.customerName}</span>
                                      {transaction.service && (
                                        <>
                                          <span>•</span>
                                          <span className="truncate">{transaction.service}</span>
                                        </>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                                      <Banknote className="h-3 w-3" />
                                      <span className="truncate">{transaction.bankName}</span>
                                      {transaction.accountNumber && (
                                        <>
                                          <span>•</span>
                                          <span className="truncate">{transaction.accountNumber}</span>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="col-span-2 flex items-center text-xs text-neutral-600 dark:text-neutral-400">
                                {formatDate(transaction.date)}
                              </div>

                              <div className="col-span-2 flex items-center">
                                <Badge className={`${getStatusColor(transaction.status)} flex items-center gap-1 text-xs`}>
                                  {getStatusIcon(transaction.status)}
                                  {transaction.status === 'completed' ? 'Selesai' :
                                    transaction.status === 'pending' ? 'Pending' :
                                      transaction.status === 'processing' ? 'Diproses' : 'Gagal'}
                                </Badge>
                              </div>

                              <div className="col-span-3 flex items-center justify-end">
                                <div className={`font-bold text-sm ${transaction.type === 'income'
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-blue-600 dark:text-blue-400'
                                  }`}>
                                  {transaction.type === 'income' ? '+' : '-'}
                                  {formatCurrency(transaction.amount)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {filteredTransactions.length > 5 && (
                      <div className="text-center pt-3 md:pt-4">
                        <Button variant="ghost" className="text-[#7CE0A8] hover:text-[#6bcb96] hover:bg-[#7CE0A8]/10 text-sm">
                          Lihat Semua Transaksi
                          <ChevronRight className="h-3 w-3 md:h-4 md:w-4 ml-2" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}