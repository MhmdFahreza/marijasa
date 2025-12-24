"use client";
import React, { useState, useEffect } from "react";
import { IconSearch, IconDownload, IconEye, IconFilter } from "@tabler/icons-react";

export default function TransaksiPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const transactions = [
    { id: "#TRX001", user: "John Doe", amount: 250000, status: "success", date: "2024-12-20", method: "Transfer Bank", category: "Top Up" },
    { id: "#TRX002", user: "Jane Smith", amount: 150000, status: "success", date: "2024-12-20", method: "E-Wallet", category: "Pembelian" },
    { id: "#TRX003", user: "Robert Johnson", amount: 350000, status: "pending", date: "2024-12-21", method: "Transfer Bank", category: "Top Up" },
    { id: "#TRX004", user: "Sarah Williams", amount: 120000, status: "success", date: "2024-12-21", method: "Credit Card", category: "Pembelian" },
    { id: "#TRX005", user: "Michael Brown", amount: 280000, status: "failed", date: "2024-12-22", method: "E-Wallet", category: "Top Up" },
    { id: "#TRX006", user: "Emily Davis", amount: 190000, status: "success", date: "2024-12-22", method: "Transfer Bank", category: "Pembelian" },
    { id: "#TRX007", user: "David Wilson", amount: 420000, status: "pending", date: "2024-12-23", method: "Transfer Bank", category: "Top Up" },
    { id: "#TRX008", user: "Lisa Anderson", amount: 95000, status: "success", date: "2024-12-23", method: "E-Wallet", category: "Pembelian" },
  ];

  const filteredTransactions = transactions.filter(trx => {
    const matchesSearch = 
      trx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trx.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || trx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAmount = filteredTransactions.reduce((sum, trx) => sum + trx.amount, 0);
  const successCount = filteredTransactions.filter(trx => trx.status === 'success').length;
  const pendingCount = filteredTransactions.filter(trx => trx.status === 'pending').length;
  const failedCount = filteredTransactions.filter(trx => trx.status === 'failed').length;

  // Format currency consistently
  const formatCurrency = (amount: number) => {
    if (!mounted) {
      return `Rp ${amount.toLocaleString()}`;
    }
    return `Rp ${new Intl.NumberFormat('id-ID').format(amount)}`;
  };

  // Format date consistently
  const formatDate = (dateString: string) => {
    if (!mounted) {
      return dateString;
    }
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Transaksi</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Kelola semua transaksi pengguna
          </p>
        </div>
        <button className="flex items-center gap-2 bg-[#7CE0A8] hover:bg-[#6BC997] text-white px-4 py-2 rounded-lg transition-colors">
          <IconDownload className="h-5 w-5" />
          Export Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Transaksi</p>
              <p className="text-2xl font-bold mt-2">{filteredTransactions.length}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-purple-500 flex items-center justify-center text-white">
              <span className="text-xl">💰</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Berhasil</p>
              <p className="text-2xl font-bold mt-2">{successCount}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-green-500 flex items-center justify-center text-white">
              <span className="text-xl">✅</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Pending</p>
              <p className="text-2xl font-bold mt-2">{pendingCount}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-500 flex items-center justify-center text-white">
              <span className="text-xl">⏳</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Gagal</p>
              <p className="text-2xl font-bold mt-2">{failedCount}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-red-500 flex items-center justify-center text-white">
              <span className="text-xl">❌</span>
            </div>
          </div>
        </div>
      </div>

      {/* Total Amount Card */}
      <div className="bg-gradient-to-br from-[#7CE0A8] to-emerald-400 rounded-xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 mb-1">Total Nilai Transaksi</p>
            <p className="text-3xl font-bold">
              {formatCurrency(totalAmount)}
            </p>
          </div>
          <div className="h-16 w-16 rounded-xl bg-white/20 flex items-center justify-center">
            <span className="text-3xl">📊</span>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Cari transaksi berdasarkan ID atau nama user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#7CE0A8]"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-transparent"
          >
            <option value="all">Semua Status</option>
            <option value="success">Berhasil</option>
            <option value="pending">Pending</option>
            <option value="failed">Gagal</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
            <IconFilter className="h-5 w-5" />
            Filter Lainnya
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700">
                <th className="text-left py-3 px-4 font-semibold text-sm">ID Transaksi</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">User</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Kategori</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Metode</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Jumlah</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Tanggal</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-750">
                  <td className="py-3 px-4">
                    <span className="font-mono text-sm font-medium">{transaction.id}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                        {transaction.user.charAt(0)}
                      </div>
                      <span className="font-medium">{transaction.user}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-md text-xs">
                      {transaction.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-neutral-600 dark:text-neutral-400">
                    {transaction.method}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold">
                      {formatCurrency(transaction.amount)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      transaction.status === 'success' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : transaction.status === 'pending'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {transaction.status === 'success' ? 'Selesai' : transaction.status === 'pending' ? 'Pending' : 'Gagal'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-neutral-600 dark:text-neutral-400">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="py-3 px-4">
                    <button className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                      <IconEye className="h-4 w-4 text-blue-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Menampilkan {filteredTransactions.length} transaksi
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
              Previous
            </button>
            <button className="px-3 py-1 bg-[#7CE0A8] text-white rounded-lg">1</button>
            <button className="px-3 py-1 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
              2
            </button>
            <button className="px-3 py-1 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}