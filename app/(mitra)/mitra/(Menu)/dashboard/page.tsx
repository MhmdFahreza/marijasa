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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  User, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Download,
  CreditCard,
  Banknote,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  MoreVertical,
  ChevronRight,
  RefreshCw,
  Plus,
  Check,
  X,
  Info,
  Star
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
  DialogTitle, 
  DialogTrigger 
} from "@/app/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Skeleton } from "@/app/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";

// Data dummy untuk statistik
const initialStatData = {
  balance: 12500000,
  monthlyIncome: 4500000,
  monthlyWithdrawal: 2000000,
  pendingBalance: 3000000,
  totalOrders: 45,
  completedOrders: 38,
  pendingOrders: 7,
  averageRating: 4.8,
  totalReviews: 128,
  totalRevenue: 89000000
};

// Data dummy untuk history transaksi
const initialTransactionHistory = [
  {
    id: "TRX-001",
    type: "income",
    amount: 1500000,
    date: "2024-01-15 10:30:00",
    description: "Pembayaran dari Budi Santoso",
    customerName: "Budi Santoso",
    orderId: "ORD-001",
    service: "Instalasi AC",
    status: "completed",
    paymentMethod: "transfer_bank"
  },
  {
    id: "TRX-002",
    type: "withdrawal",
    amount: 2000000,
    date: "2024-01-14 14:20:00",
    description: "Penarikan ke Bank BCA",
    bankName: "BCA",
    accountNumber: "1234567890",
    status: "completed",
    reference: "WD-20240114-001"
  },
  {
    id: "TRX-003",
    type: "income",
    amount: 850000,
    date: "2024-01-13 09:15:00",
    description: "Pembayaran dari Sari Dewi",
    customerName: "Sari Dewi",
    orderId: "ORD-002",
    service: "Pembersihan Rumah",
    status: "completed",
    paymentMethod: "gopay"
  },
  {
    id: "TRX-004",
    type: "income",
    amount: 1200000,
    date: "2024-01-12 16:45:00",
    description: "Pembayaran dari Rudi Hartono",
    customerName: "Rudi Hartono",
    orderId: "ORD-003",
    service: "Perbaikan Listrik",
    status: "pending",
    paymentMethod: "ovo"
  },
  {
    id: "TRX-005",
    type: "withdrawal",
    amount: 1000000,
    date: "2024-01-11 11:10:00",
    description: "Penarikan ke Dana",
    bankName: "Dana",
    accountNumber: "081234567890",
    status: "processing",
    reference: "WD-20240111-001"
  }
];

// Data dummy untuk bank/ewallet
const paymentMethods = [
  { id: "bca", name: "BCA", type: "bank", accountNumber: "1234567890", accountName: "John Doe" },
  { id: "mandiri", name: "Mandiri", type: "bank", accountNumber: "0987654321", accountName: "John Doe" },
  { id: "bri", name: "BRI", type: "bank", accountNumber: "1122334455", accountName: "John Doe" },
  { id: "gopay", name: "GoPay", type: "ewallet", accountNumber: "081234567890", accountName: "John Doe" },
  { id: "ovo", name: "OVO", type: "ewallet", accountNumber: "082345678901", accountName: "John Doe" },
  { id: "dana", name: "Dana", type: "ewallet", accountNumber: "083456789012", accountName: "John Doe" }
];

// Komponen WithdrawDialog yang terpisah
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

  // Calculate max withdrawal (90% of balance)
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
          {/* Saldo Info */}
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
          
          {/* Amount Input */}
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
          
          {/* Payment Method */}
          <div className="space-y-2">
            <Label className="text-sm">Pilih Metode Penarikan</Label>
            <div className="max-h-60 overflow-y-auto border border-neutral-200 dark:border-neutral-700 rounded-lg p-2">
              <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod} className="space-y-2">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center space-x-2 p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-md">
                    <RadioGroupItem value={method.id} id={method.id} />
                    <Label htmlFor={method.id} className="flex items-center gap-3 cursor-pointer flex-1">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                        method.type === 'bank' 
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
          
          {/* Fee Info */}
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

// Komponen Skeleton untuk loading
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
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [statData, setStatData] = useState(initialStatData);
  const [transactionHistory, setTransactionHistory] = useState(initialTransactionHistory);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fungsi untuk refresh data
  const handleRefresh = () => {
    setIsLoading(true);
    
    // Simulasi loading data baru
    setTimeout(() => {
      // Update dengan data baru (dalam implementasi nyata, ini akan fetching dari API)
      setStatData(prev => ({
        ...prev,
        balance: prev.balance + Math.floor(Math.random() * 100000),
        monthlyIncome: prev.monthlyIncome + Math.floor(Math.random() * 500000),
        totalOrders: prev.totalOrders + Math.floor(Math.random() * 3)
      }));
      
      // Add a new transaction for demo
      const newTransaction = {
        id: `TRX-${Date.now()}`,
        type: "income",
        amount: Math.floor(Math.random() * 1000000) + 500000,
        date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        description: "Pembayaran dari Pelanggan Baru",
        customerName: "Pelanggan Baru",
        orderId: `ORD-${Math.floor(Math.random() * 1000)}`,
        service: "Layanan Umum",
        status: "completed",
        paymentMethod: "transfer_bank"
      };
      
      setTransactionHistory(prev => [newTransaction, ...prev]);
      setIsLoading(false);
      setRefreshKey(prev => prev + 1);
      
      // Show success message
      const event = new CustomEvent('showToast', {
        detail: {
          message: 'Data berhasil diperbarui',
          type: 'success'
        }
      });
      window.dispatchEvent(event);
    }, 1000);
  };

  // Filter transaksi berdasarkan tab
  const filteredTransactions = transactionHistory.filter(transaction => {
    if (activeTab === "all") return true;
    if (activeTab === "income") return transaction.type === "income";
    if (activeTab === "withdrawal") return transaction.type === "withdrawal";
    return true;
  });

  // Format tanggal
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd MMM yyyy, HH:mm', { locale: id });
  };

  // Format mata uang
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Get status color
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

  // Get status icon
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
        return <AlertCircle className="h-3 w-3 md:h-4 md:w-4" />;
    }
  };

  // Handle withdraw
  const handleWithdraw = (amount: number, method: string) => {
    setWithdrawLoading(true);
    
    // Simulasi proses penarikan
    setTimeout(() => {
      // Update balance
      setStatData(prev => ({
        ...prev,
        balance: prev.balance - amount,
        monthlyWithdrawal: prev.monthlyWithdrawal + amount
      }));
      
      // Add withdrawal transaction
      const methodData = paymentMethods.find(m => m.id === method);
      const newWithdrawal = {
        id: `WD-${Date.now()}`,
        type: "withdrawal",
        amount: amount,
        date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        description: `Penarikan ke ${methodData?.name}`,
        bankName: methodData?.name || '',
        accountNumber: methodData?.accountNumber || '',
        status: "processing",
        reference: `WD-${Date.now()}`
      };
      
      setTransactionHistory(prev => [newWithdrawal, ...prev]);
      setWithdrawLoading(false);
      setShowWithdrawDialog(false);
      
      // Show success message
      const event = new CustomEvent('showToast', {
        detail: {
          message: `Penarikan sebesar ${formatCurrency(amount)} berhasil diproses`,
          type: 'success'
        }
      });
      window.dispatchEvent(event);
    }, 1500);
  };

  // Fungsi untuk menampilkan bintang rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 md:h-4 md:w-4 ${
              star <= Math.floor(rating)
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
        balance={statData.balance}
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
            >
              <Download className="h-4 w-4 mr-2" />
              Tarik Saldo
            </Button>
          </div>
        </div>

        {/* Balance Card - Simplified */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-r from-[#7CE0A8] to-[#5DD494] text-white border-0 shadow-xl mb-6 md:mb-8">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="h-12 w-12 md:h-16 md:w-16 rounded-full bg-white/20 flex items-center justify-center">
                    <Wallet className="h-6 w-6 md:h-8 md:w-8" />
                  </div>
                  <div>
                    <p className="text-sm md:text-base opacity-90">Saldo Mitra</p>
                    <p className="text-3xl md:text-4xl lg:text-5xl font-bold mt-1">
                      {formatCurrency(statData.balance)}
                    </p>
                  </div>
                </div>
                
                <div className="md:text-right">
                  <p className="text-xs md:text-sm opacity-90 mb-1">Update Terakhir</p>
                  <p className="text-sm md:text-base font-medium">
                    {format(new Date(), 'dd MMMM yyyy', { locale: id })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          {/* Pemasukan Bulan Ini */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
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
                <div className="flex items-center gap-1 mt-2 md:mt-3">
                  <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                  <span className="text-xs md:text-sm text-blue-600">+8.2%</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Penarikan Bulan Ini */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
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
                <div className="flex items-center gap-1 mt-2 md:mt-3">
                  <ArrowDownRight className="h-3 w-3 md:h-4 md:w-4 text-red-600" />
                  <span className="text-xs md:text-sm text-red-600">-5.2%</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Rating */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 mb-1">Total Rating</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white">
                        {statData.averageRating.toFixed(1)}
                      </p>
                      <div className="flex items-center">
                        {renderStars(statData.averageRating)}
                      </div>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      dari {statData.totalReviews} ulasan
                    </p>
                  </div>
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                    <Star className="h-5 w-5 md:h-6 md:w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 md:mt-3">
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Pesanan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
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
            transition={{ duration: 0.3, delay: 0.6 }}
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
                      <div className={`h-9 w-9 md:h-10 md:w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        method.type === 'bank' 
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
                      <Badge className={`text-xs ${
                        method.type === 'bank' 
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
            transition={{ duration: 0.3, delay: 0.7 }}
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
                      {filteredTransactions.map((transaction) => (
                        <motion.div
                          key={transaction.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="group"
                        >
                          <div className="flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 p-3 md:p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                            {/* Mobile View - Compact */}
                            <div className="md:hidden flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-start gap-2 mb-2">
                                  <div className={`h-8 w-8 rounded-full flex items-center justify-center mt-0.5 ${
                                    transaction.type === 'income'
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
                                      {transaction.type === 'income' && (
                                        <span className="text-xs text-neutral-500 truncate">
                                          {transaction.customerName}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between mt-2">
                                  <div className={`font-bold text-sm ${
                                    transaction.type === 'income'
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
                              {/* Transaction Details */}
                              <div className="col-span-5 flex items-center gap-3">
                                <div className={`h-9 w-9 rounded-full flex items-center justify-center ${
                                  transaction.type === 'income'
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
                                      <span>•</span>
                                      <span className="truncate">{transaction.service}</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                                      <Banknote className="h-3 w-3" />
                                      <span className="truncate">{transaction.bankName}</span>
                                      <span>•</span>
                                      <span className="truncate">{transaction.accountNumber}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Date */}
                              <div className="col-span-2 flex items-center text-xs text-neutral-600 dark:text-neutral-400">
                                {formatDate(transaction.date)}
                              </div>
                              
                              {/* Status */}
                              <div className="col-span-2 flex items-center">
                                <Badge className={`${getStatusColor(transaction.status)} flex items-center gap-1 text-xs`}>
                                  {getStatusIcon(transaction.status)}
                                  {transaction.status === 'completed' ? 'Selesai' : 
                                   transaction.status === 'pending' ? 'Pending' :
                                   transaction.status === 'processing' ? 'Diproses' : 'Gagal'}
                                </Badge>
                              </div>
                              
                              {/* Amount */}
                              <div className="col-span-3 flex items-center justify-end">
                                <div className={`font-bold text-sm ${
                                  transaction.type === 'income'
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
                    
                    {/* View More */}
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