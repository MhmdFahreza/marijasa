"use client";
import React, { useState } from "react";
import { IconSearch, IconEdit, IconTrash, IconEye, IconChartBar } from "@tabler/icons-react";

export default function MitraMemberPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMitra, setSelectedMitra] = useState<any>(null);
  
  const mitraMembers = [
    { 
      id: 1, 
      name: "Toko Makmur", 
      owner: "Hendra Wijaya", 
      email: "hendra@tokomakmur.com", 
      phone: "08123456789",
      address: "Jl. Raya No. 100, Jakarta",
      type: "Retail",
      joinDate: "2024-01-15",
      status: "active",
      totalTransactions: 245,
      revenue: 12500000
    },
    { 
      id: 2, 
      name: "Resto Sedap", 
      owner: "Maya Kusuma", 
      email: "maya@restosedap.com", 
      phone: "08234567890",
      address: "Jl. Kuliner No. 25, Bandung",
      type: "Food & Beverage",
      joinDate: "2024-02-20",
      status: "active",
      totalTransactions: 189,
      revenue: 8900000
    },
    { 
      id: 3, 
      name: "Service Motor Pro", 
      owner: "Agus Santoso", 
      email: "agus@servicemotor.com", 
      phone: "08345678901",
      address: "Jl. Raya Timur No. 55, Surabaya",
      type: "Automotive",
      joinDate: "2024-03-10",
      status: "active",
      totalTransactions: 312,
      revenue: 15600000
    },
    { 
      id: 4, 
      name: "Klinik Sehat", 
      owner: "Dr. Fitri", 
      email: "fitri@kliniksehat.com", 
      phone: "08456789012",
      address: "Jl. Kesehatan No. 8, Yogyakarta",
      type: "Healthcare",
      joinDate: "2024-04-05",
      status: "inactive",
      totalTransactions: 98,
      revenue: 4500000
    },
    { 
      id: 5, 
      name: "Gym Fit", 
      owner: "Rudi Hartono", 
      email: "rudi@gymfit.com", 
      phone: "08567890123",
      address: "Jl. Olahraga No. 32, Semarang",
      type: "Fitness",
      joinDate: "2024-05-12",
      status: "active",
      totalTransactions: 167,
      revenue: 7800000
    },
  ];

  const filteredMembers = mitraMembers.filter(mitra =>
    mitra.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mitra.owner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetail = (mitra: any) => {
    setSelectedMitra(mitra);
    setShowDetailModal(true);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Member Mitra</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Kelola mitra yang sudah terdaftar
          </p>
        </div>
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
              <p className="text-2xl font-bold mt-2">
                {mitraMembers.filter(m => m.status === 'active').length}
              </p>
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
              <p className="text-2xl font-bold mt-2">
                {mitraMembers.reduce((sum, m) => sum + m.totalTransactions, 0)}
              </p>
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
                Rp {new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(
                  mitraMembers.reduce((sum, m) => sum + m.revenue, 0)
                )}
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
              placeholder="Cari mitra berdasarkan nama atau pemilik..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#7CE0A8]"
            />
          </div>
          <select className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-transparent">
            <option>Semua Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
          <select className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-transparent">
            <option>Semua Kategori</option>
            <option>Retail</option>
            <option>Food & Beverage</option>
            <option>Automotive</option>
            <option>Healthcare</option>
            <option>Fitness</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700">
                <th className="text-left py-3 px-4 font-semibold text-sm">No</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Nama Mitra</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Pemilik</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Kategori</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Transaksi</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Revenue</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((mitra, index) => (
                <tr key={mitra.id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-750">
                  <td className="py-3 px-4 text-sm">{index + 1}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7CE0A8] to-emerald-400 flex items-center justify-center text-white font-bold">
                        {mitra.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{mitra.name}</p>
                        <p className="text-xs text-neutral-500">{mitra.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium">{mitra.owner}</p>
                    <p className="text-xs text-neutral-500">{mitra.phone}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-md text-xs">
                      {mitra.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center gap-2">
                      <IconChartBar className="h-4 w-4 text-neutral-500" />
                      <span className="font-semibold">{mitra.totalTransactions}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-green-600">
                      Rp {new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(mitra.revenue)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      mitra.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {mitra.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleViewDetail(mitra)}
                        className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        <IconEye className="h-4 w-4 text-blue-600" />
                      </button>
                      <button className="p-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors">
                        <IconEdit className="h-4 w-4 text-amber-600" />
                      </button>
                      <button className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <IconTrash className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Menampilkan {filteredMembers.length} dari {mitraMembers.length} mitra
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
                <IconEdit className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-700">
                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-[#7CE0A8] to-emerald-400 flex items-center justify-center text-white font-bold text-2xl">
                  {selectedMitra.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-xl">{selectedMitra.name}</h4>
                  <p className="text-neutral-500">Pemilik: {selectedMitra.owner}</p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  selectedMitra.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {selectedMitra.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Total Transaksi</p>
                  <p className="text-2xl font-bold">{selectedMitra.totalTransactions}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                  <p className="text-sm text-green-600 dark:text-green-400 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold">
                    Rp {new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(selectedMitra.revenue)}
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                  <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">Avg. per Transaksi</p>
                  <p className="text-2xl font-bold">
                    Rp {new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(
                      selectedMitra.revenue / selectedMitra.totalTransactions
                    )}
                  </p>
                </div>
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Kategori</p>
                  <p className="font-medium">{selectedMitra.type}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Email</p>
                  <p className="font-medium">{selectedMitra.email}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Telepon</p>
                  <p className="font-medium">{selectedMitra.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Tanggal Bergabung</p>
                  <p className="font-medium">
                    {new Date(selectedMitra.joinDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-neutral-500 mb-1">Alamat</p>
                  <p className="font-medium">{selectedMitra.address}</p>
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