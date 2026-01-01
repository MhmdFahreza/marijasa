// app/mitra/rating/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Star, Filter, ChevronDown, Calendar, User, CheckCircle, MessageCircle, ThumbsUp, MoreVertical, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Type untuk Review
type Review = {
  id: string;
  orderId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  serviceType: string;
  date: string;
  photos?: string[];
  response?: {
    vendorReply: string;
    replyDate: string;
  };
  helpfulCount: number;
};

export default function UlasanPage() {
  const [filter, setFilter] = useState('semua');
  const [sortBy, setSortBy] = useState('terbaru');
  const [expandedReviews, setExpandedReviews] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vendorId, setVendorId] = useState<string>('');
  const [vendorName, setVendorName] = useState<string>('');

  // Load vendor info dan reviews
  useEffect(() => {
    const loadData = () => {
      try {
        // Ambil data vendor yang sedang login
        const mitraUser = localStorage.getItem('mitraUser');
        if (!mitraUser) {
          setIsLoading(false);
          return;
        }

        const vendor = JSON.parse(mitraUser);
        setVendorId(vendor.id);
        setVendorName(vendor.name);

        // Load semua orders dari user
        const userOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');

        // Filter orders yang selesai, punya rating, dan sesuai dengan vendor ini
        const vendorReviews: Review[] = userOrders
          .filter((order: any) => 
            order.status === 'selesai' && 
            order.rating && 
            order.rating > 0 &&
            (order.vendor?.id === vendor.id || 
             order.vendorId === vendor.id ||
             order.vendor?.name === vendor.name || 
             order.vendorName === vendor.name)
          )
          .map((order: any) => {
            const userName = order.customerInfo?.name || 
                           JSON.parse(localStorage.getItem('userProfile') || '{}').name || 
                           "Anonymous";
            const userEmail = order.customerInfo?.email || 
                            JSON.parse(localStorage.getItem('user') || '{}').email || 
                            "";
            const userAvatar = JSON.parse(localStorage.getItem('userProfile') || '{}').avatar || "";

            return {
              id: order.id || order.orderId,
              orderId: order.id || order.orderId,
              userName: userName,
              userEmail: userEmail,
              userAvatar: userAvatar,
              rating: order.rating,
              comment: order.review || "",
              serviceType: order.serviceType || "Layanan",
              date: order.orderHistory?.find((h: any) => h.status === "Rating dan Ulasan Diberikan")?.date ||
                    new Date().toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long', 
                      year: 'numeric'
                    }),
              photos: [],
              response: order.vendorResponse || undefined,
              helpfulCount: order.helpfulCount || 0
            };
          })
          // Sort by date (newest first)
          .sort((a: Review, b: Review) => {
            const dateA = new Date(a.date.split(' - ')[0]);
            const dateB = new Date(b.date.split(' - ')[0]);
            return dateB.getTime() - dateA.getTime();
          });

        setReviews(vendorReviews);
      } catch (error) {
        console.error('Error loading reviews:', error);
        setReviews([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Listen untuk storage changes
    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const toggleReviewExpansion = (id: string) => {
    if (expandedReviews.includes(id)) {
      setExpandedReviews(expandedReviews.filter(reviewId => reviewId !== id));
    } else {
      setExpandedReviews([...expandedReviews, id]);
    }
  };

  // Hitung data statistik
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
    : 0;

  const ratingBreakdown = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length
  };

  const filteredReviews = reviews.filter(review => {
    if (filter === 'semua') return true;
    if (filter === 'dengan-foto') return review.photos && review.photos.length > 0;
    if (filter === 'dengan-balasan') return review.response;
    if (filter === 'rating-tinggi') return review.rating >= 4;
    if (filter === 'rating-rendah') return review.rating <= 2;
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
    if (sortBy === 'terlama') {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
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
    if (totalReviews === 0) return 0;
    return (count / totalReviews) * 100;
  };

  if (isLoading) {
    return (
      <div className="animate-fadeIn p-4 md:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7CE0A8] mx-auto mb-4"></div>
            <p className="text-muted-foreground">Memuat ulasan...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-2">
          Rating & Ulasan
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
              {averageRating.toFixed(1)}
            </div>
            <div className="flex items-center mb-3">
              {renderStars(Math.round(averageRating))}
            </div>
            <div className="text-lg font-medium">
              {totalReviews} Ulasan
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
                      className="bg-gradient-to-r from-[#7CE0A8] to-[#5DD494] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${calculatePercentage(ratingBreakdown[star as keyof typeof ratingBreakdown])}%` }}
                    />
                  </div>
                </div>
                
                <div className="w-12 text-right">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {ratingBreakdown[star as keyof typeof ratingBreakdown]}
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
                  {reviews.filter(r => r.photos && r.photos.length > 0).length}
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
          <div className="flex items-center gap-4 flex-wrap">
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
                <option value="rating-tinggi">Rating Tinggi (4-5)</option>
                <option value="rating-rendah">Rating Rendah (1-2)</option>
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
      {sortedReviews.length === 0 ? (
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-12 shadow-lg border border-neutral-200 dark:border-neutral-700 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-[#7CE0A8]/20 to-[#5DD494]/20 rounded-full flex items-center justify-center mb-4">
              <Star className="w-12 h-12 text-[#7CE0A8]" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              {filter === 'semua' ? 'Belum Ada Ulasan' : 'Tidak Ada Ulasan yang Sesuai'}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 max-w-md">
              {filter === 'semua' 
                ? 'Anda belum memiliki ulasan dari pelanggan. Ulasan akan muncul di sini setelah pelanggan memberikan rating untuk layanan Anda.'
                : 'Tidak ada ulasan yang sesuai dengan filter yang dipilih. Coba ubah filter untuk melihat ulasan lainnya.'}
            </p>
          </div>
        </div>
      ) : (
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
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7CE0A8]/20 to-[#5DD494]/20 flex items-center justify-center flex-shrink-0">
                      {review.userAvatar ? (
                        <img 
                          src={review.userAvatar} 
                          alt={review.userName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-[#7CE0A8]" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-neutral-900 dark:text-white">
                          {review.userName}
                        </h4>
                        {review.userName !== "Anonymous" && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                  
                  <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-neutral-500" />
                  </button>
                </div>

                {/* Komentar */}
                {review.comment && (
                  <div className="mb-4">
                    <p className={`text-neutral-700 dark:text-neutral-300 ${!expandedReviews.includes(review.id) && review.comment.length > 100 ? 'line-clamp-2' : ''}`}>
                      {review.comment}
                    </p>
                    {review.comment.length > 100 && (
                      <button
                        onClick={() => toggleReviewExpansion(review.id)}
                        className="text-[#7CE0A8] hover:text-[#5DD494] font-medium text-sm mt-1 transition-colors"
                      >
                        {expandedReviews.includes(review.id) ? 'Tutup' : 'Baca selengkapnya'}
                      </button>
                    )}
                  </div>
                )}

                {/* Foto-foto */}
                {review.photos && review.photos.length > 0 && (
                  <div className="mb-4">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {review.photos.map((photo: string, idx: number) => (
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
                  
                  <button className="text-sm text-[#7CE0A8] hover:text-[#5DD494] font-medium transition-colors">
                    {review.response ? 'Edit Balasan' : 'Balas Ulasan'}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination - Hidden when empty */}
      {sortedReviews.length > 10 && (
        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
              Sebelumnya
            </button>
            <button className="px-3 py-2 rounded-lg bg-gradient-to-r from-[#7CE0A8] to-[#5DD494] text-white">
              1
            </button>
            <button className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
              Selanjutnya
            </button>
          </div>
        </div>
      )}

      {/* Statistik Ringkas Mobile */}
      <div className="lg:hidden mt-6 bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-lg border border-neutral-200 dark:border-neutral-700">
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">
          Ringkasan Rating
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gradient-to-br from-[#7CE0A8]/10 to-[#5DD494]/10 rounded-lg">
            <div className="text-2xl font-bold text-[#7CE0A8]">{totalReviews}</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Total Ulasan</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-[#7CE0A8]/10 to-[#5DD494]/10 rounded-lg">
            <div className="text-2xl font-bold text-[#7CE0A8]">{averageRating.toFixed(1)}</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Rating Rata-rata</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-[#7CE0A8]/10 to-[#5DD494]/10 rounded-lg">
            <div className="text-2xl font-bold text-[#7CE0A8]">
              {totalReviews > 0 ? ((reviews.filter(r => r.rating >= 4).length / totalReviews) * 100).toFixed(0) : 0}%
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Sangat Puas</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-[#7CE0A8]/10 to-[#5DD494]/10 rounded-lg">
            <div className="text-2xl font-bold text-[#7CE0A8]">
              {reviews.filter(r => r.response).length}
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Dibalas</div>
          </div>
        </div>
      </div>
    </div>
  );
}