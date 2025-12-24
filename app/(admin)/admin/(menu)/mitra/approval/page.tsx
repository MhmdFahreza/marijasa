"use client";
import React, { useState, useEffect } from "react";
import { IconSearch, IconCheck, IconX, IconEye } from "@tabler/icons-react";

export default function MitraApprovalPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMitra, setSelectedMitra] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  
  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const mitraRequests = [
    { 
      id: 1, 
      name: "Toko Sejahtera", 
      owner: "Ahmad Yani", 
      email: "ahmad@tokosejahtera.com", 
      phone: "08123456789",
      address: "Jl. Merdeka No. 123, Jakarta",
      type: "Retail",
      submitDate: "2024-12-20",
      documents: ["KTP", "NPWP", "Surat Izin Usaha"]
    },
    { 
      id: 2, 
      name: "Warung Berkah", 
      owner: "Siti Aminah", 
      email: "siti@warungberkah.com", 
      phone: "08234567890",
      address: "Jl. Pahlawan No. 45, Bandung",
      type: "Food & Beverage",
      submitDate: "2024-12-21",
      documents: ["KTP", "NPWP", "Sertifikat Halal"]
    },
    { 
      id: 3, 
      name: "Bengkel Jaya", 
      owner: "Budi Santoso", 
      email: "budi@bengkeljaya.com", 
      phone: "08345678901",
      address: "Jl. Industri No. 78, Surabaya",
      type: "Automotive",
      submitDate: "2024-12-22",
      documents: ["KTP", "NPWP", "Surat Izin Usaha"]
    },
    { 
      id: 4, 
      name: "Salon Cantik", 
      owner: "Dewi Lestari", 
      email: "dewi@saloncantik.com", 
      phone: "08456789012",
      address: "Jl. Mawar No. 12, Yogyakarta",
      type: "Beauty & Wellness",
      submitDate: "2024-12-22",
      documents: ["KTP", "NPWP", "Sertifikat Pelatihan"]
    },
  ];

  const filteredRequests = mitraRequests.filter(mitra =>
    mitra.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mitra.owner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetail = (mitra: any) => {
    setSelectedMitra(mitra);
    setShowDetailModal(true);
  };

  // Format date consistently for both server and client
  const formatDate = (dateString: string) => {
    if (!mounted) {
      // Return a simple format during SSR
      return dateString;
    }
    // Use locale formatting only on client
    return new Date(dateString).toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Approval Mitra</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Kelola permintaan pendaftaran mitra baru
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Pending Approval</p>
              <p className="text-2xl font-bold mt-2">{mitraRequests.length}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-500 flex items-center justify-center text-white">
              <span className="text-xl">⏳</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Disetujui Hari Ini</p>
              <p className="text-2xl font-bold mt-2">5</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-green-500 flex items-center justify-center text-white">
              <span className="text-xl">✅</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Ditolak Hari Ini</p>
              <p className="text-2xl font-bold mt-2">2</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-red-500 flex items-center justify-center text-white">
              <span className="text-xl">❌</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
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
            <option>Semua Kategori</option>
            <option>Retail</option>
            <option>Food & Beverage</option>
            <option>Automotive</option>
            <option>Beauty & Wellness</option>
          </select>
        </div>

        {/* Approval Cards */}
        <div className="space-y-4">
          {filteredRequests.map((mitra) => (
            <div 
              key={mitra.id} 
              className="border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left: Mitra Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#7CE0A8] to-emerald-400 flex items-center justify-center text-white font-bold text-lg">
                        {mitra.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{mitra.name}</h3>
                        <p className="text-sm text-neutral-500">Pemilik: {mitra.owner}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs font-medium">
                      {mitra.type}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Email</p>
                      <p className="text-sm font-medium">{mitra.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Telepon</p>
                      <p className="text-sm font-medium">{mitra.phone}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-neutral-500 mb-1">Alamat</p>
                      <p className="text-sm font-medium">{mitra.address}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-neutral-500 mb-2">Dokumen Dilampirkan</p>
                    <div className="flex flex-wrap gap-2">
                      {mitra.documents.map((doc, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-xs"
                        >
                          📄 {doc}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-neutral-500">
                    Diajukan pada: {formatDate(mitra.submitDate)}
                  </p>
                </div>

                {/* Right: Actions */}
                <div className="flex md:flex-col gap-3 md:w-40">
                  <button 
                    onClick={() => handleViewDetail(mitra)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <IconEye className="h-5 w-5" />
                    <span className="text-sm">Detail</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                    <IconCheck className="h-5 w-5" />
                    <span className="text-sm">Setuju</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                    <IconX className="h-5 w-5" />
                    <span className="text-sm">Tolak</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Menampilkan {filteredRequests.length} permintaan
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
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
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Detail Mitra</h3>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-700">
                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-[#7CE0A8] to-emerald-400 flex items-center justify-center text-white font-bold text-2xl">
                  {selectedMitra.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-xl">{selectedMitra.name}</h4>
                  <p className="text-neutral-500">Pemilik: {selectedMitra.owner}</p>
                </div>
              </div>

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
                  <p className="text-sm text-neutral-500 mb-1">Tanggal Pengajuan</p>
                  <p className="font-medium">
                    {formatDate(selectedMitra.submitDate)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-neutral-500 mb-1">Alamat Lengkap</p>
                  <p className="font-medium">{selectedMitra.address}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-neutral-500 mb-3">Dokumen Pendukung</p>
                <div className="space-y-2">
                  {selectedMitra.documents.map((doc: string, idx: number) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg"
                    >
                      <span className="font-medium">📄 {doc}</span>
                      <button className="text-[#7CE0A8] hover:text-[#6BC997] text-sm font-medium">
                        Lihat Dokumen
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 py-2 px-4 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  Tutup
                </button>
                <button className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                  Tolak
                </button>
                <button className="flex-1 py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                  Setujui
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}