"use client";
import React, { useState, useEffect } from "react";
import { IconSearch, IconEdit, IconTrash, IconEye, IconChartBar, IconLoader, IconAlertCircle } from "@tabler/icons-react";

interface MitraData {
  vendor_id: string;
  name: string;
  email: string;
  phone: string;
  description: string;
  category: string | null;
  status: string;
  verified: boolean;
  rating: number;
  review_count: number;
  service_areas: string[];
  specialties: string[];
  join_date: string;
  avatar: string | null;
  _count: {
    bookings: number;
  };
  totalRevenue: number;
}

export default function MitraMemberPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMitra, setSelectedMitra] = useState<MitraData | null>(null);
  const [mitraMembers, setMitraMembers] = useState<MitraData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  // Fetch data from API
  useEffect(() => {
    fetchMitraData();
  }, []);

  const fetchMitraData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching mitra data...");
      
      const response = await fetch("/api/admin/mitra/members", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      console.log("Response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Received data:", data);
      
      if (data.success) {
        setMitraMembers(data.data || []);
      } else {
        setError(data.error || "Failed to fetch mitra data");
      }
    } catch (error) {
      console.error("Error fetching mitra data:", error);
      setError(error instanceof Error ? error.message : "Terjadi kesalahan saat mengambil data");
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = mitraMembers.filter(mitra => {
    const matchesSearch = 
      mitra.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mitra.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || mitra.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesCategory = filterCategory === "all" || mitra.category === filterCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleViewDetail = (mitra: MitraData) => {
    setSelectedMitra(mitra);
    setShowDetailModal(true);
  };

  const handleDelete = async (vendorId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus mitra ini?")) return;

    try {
      const response = await fetch(`/api/admin/mitra/members/${vendorId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert("Mitra berhasil dihapus");
        fetchMitraData();
      } else {
        alert("Gagal menghapus mitra: " + data.error);
      }
    } catch (error) {
      console.error("Error deleting mitra:", error);
      alert("Terjadi kesalahan saat menghapus mitra");
    }
  };

  const getStatusDisplay = (status: string) => {
    const statusMap: { [key: string]: string } = {
      ACTIVE: "Aktif",
      PENDING: "Menunggu",
      SUSPENDED: "Ditangguhkan",
      REJECTED: "Ditolak"
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      SUSPENDED: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  const totalRevenue = mitraMembers.reduce((sum, m) => sum + (m.totalRevenue || 0), 0);
  const totalTransactions = mitraMembers.reduce((sum, m) => sum + m._count.bookings, 0);
  const activeMitra = mitraMembers.filter(m => m.status === "ACTIVE").length;

  // Get unique categories for filter
  const categories = Array.from(new Set(mitraMembers.map(m => m.category).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <IconLoader className="h-12 w-12 animate-spin text-[#7CE0A8]" />
        <p className="text-neutral-600 dark:text-neutral-400">Memuat data mitra...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <IconAlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-600 dark:text-red-400 text-center">
          {error}
        </p>
        <button
          onClick={fetchMitraData}
          className="px-4 py-2 bg-[#7CE0A8] text-white rounded-lg hover:bg-[#6BC997] transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Member Mitra</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Kelola mitra yang sudah terdaftar
          </p>
        </div>
        <button
          onClick={fetchMitraData}
          className="px-4 py-2 bg-[#7CE0A8] text-white rounded-lg hover:bg-[#6BC997] transition-colors flex items-center gap-2"
        >
          <IconLoader className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Mitra</p>
              <p className="text-2xl font-bold mt-2">{mitraMembers.length}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center text-white">
              <span className="text-xl">🏪</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Mitra Aktif</p>
              <p className="text-2xl font-bold mt-2">{activeMitra}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-green-500 flex items-center justify-center text-white">
              <span className="text-xl">✅</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Transaksi</p>
              <p className="text-2xl font-bold mt-2">{totalTransactions}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-purple-500 flex items-center justify-center text-white">
              <span className="text-xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Revenue</p>
              <p className="text-xl font-bold mt-2">
                Rp {new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(totalRevenue)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
              <span className="text-xl">📊</span>
            </div>
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
              placeholder="Cari mitra berdasarkan nama atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#7CE0A8]"
            />
          </div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-transparent"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="pending">Menunggu</option>
            <option value="suspended">Ditangguhkan</option>
            <option value="rejected">Ditolak</option>
          </select>
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-transparent"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((category) => (
              <option key={category} value={category || ""}>{category || "Tidak Ada Kategori"}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700">
                <th className="text-left py-3 px-4 font-semibold text-sm">No</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Nama Mitra</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Kontak</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Kategori</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Rating</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Transaksi</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Revenue</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-neutral-500">
                    {mitraMembers.length === 0 ? "Belum ada data mitra" : "Tidak ada data yang sesuai dengan filter"}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((mitra, index) => (
                  <tr key={mitra.vendor_id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-750">
                    <td className="py-3 px-4 text-sm">{index + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7CE0A8] to-emerald-400 flex items-center justify-center text-white font-bold overflow-hidden">
                          {mitra.avatar ? (
                            <img src={mitra.avatar} alt={mitra.name} className="w-full h-full object-cover" />
                          ) : (
                            mitra.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{mitra.name}</p>
                          <p className="text-xs text-neutral-500">{mitra.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium">{mitra.phone}</p>
                      {mitra.verified && (
                        <span className="text-xs text-green-600">✓ Terverifikasi</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-md text-xs">
                        {mitra.category || "Belum ada"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span className="font-semibold">{mitra.rating.toFixed(1)}</span>
                        <span className="text-xs text-neutral-500">({mitra.review_count})</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center gap-2">
                        <IconChartBar className="h-4 w-4 text-neutral-500" />
                        <span className="font-semibold">{mitra._count.bookings}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-green-600">
                        Rp {new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(mitra.totalRevenue || 0)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(mitra.status)}`}>
                        {getStatusDisplay(mitra.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleViewDetail(mitra)}
                          className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Lihat Detail"
                        >
                          <IconEye className="h-4 w-4 text-blue-600" />
                        </button>
                        <button 
                          className="p-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <IconEdit className="h-4 w-4 text-amber-600" />
                        </button>
                        <button 
                          onClick={() => handleDelete(mitra.vendor_id)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <IconTrash className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Menampilkan {filteredMembers.length} dari {mitraMembers.length} mitra
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50">
              Previous
            </button>
            <button className="px-3 py-1 bg-[#7CE0A8] text-white rounded-lg">1</button>
            <button className="px-3 py-1 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedMitra && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Detail Mitra</h3>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-700">
                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-[#7CE0A8] to-emerald-400 flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
                  {selectedMitra.avatar ? (
                    <img src={selectedMitra.avatar} alt={selectedMitra.name} className="w-full h-full object-cover" />
                  ) : (
                    selectedMitra.name.charAt(0)
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-xl">{selectedMitra.name}</h4>
                  <p className="text-neutral-500">{selectedMitra.email}</p>
                  {selectedMitra.verified && (
                    <span className="text-sm text-green-600">✓ Terverifikasi</span>
                  )}
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedMitra.status)}`}>
                  {getStatusDisplay(selectedMitra.status)}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Total Transaksi</p>
                  <p className="text-2xl font-bold">{selectedMitra._count.bookings}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                  <p className="text-sm text-green-600 dark:text-green-400 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold">
                    Rp {new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(selectedMitra.totalRevenue || 0)}
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                  <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">Rating</p>
                  <p className="text-2xl font-bold flex items-center gap-1">
                    {selectedMitra.rating.toFixed(1)} <span className="text-yellow-500">★</span>
                  </p>
                  <p className="text-xs text-neutral-500">{selectedMitra.review_count} ulasan</p>
                </div>
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Kategori</p>
                  <p className="font-medium">{selectedMitra.category || "Belum ada kategori"}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Telepon</p>
                  <p className="font-medium">{selectedMitra.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Tanggal Bergabung</p>
                  <p className="font-medium">
                    {new Date(selectedMitra.join_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Area Layanan</p>
                  <p className="font-medium">{selectedMitra.service_areas.join(", ") || "Belum ada"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-neutral-500 mb-1">Spesialisasi</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedMitra.specialties.length > 0 ? (
                      selectedMitra.specialties.map((spec, idx) => (
                        <span key={idx} className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded text-sm">
                          {spec}
                        </span>
                      ))
                    ) : (
                      <span className="text-neutral-500">Belum ada spesialisasi</span>
                    )}
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-neutral-500 mb-1">Deskripsi</p>
                  <p className="font-medium">{selectedMitra.description}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 py-2 px-4 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  Tutup
                </button>
                <button className="flex-1 py-2 px-4 bg-[#7CE0A8] text-white rounded-lg hover:bg-[#6BC997] transition-colors">
                  Edit Mitra
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}