// page.tsx (/mitra/rating)
"use client";
import React, { useState } from 'react';
import { Star, Filter, ChevronDown, Calendar, User, CheckCircle, MessageCircle, ThumbsUp, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Data contoh ulasan
const reviewData = {
  totalReviews: 74,
  averageRating: 4.3,
  ratingBreakdown: {
    5: 45,
    4: 18,
    3: 8,
    2: 2,
    1: 1
  }
};

const reviews = [
  {
    id: 1,
    userName: "Anonymous",
    userAvatar: "https://i.pravatar.cc/150?img=1",
    rating: 4,
    date: "24 Jul 2025",
    comment: "Sangat baik 👍 Pekerjaan rapi dan cepat selesai. Tukangnya ramah dan profesional.",
    photos: ["https://picsum.photos/seed/r1/300/200", "https://picsum.photos/seed/r2/300/200"],
    serviceType: "Service AC",
    response: {
      vendorReply: "Terima kasih atas ulasannya! Kami selalu berusaha memberikan pelayanan terbaik.",
      replyDate: "25 Jul 2025"
    },
    helpfulCount: 12
  },
  {
    id: 2,
    userName: "Anonymous",
    userAvatar: "https://i.pravatar.cc/150?img=2",
    rating: 5,
    date: "15 Jun 2024",
    comment: "Pekerjaan bersih dan hasil maksimal. Harga sesuai dengan kualitas yang diberikan.",
    photos: [],
    serviceType: "Instalasi Listrik",
    helpfulCount: 8
  },
  {
    id: 3,
    userName: "Isabella",
    userAvatar: "https://i.pravatar.cc/150?img=3",
    rating: 5,
    date: "05 Jun 2024",
    comment: "Puas dengan pelayanan. Teknisi datang tepat waktu dan menyelesaikan masalah dengan baik.",
    photos: ["https://picsum.photos/seed/r3/300/200"],
    serviceType: "Perbaikan AC",
    response: {
      vendorReply: "Senang mendengar Anda puas dengan pelayanan kami. Terima kasih atas kepercayaannya!",
      replyDate: "06 Jun 2024"
    },
    helpfulCount: 15
  },
  {
    id: 4,
    userName: "Ahmad Rizki",
    userAvatar: "https://i.pravatar.cc/150?img=4",
    rating: 4,
    date: "28 Mei 2024",
    comment: "Pelayanan memuaskan, tapi agak telat 30 menit dari janji. Hasil pekerjaan bagus.",
    photos: [],
    serviceType: "Cuci AC",
    helpfulCount: 5
  },
  {
    id: 5,
    userName: "Budi Santoso",
    userAvatar: "https://i.pravatar.cc/150?img=5",
    rating: 5,
    date: "15 Mei 2024",
    comment: "Sangat profesional! Membersihkan AC dengan detail dan memberikan tips perawatan.",
    photos: ["https://picsum.photos/seed/r4/300/200", "https://picsum.photos/seed/r5/300/200"],
    serviceType: "Maintenance AC",
    response: {
      vendorReply: "Terima kasih pak Budi! Kami senang bisa membantu merawat AC bapak.",
      replyDate: "16 Mei 2024"
    },
    helpfulCount: 20
  },
  {
    id: 6,
    userName: "Diana Putri",
    userAvatar: "https://i.pravatar.cc/150?img=6",
    rating: 3,
    date: "10 Mei 2024",
    comment: "Cukup baik, tapi harga agak mahal dibanding tempat lain. Kualitas oke.",
    photos: [],
    serviceType: "Service AC",
    helpfulCount: 3
  }
];

export default function UlasanPage() {
  const [filter, setFilter] = useState('semua');
  const [sortBy, setSortBy] = useState('terbaru');
  const [expandedReviews, setExpandedReviews] = useState<number[]>([]);

  const toggleReviewExpansion = (id: number) => {
    if (expandedReviews.includes(id)) {
      setExpandedReviews(expandedReviews.filter(reviewId => reviewId !== id));
    } else {
      setExpandedReviews([...expandedReviews, id]);
    }
  };

  const filteredReviews = reviews.filter(review => {
    if (filter === 'semua') return true;
    if (filter === 'dengan-foto') return review.photos.length > 0;
    if (filter === 'dengan-balasan') return review.response;
    return true;
  });

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (sortBy === 'terbaru') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortBy === 'rating-tinggi') {
      return b.rating - a.rating;
    }
    if (sortBy === 'rating-rendah') {
      return a.rating - b.rating;
    }
    return 0;
  });

  // Fungsi untuk menampilkan bintang
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 md:w-5 md:h-5 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
      />
    ));
  };

  // Fungsi untuk menghitung persentase rating
  const calculatePercentage = (count: number) => {
    return (count / reviewData.totalReviews) * 100;
  };

  return (
    <div className="animate-fadeIn p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-2">
          Rating User
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Kelola dan lihat ulasan dari pelanggan Anda
        </p>
      </div>

      {/* Ringkasan Rating */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Card Rating Utama */}
        <div className="bg-gradient-to-br from-[#7CE0A8] to-[#5DD494] rounded-xl p-6 text-white shadow-lg">
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-5xl md:text-6xl font-bold mb-2">
              {reviewData.averageRating.toFixed(1)}
            </div>
            <div className="flex items-center mb-3">
              {renderStars(Math.round(reviewData.averageRating))}
            </div>
            <div className="text-lg font-medium">
              {reviewData.totalReviews} Ulasan
            </div>
            <div className="text-sm opacity-90 mt-2">
              Rating Keseluruhan
            </div>
          </div>
        </div>

        {/* Breakdown Rating */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Detail Rating
          </h3>
          
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center">
                <div className="flex items-center w-16">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mr-2">
                    {star}
                  </span>
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                </div>
                
                <div className="flex-1 mx-3">
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-[#7CE0A8] to-[#5DD494] h-2 rounded-full"
                      style={{ width: `${calculatePercentage(reviewData.ratingBreakdown[star as keyof typeof reviewData.ratingBreakdown] || 0)}%` }}
                    />
                  </div>
                </div>
                
                <div className="w-12 text-right">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {reviewData.ratingBreakdown[star as keyof typeof reviewData.ratingBreakdown] || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {reviews.filter(r => r.rating === 5).length}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Rating 5
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {reviews.filter(r => r.rating >= 4).length}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Rating 4+
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {reviews.filter(r => r.photos.length > 0).length}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Dengan Foto
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {reviews.filter(r => r.response).length}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Dibalas
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter dan Sort */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 mb-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-neutral-500" />
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-[#7CE0A8] focus:border-transparent"
              >
                <option value="semua">Semua Ulasan</option>
                <option value="dengan-foto">Dengan Foto</option>
                <option value="dengan-balasan">Dengan Balasan</option>
                <option value="rating-tinggi">Rating Tinggi</option>
                <option value="rating-rendah">Rating Rendah</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-neutral-500" />
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-[#7CE0A8] focus:border-transparent"
              >
                <option value="terbaru">Terbaru</option>
                <option value="rating-tinggi">Rating Tertinggi</option>
                <option value="rating-rendah">Rating Terendah</option>
                <option value="terlama">Terlama</option>
              </select>
            </div>
          </div>
          
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Menampilkan {sortedReviews.length} dari {reviews.length} ulasan
          </div>
        </div>
      </div>

      {/* Daftar Ulasan */}
      <div className="space-y-4 md:space-y-6">
        <AnimatePresence>
          {sortedReviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white dark:bg-neutral-800 rounded-xl p-4 md:p-6 shadow-lg border border-neutral-200 dark:border-neutral-700"
            >
              {/* Header Ulasan */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img 
                    src={review.userAvatar} 
                    alt={review.userName}
                    className="w-12 h-12 rounded-full border-2 border-[#7CE0A8]"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-neutral-900 dark:text-white">
                        {review.userName}
                      </h4>
                      {review.userName !== "Anonymous" && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex">
                        {renderStars(review.rating)}
                      </div>
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">
                        • {review.date}
                      </span>
                      <span className="text-sm px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded-full">
                        {review.serviceType}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg">
                  <MoreVertical className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              {/* Komentar */}
              <div className="mb-4">
                <p className={`text-neutral-700 dark:text-neutral-300 ${!expandedReviews.includes(review.id) ? 'line-clamp-2' : ''}`}>
                  {review.comment}
                </p>
                {review.comment.length > 100 && (
                  <button
                    onClick={() => toggleReviewExpansion(review.id)}
                    className="text-[#7CE0A8] hover:text-[#5DD494] font-medium text-sm mt-1"
                  >
                    {expandedReviews.includes(review.id) ? 'Tutup' : 'Baca selengkapnya'}
                  </button>
                )}
              </div>

              {/* Foto-foto */}
              {review.photos.length > 0 && (
                <div className="mb-4">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {review.photos.map((photo, idx) => (
                      <img
                        key={idx}
                        src={photo}
                        alt={`Foto ulasan ${idx + 1}`}
                        className="w-24 h-24 md:w-32 md:h-32 rounded-lg object-cover flex-shrink-0 hover:scale-105 transition-transform cursor-pointer"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Balasan Vendor */}
              {review.response && (
                <div className="mb-4 p-4 bg-gradient-to-r from-[#7CE0A8]/10 to-[#5DD494]/10 rounded-lg border border-[#7CE0A8]/20">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#7CE0A8] flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-[#7CE0A8]">Balasan Anda</span>
                        <span className="text-xs text-neutral-500">• {review.response.replyDate}</span>
                      </div>
                      <p className="text-neutral-700 dark:text-neutral-300">
                        {review.response.vendorReply}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Ulasan */}
              <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-[#7CE0A8] transition-colors">
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-sm">Membantu ({review.helpfulCount})</span>
                  </button>
                  
                  {!review.response && (
                    <button className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-[#7CE0A8] transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm">Balas Ulasan</span>
                    </button>
                  )}
                </div>
                
                <button className="text-sm text-[#7CE0A8] hover:text-[#5DD494] font-medium">
                  {review.response ? 'Edit Balasan' : 'Balas Ulasan'}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      <div className="mt-8 flex justify-center">
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700">
            Sebelumnya
          </button>
          <button className="px-3 py-2 rounded-lg bg-gradient-to-r from-[#7CE0A8] to-[#5DD494] text-white">
            1
          </button>
          <button className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700">
            2
          </button>
          <button className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700">
            3
          </button>
          <span className="px-2 text-neutral-500">...</span>
          <button className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700">
            10
          </button>
          <button className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700">
            Selanjutnya
          </button>
        </div>
      </div>

      {/* Statistik Ringkas Mobile */}
      <div className="lg:hidden mt-6 bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-lg border border-neutral-200 dark:border-neutral-700">
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">
          Ringkasan Bulan Ini
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gradient-to-br from-[#7CE0A8]/10 to-[#5DD494]/10 rounded-lg">
            <div className="text-2xl font-bold text-[#7CE0A8]">12</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Ulasan Baru</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-[#7CE0A8]/10 to-[#5DD494]/10 rounded-lg">
            <div className="text-2xl font-bold text-[#7CE0A8]">4.5</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Rating Rata-rata</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-[#7CE0A8]/10 to-[#5DD494]/10 rounded-lg">
            <div className="text-2xl font-bold text-[#7CE0A8]">98%</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Kepuasan</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-[#7CE0A8]/10 to-[#5DD494]/10 rounded-lg">
            <div className="text-2xl font-bold text-[#7CE0A8]">8</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Dibalas</div>
          </div>
        </div>
      </div>
    </div>
  );
}