'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star,
  Filter,
  Calendar,
  User,
  CheckCircle,
  MessageCircle,
  ThumbsUp,
  Eye,
  X,
  Send,
} from 'lucide-react'

type Review = {
  review_id: string
  booking_id: string
  user_id: string
  vendor_id: string
  rating: number
  comment: string | null
  created_at: Date
  updated_at: Date
  booking: {
    booking_number: string
    scheduled_date: Date
    notes: string | null
    items: Array<{
      service: {
        name: string
      }
    }>
    user: {
      name: string
      email: string
      avatar: string | null
    }
  }
  user: {
    name: string
    email: string
    avatar: string | null
  }
}

type FormattedReview = {
  id: string
  booking_id: string
  user_id: string
  vendor_id: string
  userName: string
  userEmail: string
  userAvatar?: string
  rating: number
  comment: string
  serviceType: string
  date: string
  dateTimestamp: number
  photos?: string[]
  response?: {
    vendorReply: string
    replyDate: string
  }
  helpfulCount: number
  mitraLikes?: string[]
  isAnonymous?: boolean
}

const RatingStars = ({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} ${
            star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  )
}

export default function UlasanPage() {
  const [filter, setFilter] = useState('semua')
  const [sortBy, setSortBy] = useState('terbaru')
  const [expandedReviews, setExpandedReviews] = useState<string[]>([])
  const [reviews, setReviews] = useState<FormattedReview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [vendorId, setVendorId] = useState<string>('')
  const [vendorName, setVendorName] = useState<string>('')
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState<string>('')

  const parseReviewMetadata = (comment: string | null) => {
    if (!comment) {
      return {
        mainComment: '',
        photos: [],
        response: undefined,
        helpfulCount: 0,
        mitraLikes: [],
        isAnonymous: false
      }
    }

    let mainComment = comment
    let photos: string[] = []
    let response: { vendorReply: string; replyDate: string } | undefined
    let helpfulCount = 0
    let mitraLikes: string[] = []
    let isAnonymous = false

    try {
      if (comment.includes('|PHOTOS|')) {
        const parts = comment.split('|PHOTOS|')
        mainComment = parts[0]
        
        if (parts[1]) {
          const photoStr = parts[1].split('|RESPONSE|')[0].split('|LIKES|')[0].split('|ANONYMOUS|')[0]
          photos = JSON.parse(photoStr)
        }
      }

      if (comment.includes('|RESPONSE|')) {
        const responsePart = comment.split('|RESPONSE|')[1]
        if (responsePart) {
          const responseStr = responsePart.split('|LIKES|')[0].split('|ANONYMOUS|')[0]
          const responseData = JSON.parse(responseStr)
          
          response = {
            vendorReply: responseData.reply,
            replyDate: new Date(responseData.date).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          }
        }
      }

      if (comment.includes('|LIKES|')) {
        const likesPart = comment.split('|LIKES|')[1]
        if (likesPart) {
          const likesStr = likesPart.split('|ANONYMOUS|')[0]
          const likesData = JSON.parse(likesStr)
          helpfulCount = likesData.count || 0
          mitraLikes = likesData.mitraLikes || []
        }
      }

      if (comment.includes('|ANONYMOUS|')) {
        isAnonymous = true
      }

    } catch (error) {
      console.error('[Reviews] Error parsing metadata:', error)
    }

    return {
      mainComment,
      photos,
      response,
      helpfulCount,
      mitraLikes,
      isAnonymous
    }
  }

  const formatReviewDate = (date: Date): { dateString: string; timestamp: number } => {
    try {
      const dateObj = new Date(date)
      
      if (isNaN(dateObj.getTime())) {
        const now = new Date()
        return {
          dateString: now.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
          timestamp: now.getTime()
        }
      }

      return {
        dateString: dateObj.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        timestamp: dateObj.getTime()
      }
    } catch (error) {
      console.error('[Reviews] Error formatting date:', error)
      const now = new Date()
      return {
        dateString: now.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        timestamp: now.getTime()
      }
    }
  }

  const loadReviews = useCallback(async () => {
    try {
      setIsLoading(true)
      
      console.log('[Reviews] Loading vendor info...')

      const meResponse = await fetch('/api/mitra/me', {
        credentials: 'include',
      })

      if (!meResponse.ok) {
        console.error('[Reviews] Failed to get vendor info:', meResponse.status)
        setIsLoading(false)
        return
      }

      const meData = await meResponse.json()
      
      if (!meData.authenticated || !meData.vendor) {
        console.error('[Reviews] Not authenticated')
        setIsLoading(false)
        return
      }

      const currentVendorId = meData.vendor.id
      setVendorId(currentVendorId)
      setVendorName(meData.vendor.name || '')

      console.log('[Reviews] Vendor info loaded:', {
        id: currentVendorId,
        name: meData.vendor.name
      })

      console.log('[Reviews] Fetching reviews...')
      const reviewsResponse = await fetch('/api/mitra/reviews', {
        credentials: 'include',
      })
      
      if (!reviewsResponse.ok) {
        throw new Error('Failed to fetch reviews')
      }

      const data: Review[] = await reviewsResponse.json()
      console.log('[Reviews] Fetched', data.length, 'reviews')

      const formattedReviews: FormattedReview[] = data.map((review) => {
        const { dateString, timestamp } = formatReviewDate(review.created_at)
        const serviceType = review.booking.items[0]?.service?.name || 'Layanan'
        const metadata = parseReviewMetadata(review.comment)
        
        return {
          id: review.review_id,
          booking_id: review.booking_id,
          user_id: review.user_id,
          vendor_id: review.vendor_id,
          userName: metadata.isAnonymous ? 'Anonymous' : review.user.name,
          userEmail: review.user.email,
          userAvatar: metadata.isAnonymous ? undefined : (review.user.avatar || undefined),
          rating: review.rating,
          comment: metadata.mainComment,
          serviceType,
          date: dateString,
          dateTimestamp: timestamp,
          photos: metadata.photos,
          response: metadata.response,
          helpfulCount: metadata.helpfulCount,
          mitraLikes: metadata.mitraLikes,
          isAnonymous: metadata.isAnonymous
        }
      })

      setReviews(formattedReviews)
      console.log('[Reviews] Success - Formatted', formattedReviews.length, 'reviews')

    } catch (error) {
      console.error('[Reviews] Error loading:', error)
      setReviews([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  useEffect(() => {
    const handleReviewsUpdate = () => {
      console.log('[Reviews] Event received: reviewsUpdated')
      loadReviews()
    }

    window.addEventListener('reviewsUpdated', handleReviewsUpdate)
    return () => window.removeEventListener('reviewsUpdated', handleReviewsUpdate)
  }, [loadReviews])

  const toggleReviewExpansion = (id: string) => {
    if (expandedReviews.includes(id)) {
      setExpandedReviews(expandedReviews.filter((reviewId) => reviewId !== id))
    } else {
      setExpandedReviews([...expandedReviews, id])
    }
  }

  const handleLikeReview = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/mitra/reviews/${reviewId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ vendorId }),
      })

      if (!response.ok) {
        throw new Error('Failed to like review')
      }

      const data = await response.json()
      
      setReviews((prevReviews) =>
        prevReviews.map((review) => {
          if (review.id === reviewId) {
            return {
              ...review,
              mitraLikes: data.mitraLikes,
              helpfulCount: data.helpfulCount,
            }
          }
          return review
        })
      )

      window.dispatchEvent(new CustomEvent('reviewsUpdated'))

    } catch (error) {
      console.error('[Reviews] Error liking:', error)
    }
  }

  const handleReplySubmit = async (reviewId: string) => {
    if (!replyText.trim()) return

    try {
      const response = await fetch(`/api/mitra/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          vendorId,
          reply: replyText 
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit reply')
      }

      const data = await response.json()
      
      setReviews((prevReviews) =>
        prevReviews.map((review) => {
          if (review.id === reviewId) {
            return {
              ...review,
              response: data.response
            }
          }
          return review
        })
      )

      setReplyingTo(null)
      setReplyText('')

      window.dispatchEvent(new CustomEvent('reviewsUpdated'))

    } catch (error) {
      console.error('[Reviews] Error submitting reply:', error)
    }
  }

  const totalReviews = reviews.length
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0

  const ratingBreakdown = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  }

  const filteredReviews = reviews.filter((review) => {
    if (filter === 'semua') return true
    if (filter === 'dengan-foto')
      return review.photos && review.photos.length > 0
    if (filter === 'dengan-balasan') return review.response
    if (filter === 'rating-tinggi') return review.rating >= 3
    if (filter === 'rating-rendah') return review.rating <= 2
    return true
  })

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (sortBy === 'terbaru')
      return b.dateTimestamp - a.dateTimestamp
    if (sortBy === 'rating-tinggi') return b.rating - a.rating
    if (sortBy === 'rating-rendah') return a.rating - b.rating
    if (sortBy === 'terlama') return a.dateTimestamp - b.dateTimestamp
    return 0
  })

  const calculatePercentage = (count: number) => {
    if (totalReviews === 0) return 0
    return ((count / totalReviews) * 100).toFixed(0)
  }

  if (isLoading) {
    return (
      <div className="animate-fadeIn p-4 md:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7CE0A8] mx-auto mb-4" />
            <p className="text-muted-foreground">Memuat ulasan...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn p-4 md:p-6">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-2">
          Rating dan Ulasan
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Kelola dan lihat ulasan dari pelanggan Anda
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-[#7CE0A8] to-[#5DD494] rounded-xl p-6 text-white shadow-lg">
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-5xl md:text-6xl font-bold mb-2">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex items-center mb-3">
              <RatingStars value={averageRating} size="lg" />
            </div>
            <div className="text-lg font-medium">{totalReviews} Ulasan</div>
            <div className="text-sm opacity-90 mt-2">Rating Keseluruhan</div>
          </div>
        </div>

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
                      style={{
                        width: `${calculatePercentage(ratingBreakdown[star as keyof typeof ratingBreakdown])}%`,
                      }}
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
                  {reviews.filter((r) => r.rating === 5).length}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Rating 5
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {reviews.filter((r) => r.rating === 4).length}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Rating 4
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {reviews.filter((r) => r.photos && r.photos.length > 0).length}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Dengan Foto
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {reviews.filter((r) => r.response).length}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Dibalas
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 mb-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-neutral-500 flex-shrink-0" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-[#7CE0A8] focus:border-transparent min-w-[180px]"
              >
                <option value="semua">Semua Ulasan</option>
                <option value="dengan-foto">Dengan Foto</option>
                <option value="dengan-balasan">Dengan Balasan</option>
                <option value="rating-tinggi">Rating Tinggi</option>
                <option value="rating-rendah">Rating Rendah</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-neutral-500 flex-shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-[#7CE0A8] focus:border-transparent min-w-[180px]"
              >
                <option value="terbaru">Terbaru</option>
                <option value="rating-tinggi">Rating Tertinggi</option>
                <option value="rating-rendah">Rating Terendah</option>
                <option value="terlama">Terlama</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
            Menampilkan {sortedReviews.length} dari {reviews.length} ulasan
          </div>
        </div>
      </div>

      {sortedReviews.length === 0 ? (
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-12 shadow-lg border border-neutral-200 dark:border-neutral-700 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-[#7CE0A8]/20 to-[#5DD494]/20 rounded-full flex items-center justify-center mb-4">
              <Star className="w-12 h-12 text-[#7CE0A8]" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              {filter === 'semua'
                ? 'Belum Ada Ulasan'
                : 'Tidak Ada Ulasan yang Sesuai'}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 max-w-md">
              {filter === 'semua'
                ? 'Anda belum memiliki ulasan dari pelanggan.'
                : 'Tidak ada ulasan yang sesuai dengan filter yang dipilih.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-6">
          <AnimatePresence>
            {sortedReviews.map((review, index) => {
              const isLiked =
                review.mitraLikes &&
                review.mitraLikes.includes(vendorId)

              return (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-white dark:bg-neutral-800 rounded-xl p-4 md:p-6 shadow-lg border border-neutral-200 dark:border-neutral-700"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7CE0A8]/20 to-[#5DD494]/20 flex items-center justify-center flex-shrink-0">
                        {review.userAvatar && !review.isAnonymous ? (
                          <img
                            src={review.userAvatar}
                            alt={review.userName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-[#7CE0A8]" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-neutral-900 dark:text-white">
                            {review.userName}
                          </h4>
                          {!review.isAnonymous &&
                            review.userName !== 'Anonymous' && (
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          <div className="flex items-center">
                            <RatingStars value={review.rating} size="md" />
                          </div>
                          <span className="text-sm text-neutral-500 dark:text-neutral-400">
                            {review.date}
                          </span>
                        </div>
                        <span className="inline-block mt-2 text-sm px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded-full">
                          {review.serviceType}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p
                      className={`text-neutral-700 dark:text-neutral-300 ${
                        !expandedReviews.includes(review.id) &&
                        review.comment.length > 100
                          ? 'line-clamp-2'
                          : ''
                      }`}
                    >
                      {review.comment}
                    </p>
                    {review.comment.length > 100 && (
                      <button
                        onClick={() => toggleReviewExpansion(review.id)}
                        className="text-[#7CE0A8] hover:text-[#5DD494] font-medium text-sm mt-1 transition-colors"
                      >
                        {expandedReviews.includes(review.id)
                          ? 'Tutup'
                          : 'Baca selengkapnya'}
                      </button>
                    )}
                  </div>

                  {review.photos && review.photos.length > 0 && (
                    <div className="mb-4">
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {review.photos.map((photo, idx) => (
                          <div
                            key={idx}
                            className="relative group cursor-pointer"
                            onClick={() => setSelectedPhoto(photo)}
                          >
                            <img
                              src={photo}
                              alt={`Foto ulasan ${idx + 1}`}
                              className="w-24 h-24 md:w-32 md:h-32 rounded-lg object-cover flex-shrink-0 hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                              <Eye className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {review.response && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-[#7CE0A8]/10 to-[#5DD494]/10 rounded-lg border border-[#7CE0A8]/20">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#7CE0A8] flex items-center justify-center flex-shrink-0">
                          <MessageCircle className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-[#7CE0A8]">
                              Balasan Anda
                            </span>
                            <span className="text-xs text-neutral-500">
                              {review.response.replyDate}
                            </span>
                          </div>
                          <p className="text-neutral-700 dark:text-neutral-300">
                            {review.response.vendorReply}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLikeReview(review.id)}
                        className={`flex items-center gap-2 transition-colors ${
                          isLiked
                            ? 'text-[#7CE0A8]'
                            : 'text-neutral-600 dark:text-neutral-400 hover:text-[#7CE0A8]'
                        }`}
                      >
                        <ThumbsUp
                          className={`w-4 h-4 ${
                            isLiked ? 'fill-[#7CE0A8]' : ''
                          }`}
                        />
                        <span className="text-sm">
                          Membantu {review.helpfulCount}
                        </span>
                      </button>

                      {!review.response && (
                        <button
                          onClick={() => setReplyingTo(review.id)}
                          className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-[#7CE0A8] transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-sm">Balas Ulasan</span>
                        </button>
                      )}
                    </div>

                    {review.response && (
                      <button
                        onClick={() => setReplyingTo(review.id)}
                        className="text-sm text-[#7CE0A8] hover:text-[#5DD494] font-medium transition-colors"
                      >
                        Edit Balasan
                      </button>
                    )}
                  </div>

                  {replyingTo === review.id && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg"
                    >
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Tulis balasan Anda..."
                        className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-[#7CE0A8] focus:border-transparent resize-none"
                        rows={3}
                      />
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleReplySubmit(review.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-[#7CE0A8] text-white rounded-lg hover:bg-[#5DD494] transition-colors"
                        >
                          <Send className="w-4 h-4" />
                          Kirim Balasan
                        </button>
                        <button
                          onClick={() => {
                            setReplyingTo(null)
                            setReplyText('')
                          }}
                          className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                        >
                          Batal
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300 text-xl"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={selectedPhoto}
                alt="Preview"
                className="max-w-full max-h-[90vh] rounded-lg object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}