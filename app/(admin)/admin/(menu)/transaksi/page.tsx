"use client";
import React, { useState, useEffect } from "react";
import { IconSearch, IconDownload, IconEye, IconFilter, IconWallet, IconArrowUpRight, IconX } from "@tabler/icons-react";
import * as XLSX from 'xlsx';

export default function TransaksiPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    successCount: 0,
    pendingCount: 0,
    failedCount: 0,
    serviceBalance: 0,
    availableBalance: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("");
  const [withdrawAccount, setWithdrawAccount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/transactions', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to fetch transactions:", errorData);
        
        if (response.status === 401) {
          alert('Sesi Anda telah berakhir. Silakan login kembali.');
          window.location.href = '/admin/login';
          return;
        }
        
        throw new Error(errorData.message || 'Failed to fetch transactions');
      }

      const data = await response.json();
      console.log("Transactions data loaded:", data);
      
      if (data.success) {
        setTransactions(data.transactions || []);
        setStats(data.stats || {
          totalTransactions: 0,
          successCount: 0,
          pendingCount: 0,
          failedCount: 0,
          serviceBalance: 0,
          availableBalance: 0
        });
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
      alert('Gagal memuat data transaksi. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((trx: any) => {
    const matchesSearch = 
      trx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trx.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || trx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return `Rp ${new Intl.NumberFormat('id-ID').format(amount)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleExportToExcel = () => {
    const exportData = filteredTransactions.map((trx: any) => ({
      'ID Transaksi': trx.id,
      'User': trx.user,
      'Kategori': trx.category,
      'Metode Pembayaran': trx.method,
      'Jumlah': trx.amount,
      'Biaya Layanan': trx.serviceFee,
      'Status': trx.status === 'success' ? 'Selesai' : trx.status === 'pending' ? 'Pending' : 'Gagal',
      'Tanggal': formatDate(trx.date)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transaksi");
    
    const fileName = `transaksi_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || !withdrawMethod || !withdrawAccount) {
      alert("Harap lengkapi semua field");
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (amount <= 0 || amount > stats.availableBalance) {
      alert(`Jumlah tidak valid. Maksimal: ${formatCurrency(stats.availableBalance)}`);
      return;
    }

    setIsWithdrawing(true);
    try {
      const response = await fetch('/api/admin/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          amount,
          method: withdrawMethod,
          accountNumber: withdrawAccount
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Penarikan berhasil diajukan!');
        setShowWithdrawModal(false);
        setWithdrawAmount("");
        setWithdrawMethod("");
        setWithdrawAccount("");
        loadTransactions();
      } else {
        alert(data.message || 'Gagal melakukan penarikan');
      }
    } catch (error) {
      console.error('Error withdrawing:', error);
      alert('Terjadi kesalahan saat melakukan penarikan');
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7CE0A8]"></div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Transaksi</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Kelola semua transaksi pengguna
          </p>
        </div>
        <button 
          onClick={handleExportToExcel}
          className="flex items-center gap-2 bg-[#7CE0A8] hover:bg-[#6BC997] text-white px-4 py-2.5 rounded-lg transition-colors font-medium shadow-sm"
        >
          <IconDownload className="h-4 w-4" />
          Export to Excel
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Total Transaksi</p>
              <p className="text-3xl font-bold text-neutral-900 dark:text-white mt-2">{stats.totalTransactions}</p>
            </div>
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Berhasil</p>
              <p className="text-3xl font-bold text-neutral-900 dark:text-white mt-2">{stats.successCount}</p>
            </div>
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white shadow-lg">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Pending</p>
              <p className="text-3xl font-bold text-neutral-900 dark:text-white mt-2">{stats.pendingCount}</p>
            </div>
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Gagal</p>
              <p className="text-3xl font-bold text-neutral-900 dark:text-white mt-2">{stats.failedCount}</p>
            </div>
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg">
              <span className="text-2xl">❌</span>
            </div>
          </div>
        </div>
      </div>

      {/* Saldo Layanan Card */}
      <div className="bg-gradient-to-br from-[#7CE0A8] to-emerald-500 rounded-xl p-6 mb-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-white/80 mb-1">Saldo Layanan</p>
            <p className="text-4xl font-bold mb-3">
              {formatCurrency(stats.availableBalance)}
            </p>
            <div className="flex items-center gap-2 text-sm text-white/90">
              <span className="inline-block w-2 h-2 bg-white/60 rounded-full"></span>
              <span>Total Pendapatan: {formatCurrency(stats.serviceBalance)}</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="h-16 w-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-md">
              <span className="text-3xl">💳</span>
            </div>
            <button
              onClick={() => setShowWithdrawModal(true)}
              disabled={stats.availableBalance <= 0}
              className="flex items-center justify-center gap-2 bg-white text-[#7CE0A8] px-6 py-3 rounded-lg hover:bg-white/95 transition-all font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <IconWallet className="h-5 w-5" />
              Tarik Tunai
            </button>
          </div>
        </div>
      </div>

      {/* Search and Table */}
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm">
        {/* Search and Filter */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Cari transaksi berdasarkan ID atau nama user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#7CE0A8] focus:border-transparent transition-all"
              />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7CE0A8] transition-all"
            >
              <option value="all">Semua Status</option>
              <option value="success">Berhasil</option>
              <option value="pending">Pending</option>
              <option value="failed">Gagal</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
              <IconFilter className="h-5 w-5" />
              <span className="hidden sm:inline">Filter Lainnya</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-900/50">
              <tr className="border-b border-neutral-200 dark:border-neutral-700">
                <th className="text-left py-4 px-6 font-semibold text-xs uppercase tracking-wider text-neutral-600 dark:text-neutral-400">ID Transaksi</th>
                <th className="text-left py-4 px-6 font-semibold text-xs uppercase tracking-wider text-neutral-600 dark:text-neutral-400">User</th>
                <th className="text-left py-4 px-6 font-semibold text-xs uppercase tracking-wider text-neutral-600 dark:text-neutral-400">Kategori</th>
                <th className="text-left py-4 px-6 font-semibold text-xs uppercase tracking-wider text-neutral-600 dark:text-neutral-400">Metode</th>
                <th className="text-left py-4 px-6 font-semibold text-xs uppercase tracking-wider text-neutral-600 dark:text-neutral-400">Jumlah</th>
                <th className="text-left py-4 px-6 font-semibold text-xs uppercase tracking-wider text-neutral-600 dark:text-neutral-400">Biaya Layanan</th>
                <th className="text-left py-4 px-6 font-semibold text-xs uppercase tracking-wider text-neutral-600 dark:text-neutral-400">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-xs uppercase tracking-wider text-neutral-600 dark:text-neutral-400">Tanggal</th>
                <th className="text-left py-4 px-6 font-semibold text-xs uppercase tracking-wider text-neutral-600 dark:text-neutral-400">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction: any) => (
                  <tr key={transaction.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-mono text-sm font-medium text-neutral-900 dark:text-white">{transaction.id}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                          {transaction.user.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-neutral-900 dark:text-white">{transaction.user}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-md text-xs font-medium">
                        {transaction.category}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">{transaction.method}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-neutral-900 dark:text-white">
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(transaction.serviceFee)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        transaction.status === 'success' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : transaction.status === 'pending'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {transaction.status === 'success' ? 'Selesai' : transaction.status === 'pending' ? 'Pending' : 'Gagal'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">{formatDate(transaction.date)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <button className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors group">
                        <IconEye className="h-5 w-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-neutral-500 dark:text-neutral-400">
                      <svg className="h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm font-medium">Tidak ada transaksi</p>
                      <p className="text-xs mt-1">Transaksi akan muncul di sini setelah user melakukan pemesanan</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredTransactions.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Menampilkan <span className="font-medium text-neutral-900 dark:text-white">{filteredTransactions.length}</span> transaksi
            </p>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors text-sm font-medium">
                Previous
              </button>
              <button className="px-4 py-2 bg-[#7CE0A8] text-white rounded-lg font-medium shadow-sm">1</button>
              <button className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors text-sm font-medium">
                2
              </button>
              <button className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors text-sm font-medium">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
              <div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Tarik Tunai</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Cairkan saldo layanan Anda</p>
              </div>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              >
                <IconX className="h-5 w-5 text-neutral-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Saldo Tersedia */}
              <div className="bg-gradient-to-br from-[#7CE0A8]/10 to-emerald-500/10 rounded-xl p-4 border border-[#7CE0A8]/20">
                <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wide mb-1">
                  Saldo Tersedia
                </p>
                <p className="text-3xl font-bold text-[#7CE0A8]">
                  {formatCurrency(stats.availableBalance)}
                </p>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Jumlah Penarikan */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Jumlah Penarikan <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 font-medium">Rp</span>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#7CE0A8] focus:border-transparent transition-all"
                    />
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5">
                    Maksimal: {formatCurrency(stats.availableBalance)}
                  </p>
                </div>

                {/* Metode Penarikan */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Metode Penarikan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={withdrawMethod}
                    onChange={(e) => setWithdrawMethod(e.target.value)}
                    className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7CE0A8] focus:border-transparent transition-all"
                  >
                    <option value="">Pilih Metode Penarikan</option>
                    <optgroup label="Transfer Bank">
                      <option value="bank-bca">🏦 Bank BCA</option>
                      <option value="bank-mandiri">🏦 Bank Mandiri</option>
                      <option value="bank-bni">🏦 Bank BNI</option>
                      <option value="bank-bri">🏦 Bank BRI</option>
                    </optgroup>
                    <optgroup label="E-Wallet">
                      <option value="gopay">💳 GoPay</option>
                      <option value="ovo">💳 OVO</option>
                      <option value="dana">💳 DANA</option>
                    </optgroup>
                  </select>
                </div>

                {/* Nomor Rekening */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Nomor Rekening/Akun <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={withdrawAccount}
                    onChange={(e) => setWithdrawAccount(e.target.value)}
                    placeholder="Masukkan nomor rekening atau akun"
                    className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#7CE0A8] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                  <svg className="h-4 w-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>Penarikan akan diproses dalam 1-3 hari kerja. Pastikan data yang Anda masukkan sudah benar.</span>
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() => setShowWithdrawModal(false)}
                disabled={isWithdrawing}
                className="flex-1 px-5 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors font-medium text-neutral-700 dark:text-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                onClick={handleWithdraw}
                disabled={isWithdrawing || !withdrawAmount || !withdrawMethod || !withdrawAccount}
                className="flex-1 px-5 py-3 bg-[#7CE0A8] hover:bg-[#6BC997] text-white rounded-lg transition-all font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isWithdrawing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <IconArrowUpRight className="h-5 w-5" />
                    <span>Tarik Tunai</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}