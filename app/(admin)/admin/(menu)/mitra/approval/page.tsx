"use client";
import React, { useState, useEffect, useCallback } from "react";
import { IconSearch, IconCheck, IconX, IconEye, IconRefresh } from "@tabler/icons-react";

type Document = {
  id: string;
  type: string;
  name: string;
  url: string;
  fileName: string;
  fileType: string;
};

type GalleryItem = {
  id: string;
  url: string;
  caption: string | null;
};

type ServiceItem = {
  id: string;
  name: string;
};

type MitraRequest = {
  id: string;
  name: string;
  owner: string;
  email: string;
  phone: string;
  address: string;
  type: string;
  category: string;
  partnerType: string;
  description: string;
  avatar: string;
  serviceAreas: string[];
  tags: string[];
  submitDate: string;
  documents: Document[];
  gallery: GalleryItem[];
  services: ServiceItem[];
};

type Stats = {
  pending: number;
  approvedToday: number;
  rejectedToday: number;
};

export default function MitraApprovalPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedMitra, setSelectedMitra] = useState<MitraRequest | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [mounted, setMounted] = useState(false);
  const [mitraRequests, setMitraRequests] = useState<MitraRequest[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, approvedToday: 0, rejectedToday: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Fetch pending mitra
  const fetchPendingMitra = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/mitra/pending', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setMitraRequests(data.vendors || []);
        setStats(data.stats || { pending: 0, approvedToday: 0, rejectedToday: 0 });
      } else {
        console.error('Error fetching pending mitra');
      }
    } catch (error) {
      console.error('Error fetching pending mitra:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchPendingMitra();
  }, [fetchPendingMitra]);

  const filteredRequests = mitraRequests.filter(mitra => {
    const matchesSearch = mitra.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mitra.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || mitra.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleViewDetail = (mitra: MitraRequest) => {
    setSelectedMitra(mitra);
    setShowDetailModal(true);
  };

  const handleViewDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setShowDocumentModal(true);
  };

  const handleApprove = async (mitra: MitraRequest) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setActionError("");
    setActionSuccess("");

    try {
      const response = await fetch('/api/admin/mitra/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ vendorId: mitra.id }),
      });

      const data = await response.json();

      if (response.ok) {
        setActionSuccess(`Mitra "${mitra.name}" berhasil disetujui!`);
        setShowDetailModal(false);
        
        // Update stats immediately - increment approvedToday and decrement pending
        setStats(prevStats => ({
          pending: Math.max(0, prevStats.pending - 1),
          approvedToday: prevStats.approvedToday + 1,
          rejectedToday: prevStats.rejectedToday
        }));
        
        // Remove approved mitra from list
        setMitraRequests(prevRequests => 
          prevRequests.filter(m => m.id !== mitra.id)
        );
      } else {
        setActionError(data.message || 'Gagal menyetujui mitra');
      }
    } catch (error) {
      console.error('Error approving mitra:', error);
      setActionError('Terjadi kesalahan saat menyetujui mitra');
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        setActionSuccess("");
        setActionError("");
      }, 5000);
    }
  };

  const handleRejectClick = (mitra: MitraRequest) => {
    setSelectedMitra(mitra);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedMitra || isProcessing) return;

    setIsProcessing(true);
    setActionError("");
    setActionSuccess("");

    try {
      const response = await fetch('/api/admin/mitra/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          vendorId: selectedMitra.id,
          reason: rejectReason || 'Tidak memenuhi persyaratan',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setActionSuccess(`Pendaftaran mitra "${selectedMitra.name}" ditolak.`);
        setShowRejectModal(false);
        setShowDetailModal(false);
        
        // Update stats immediately - increment rejectedToday and decrement pending
        setStats(prevStats => ({
          pending: Math.max(0, prevStats.pending - 1),
          approvedToday: prevStats.approvedToday,
          rejectedToday: prevStats.rejectedToday + 1
        }));
        
        // Remove rejected mitra from list
        setMitraRequests(prevRequests => 
          prevRequests.filter(m => m.id !== selectedMitra.id)
        );
      } else {
        setActionError(data.message || 'Gagal menolak mitra');
      }
    } catch (error) {
      console.error('Error rejecting mitra:', error);
      setActionError('Terjadi kesalahan saat menolak mitra');
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        setActionSuccess("");
        setActionError("");
      }, 5000);
    }
  };

  const formatDate = (dateString: string) => {
    if (!mounted) {
      return dateString.split('T')[0];
    }
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getCategoryOptions = () => {
    const categories = new Set(mitraRequests.map(m => m.category));
    return Array.from(categories).filter(Boolean);
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
        <button
          onClick={fetchPendingMitra}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-[#7CE0A8] text-white rounded-lg hover:bg-[#6BC997] transition-colors disabled:opacity-50"
        >
          <IconRefresh className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Success/Error Alerts */}
      {actionSuccess && (
        <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-500 rounded-xl text-green-700 dark:text-green-400">
          {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-500 rounded-xl text-red-700 dark:text-red-400">
          {actionError}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Pending Approval</p>
              <p className="text-2xl font-bold mt-2">{stats.pending}</p>
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
              <p className="text-2xl font-bold mt-2">{stats.approvedToday}</p>
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
              <p className="text-2xl font-bold mt-2">{stats.rejectedToday}</p>
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
              placeholder="Cari mitra berdasarkan nama atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#7CE0A8]"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-transparent"
          >
            <option value="">Semua Kategori</option>
            {getCategoryOptions().map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-10 w-10 border-4 border-[#7CE0A8] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-neutral-500">Memuat data...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📋</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Tidak Ada Permintaan Pending</h3>
            <p className="text-neutral-500">Semua permintaan pendaftaran sudah diproses.</p>
          </div>
        ) : (
          /* Approval Cards */
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
                        <div className="h-12 w-12 rounded-xl overflow-hidden bg-gradient-to-br from-[#7CE0A8] to-emerald-400 flex items-center justify-center text-white font-bold text-lg">
                          {mitra.avatar && mitra.avatar !== "https://i.pravatar.cc/120" ? (
                            <img src={mitra.avatar} alt={mitra.name} className="w-full h-full object-cover" />
                          ) : (
                            mitra.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{mitra.name}</h3>
                          <p className="text-sm text-neutral-500">{mitra.email}</p>
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
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">Tipe Mitra</p>
                        <p className="text-sm font-medium capitalize">{mitra.partnerType.toLowerCase()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">Jangkauan Layanan</p>
                        <p className="text-sm font-medium">{mitra.serviceAreas.slice(0, 2).join(', ')}{mitra.serviceAreas.length > 2 ? ` +${mitra.serviceAreas.length - 2} lainnya` : ''}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-neutral-500 mb-2">Dokumen Dilampirkan</p>
                      <div className="flex flex-wrap gap-2">
                        {mitra.documents.map((doc) => (
                          <button
                            key={doc.id}
                            onClick={() => handleViewDocument(doc)}
                            className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-xs hover:bg-[#7CE0A8]/20 hover:text-[#7CE0A8] transition-colors"
                          >
                            📄 {doc.name}
                          </button>
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
                    <button
                      onClick={() => handleApprove(mitra)}
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      <IconCheck className="h-5 w-5" />
                      <span className="text-sm">Setuju</span>
                    </button>
                    <button
                      onClick={() => handleRejectClick(mitra)}
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      <IconX className="h-5 w-5" />
                      <span className="text-sm">Tolak</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Info */}
        {filteredRequests.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Menampilkan {filteredRequests.length} permintaan
            </p>
          </div>
        )}
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
                <IconX className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex items-center gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-700">
                <div className="h-16 w-16 rounded-xl overflow-hidden bg-gradient-to-br from-[#7CE0A8] to-emerald-400 flex items-center justify-center text-white font-bold text-2xl">
                  {selectedMitra.avatar && selectedMitra.avatar !== "https://i.pravatar.cc/120" ? (
                    <img src={selectedMitra.avatar} alt={selectedMitra.name} className="w-full h-full object-cover" />
                  ) : (
                    selectedMitra.name.charAt(0)
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-xl">{selectedMitra.name}</h4>
                  <p className="text-neutral-500">{selectedMitra.email}</p>
                </div>
              </div>

              {/* Basic Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Kategori</p>
                  <p className="font-medium">{selectedMitra.type}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Tipe Mitra</p>
                  <p className="font-medium capitalize">{selectedMitra.partnerType.toLowerCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Telepon</p>
                  <p className="font-medium">{selectedMitra.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Tanggal Pengajuan</p>
                  <p className="font-medium">{formatDate(selectedMitra.submitDate)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-neutral-500 mb-1">Alamat Lengkap</p>
                  <p className="font-medium">{selectedMitra.address || '-'}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-sm text-neutral-500 mb-2">Deskripsi</p>
                <p className="text-sm bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4">
                  {selectedMitra.description}
                </p>
              </div>

              {/* Services/Tags */}
              <div>
                <p className="text-sm text-neutral-500 mb-2">Layanan yang Ditawarkan</p>
                <div className="flex flex-wrap gap-2">
                  {selectedMitra.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-[#7CE0A8]/20 text-[#7CE0A8] rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Service Areas */}
              <div>
                <p className="text-sm text-neutral-500 mb-2">Jangkauan Layanan</p>
                <div className="flex flex-wrap gap-2">
                  {selectedMitra.serviceAreas.map((area, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              {/* Gallery */}
              {selectedMitra.gallery.length > 0 && (
                <div>
                  <p className="text-sm text-neutral-500 mb-3">Hasil Pekerjaan</p>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedMitra.gallery.map((img) => (
                      <div key={img.id} className="aspect-square rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-700">
                        <img
                          src={img.url}
                          alt={img.caption || 'Gallery'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              <div>
                <p className="text-sm text-neutral-500 mb-3">Dokumen Pendukung</p>
                <div className="space-y-2">
                  {selectedMitra.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg"
                    >
                      <span className="font-medium">📄 {doc.name}</span>
                      <button
                        onClick={() => handleViewDocument(doc)}
                        className="text-[#7CE0A8] hover:text-[#6BC997] text-sm font-medium"
                      >
                        Lihat Dokumen
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 py-2 px-4 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  Tutup
                </button>
                <button
                  onClick={() => handleRejectClick(selectedMitra)}
                  disabled={isProcessing}
                  className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  Tolak
                </button>
                <button
                  onClick={() => handleApprove(selectedMitra)}
                  disabled={isProcessing}
                  className="flex-1 py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Memproses...' : 'Setujui'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedMitra && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Tolak Pendaftaran</h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>

            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Anda akan menolak pendaftaran mitra <strong>{selectedMitra.name}</strong>. Data pendaftaran akan dihapus dan email notifikasi akan dikirim.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Alasan Penolakan</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Masukkan alasan penolakan (opsional)..."
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#7CE0A8]"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-2 px-4 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={isProcessing}
                className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Memproses...' : 'Konfirmasi Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {showDocumentModal && selectedDocument && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="font-semibold">{selectedDocument.name}</h3>
              <button
                onClick={() => setShowDocumentModal(false)}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 max-h-[calc(90vh-80px)] overflow-auto">
              {selectedDocument.fileType.includes('image') ? (
                <img
                  src={selectedDocument.url}
                  alt={selectedDocument.name}
                  className="max-w-full h-auto mx-auto rounded-lg"
                />
              ) : selectedDocument.fileType.includes('pdf') ? (
                <iframe
                  src={selectedDocument.url}
                  className="w-full h-[70vh] rounded-lg"
                  title={selectedDocument.name}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-neutral-500 mb-4">Preview tidak tersedia untuk tipe file ini.</p>
                  <a
                    href={selectedDocument.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-[#7CE0A8] text-white rounded-lg hover:bg-[#6BC997] transition-colors"
                  >
                    Download Dokumen
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}