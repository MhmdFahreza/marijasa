'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/app/components/ui/breadcrumb'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/app/components/ui/avatar'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Send } from 'lucide-react'
import { getVendorById } from '@/app/data/dataVendor'
import SiteFooter from '@/app/footer'
import { LoaderTwo } from '@/app/components/transition/loader'
import { LoginForm } from '@/app/components/ui/login-form'
import { RatingStars } from '@/app/components/ui/rating-stars'
import {
  Star,
  CheckCircle2,
  Heart,
  MapPin,
  Phone,
  MessageCircle,
  AlertCircle,
  ImageIcon,
  User,
  Eye,
  X as CloseIcon,
  ThumbsUp,
} from 'lucide-react'

type GalleryImage = {
  src: string
  alt: string
}

type Review = {
  id: string
  orderId: string
  vendorId: string
  vendorName: string
  userName: string
  userEmail: string
  userAvatar?: string
  rating: number
  comment: string
  date: string
  photos?: string[]
  response?: {
    vendorReply: string
    replyDate: string
  }
  helpfulCount: number
  mitraLikes?: string[]
  isAnonymous?: boolean
}

// ⭐ FUNGSI HELPER UNTUK FORMAT TANGGAL
const formatReviewDate = (orderHistory: any[]): string => {
  try {
    const ratingHistory = orderHistory?.find(
      (h: any) => h.status === 'Rating dan Ulasan Diberikan'
    )

    if (ratingHistory?.date) {
      const dateObj = new Date(ratingHistory.date)

      if (isNaN(dateObj.getTime())) {
        return new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      }

      return dateObj.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    }

    return new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }
}

export default function VendorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const prefersReduced = useReducedMotion()
  const [leaving, setLeaving] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('layanan')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const [vendor, setVendor] = useState<any>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoadingReviews, setIsLoadingReviews] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const vendorId = params.vendorId as string

  // Load vendor data dengan sync - DIPERBAIKI
  useEffect(() => {
    const loadVendor = () => {
      const vendorData = getVendorById(vendorId)
      if (vendorData) {
        // Pastikan summary/description selalu ada
        const finalVendor = {
          ...vendorData,
          summary: vendorData.summary || vendorData.description || 'Deskripsi tidak tersedia',
          description: vendorData.description || vendorData.summary || 'Deskripsi tidak tersedia'
        }
        setVendor(finalVendor)
      }
    }

    loadVendor()

    const handleVendorUpdate = (event: any) => {
      if (event.detail.vendorId === vendorId) {
        loadVendor()
      }
    }

    // Listen untuk update dari mitra profile
    const handleMitraUpdate = () => {
      loadVendor()
    }

    window.addEventListener('vendorDataUpdated', handleVendorUpdate)
    window.addEventListener('mitraProfileUpdated', handleMitraUpdate)

    return () => {
      window.removeEventListener('vendorDataUpdated', handleVendorUpdate)
      window.removeEventListener('mitraProfileUpdated', handleMitraUpdate)
    }
  }, [vendorId])

  // Load reviews dari localStorage dan dengarkan perubahan
  useEffect(() => {
    const loadReviews = () => {
      setIsLoadingReviews(true)
      try {
        const userOrders = JSON.parse(
          localStorage.getItem('userOrders') || '[]'
        )

        const vendorReviews: Review[] = userOrders
          .filter(
            (order: any) =>
              order.status === 'selesai' &&
              order.rating &&
              order.rating > 0 &&
              (order.vendor?.id === vendorId ||
                order.vendorId === vendorId ||
                order.vendor?.name === vendor?.name ||
                order.vendorName === vendor?.name)
          )
          .map((order: any) => {
            const userName = order.isAnonymous
              ? 'Anonymous'
              : order.customerInfo?.name ||
              JSON.parse(localStorage.getItem('userProfile') || '{}').name ||
              'Pengguna'

            const userEmail = order.isAnonymous
              ? order.customerInfo?.email
              : JSON.parse(localStorage.getItem('user') || '{}').email

            const userAvatar = order.isAnonymous
              ? undefined
              : JSON.parse(localStorage.getItem('userProfile') || '{}')
                .avatar

            const formattedDate = formatReviewDate(order.orderHistory)

            return {
              id: order.id || order.orderId,
              orderId: order.id || order.orderId,
              vendorId: vendorId,
              vendorName: vendor?.name || order.vendorName || '',
              userName,
              userEmail,
              userAvatar,
              rating: order.rating,
              comment: order.review || '',
              date: formattedDate,
              photos: order.ratingPhotos || [],
              response: order.vendorResponse || undefined,
              helpfulCount: order.helpfulCount || 0,
              mitraLikes: order.mitraLikes || [],
              isAnonymous: order.isAnonymous || false,
            }
          })
          .sort((a: Review, b: Review) => {
            return b.date.localeCompare(a.date)
          })

        setReviews(vendorReviews)
      } catch (error) {
        console.error('Error loading reviews:', error)
        setReviews([])
      } finally {
        setIsLoadingReviews(false)
      }
    }

    if (vendor) {
      loadReviews()
    }

    const handleStorageChange = () => {
      if (vendor) {
        loadReviews()
      }
    }

    const handleReviewsUpdate = (event: any) => {
      if (vendor) {
        loadReviews()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('reviewsUpdated', handleReviewsUpdate)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('reviewsUpdated', handleReviewsUpdate)
    }
  }, [vendor, vendorId])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('userToken')
      setIsLoggedIn(!!token)

      const savedFavorites = localStorage.getItem('favorites')
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites))
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('favorites', JSON.stringify(favorites))
    }
  }, [favorites])

  const handleNavigation = async (path: string) => {
    setLeaving(true)
    await new Promise((r) => setTimeout(r, prefersReduced ? 0 : 220))
    router.push(path)
  }

  const scrollToSection = (sectionId: string) => {
    setActiveTab(sectionId)
    const element = document.getElementById(sectionId)
    if (element) {
      const offset = 100
      const elementPosition =
        element.getBoundingClientRect().top + window.pageYOffset
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth',
      })
    }
  }

  const handleLoginSuccess = async (email: string) => {
    setIsTransitioning(true);

    // Simpan email ke localStorage untuk halaman OTP
    if (typeof window !== 'undefined') {
      localStorage.setItem('pendingLoginEmail', email);
    }

    await new Promise((r) => setTimeout(r, prefersReduced ? 0 : 500));

    // Redirect ke halaman OTP
    router.push(`/login/otp?email=${encodeURIComponent(email)}`);
  };

  const handleRegisterClick = async () => {
    setShowLoginModal(false);
    setIsTransitioning(true);
    await new Promise((r) => setTimeout(r, prefersReduced ? 0 : 500));
    router.push('/register');
  };

  const handleFavoriteClick = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true)
      return
    }

    if (vendorId) {
      if (favorites.includes(vendorId)) {
        setFavorites((prev) => prev.filter((id) => id !== vendorId))
      } else {
        setFavorites((prev) => [...prev, vendorId])
      }
    }
  }

  const handlePesanSekarang = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true)
      return
    }
    handleNavigation(`/jasa/detailjasa/${vendorId}/form`)
  }

  const handleChatClick = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true)
      return
    }
    handleNavigation(`/chat/${vendorId}`)
  }

  const isFavorite = vendorId
    ? favorites.includes(vendorId)
    : false

  const tabs = [
    { id: 'layanan', label: 'Layanan' },
    { id: 'hasil-pekerjaan', label: 'Hasil Pekerjaan' },
    {
      id: 'ulasan',
      label: 'Ulasan',
    },
  ]

  const hasGallery =
    vendor && vendor.gallery && vendor.gallery.length > 0

  const calculateAverageRating = () => {
    if (reviews.length === 0) {
      return vendor?.rating || 0
    }
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
    return sum / reviews.length
  }

  const averageRating = calculateAverageRating()

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">
            Vendor Tidak Ditemukan
          </h1>
          <p className="text-muted-foreground mb-4">
            Vendor yang Anda cari tidak tersedia
          </p>
          <Button onClick={() => handleNavigation('/jasa')}>
            Kembali ke Daftar Jasa
          </Button>
        </div>
      </div>
    )
  }

  return (
    <motion.main
      className="min-h-screen w-full max-w-7xl mx-auto px-4 py-6 pb-24 lg:pb-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: prefersReduced ? 0 : 0.25,
        ease: 'easeOut',
      }}
    >
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <motion.span
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href="/"
                    onClick={(e) => {
                      e.preventDefault()
                      handleNavigation('/')
                    }}
                  >
                    Home
                  </Link>
                </motion.span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <motion.span
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href="/jasa"
                    onClick={(e) => {
                      e.preventDefault()
                      handleNavigation('/jasa')
                    }}
                  >
                    Jasa
                  </Link>
                </motion.span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{vendor.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Vendor Header Card */}
      <Card className="mb-6">
        <CardHeader className="p-4 md:p-6">
          <div className="flex gap-3 md:gap-6">
            <Avatar className="h-16 w-16 md:h-32 md:w-32 flex-shrink-0">
              <AvatarImage src={vendor.avatar ?? ''} alt={vendor.name} />
              <AvatarFallback className="text-lg md:text-3xl">
                {vendor.name
                  .split(' ')
                  .map((w: string) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h1 className="text-lg md:text-3xl font-bold">
                      {vendor.name}
                    </h1>
                    {vendor.verified && (
                      <span className="inline-flex items-center gap-1 text-xs md:text-sm font-medium text-primary flex-shrink-0">
                        <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" />
                        Verified
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-3 md:mb-4 flex-wrap">
                    <RatingStars value={averageRating} size="md" showValue />
                    <span className="text-muted-foreground text-xs md:text-sm">
                      {reviews.length} ulasan
                    </span>
                  </div>

                  <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                    {vendor.summary || vendor.description || 'Deskripsi tidak tersedia'}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={
                    isFavorite
                      ? 'Hapus dari favorit'
                      : 'Simpan ke favorit'
                  }
                  className="flex-shrink-0"
                  onClick={handleFavoriteClick}
                >
                  <Heart
                    className="h-5 w-5"
                    fill={isFavorite ? '#ef4444' : 'none'}
                    color={isFavorite ? '#ef4444' : 'currentColor'}
                  />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Sticky Tabs */}
          <div className="border-b border-gray-200 sticky top-0 bg-white z-10">
            <nav
              className="flex space-x-8"
              aria-label="Tabs"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => scrollToSection(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                    ? 'border-[#7CE0A8] text-[#7CE0A8]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  {tab.label}
                  {tab.id === 'ulasan' && reviews.length > 0 && (
                    <span className="ml-2 text-xs bg-[#7CE0A8]/20 text-[#7CE0A8] px-2 py-0.5 rounded-full">
                      {reviews.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Layanan Section */}
          <div id="layanan">
            <Card>
              <CardHeader>
                <CardTitle>Layanan yang tersedia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {vendor.tags.map((tag: string, i: number) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="px-3 py-1"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Jangkauan layanan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {vendor.serviceAreas.map(
                    (area: string, i: number) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="px-3 py-1"
                      >
                        {area}
                      </Badge>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hasil Pekerjaan Section */}
          <div id="hasil-pekerjaan">
            {hasGallery ? (
              <Card>
                <CardHeader>
                  <CardTitle>Hasil Pekerjaan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {vendor.gallery.map(
                      (img: GalleryImage, i: number) => (
                        <motion.div
                          key={i}
                          className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.2 }}
                          onClick={() => setSelectedPhoto(img.src)}
                        >
                          <img
                            src={img.src}
                            alt={img.alt}
                            className="w-full h-full object-cover"
                          />
                        </motion.div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Hasil Pekerjaan</CardTitle>
                </CardHeader>
                <CardContent className="py-12">
                  <div className="text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Belum Ada Hasil Pekerjaan
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                          Vendor ini belum mengunggah foto hasil
                          pekerjaan. Anda dapat menghubungi vendor
                          untuk informasi lebih lanjut.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Ulasan Section */}
          <div id="ulasan">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-[#7CE0A8]/10 to-[#7CE0A8]/5 border-b border-[#7CE0A8]/20 pb-4 md:pb-6">
                <CardTitle className="text-xl md:text-2xl text-gray-900 dark:text-white mb-4 md:mb-6">
                  Ulasan Pelanggan
                </CardTitle>
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 md:p-6 border border-[#7CE0A8]/20 shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                    <div className="flex flex-col items-center justify-center py-2 md:py-4 px-3 md:px-4">
                      <div className="text-4xl md:text-5xl font-bold text-[#7CE0A8] mb-2">
                        {averageRating.toFixed(1)}
                      </div>
                      <RatingStars
                        value={averageRating}
                        size="lg"
                      />
                      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
                        Penilaian Keseluruhan
                      </p>
                    </div>

                    <div className="flex flex-col items-center justify-center py-2 md:py-4 px-3 md:px-4 border-t sm:border-t-0 sm:border-l border-[#7CE0A8]/20">
                      <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1">
                        {reviews.length}
                      </div>
                      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">
                        Total Ulasan
                      </p>
                    </div>

                    <div className="flex flex-col items-center justify-center py-2 md:py-4 px-3 md:px-4 border-t sm:border-t-0 sm:border-l border-[#7CE0A8]/20">
                      <div className="text-3xl md:text-4xl font-bold text-[#7CE0A8] mb-1">
                        {reviews.length > 0
                          ? (
                            (reviews.filter(
                              (r) => r.rating >= 4
                            ).length /
                              reviews.length) *
                            100
                          ).toFixed(0)
                          : 0}
                        %
                      </div>
                      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">
                        Sangat Puas
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 md:p-6">
                {isLoadingReviews ? (
                  <div className="text-center py-12 md:py-16">
                    <LoaderTwo />
                    <p className="text-sm text-muted-foreground mt-4">
                      Memuat ulasan...
                    </p>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-12 md:py-16">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-[#7CE0A8]/10 flex items-center justify-center">
                        <Star className="h-8 w-8 text-[#7CE0A8]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Belum Ada Ulasan
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                          Jadilah yang pertama memberikan ulasan
                          untuk vendor ini setelah menggunakan
                          layanan mereka.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 md:space-y-6">
                    <div className="reviews-scroll-container max-h-[calc(315px*2.4)] md:max-h-[calc(416px*3.2)] overflow-y-auto pr-2">
                      <div className="space-y-4 md:space-y-6">
                        <AnimatePresence>
                          {reviews.map((review, index) => {
                            const mitraLiked =
                              review.mitraLikes &&
                              review.mitraLikes.length > 0

                            return (
                              <motion.div
                                key={review.id}
                                initial={{
                                  opacity: 0,
                                  y: 20,
                                }}
                                animate={{
                                  opacity: 1,
                                  y: 0,
                                }}
                                transition={{
                                  delay: index * 0.05,
                                }}
                                className="group relative rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900/50 hover:border-[#7CE0A8]/30 hover:shadow-md transition-all duration-300 p-4 md:p-5"
                              >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#7CE0A8] to-[#7CE0A8]/50 rounded-l-lg" />

                                <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-4">
                                  <Avatar className="h-12 w-12 md:h-14 md:w-14 flex-shrink-0 ring-2 ring-[#7CE0A8]/20">
                                    <AvatarImage
                                      src={review.userAvatar}
                                      alt={review.userName}
                                    />
                                    <AvatarFallback className="bg-gradient-to-br from-[#7CE0A8]/20 to-[#7CE0A8]/10">
                                      <User className="h-6 w-6 text-[#7CE0A8]" />
                                    </AvatarFallback>
                                  </Avatar>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 mb-2 md:mb-3">
                                      <div className="min-w-0">
                                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm md:text-base truncate">
                                          {review.userName}
                                        </h4>
                                      </div>
                                      <span className="text-xs md:text-sm text-gray-500 dark:text-gray-500 font-medium whitespace-nowrap">
                                        {review.date}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-2 mb-3 md:mb-4">
                                      <RatingStars
                                        value={review.rating}
                                        size="sm"
                                      />
                                      <span className="text-sm font-semibold text-[#7CE0A8] bg-[#7CE0A8]/10 px-2.5 py-1 rounded-full">
                                        {review.rating.toFixed(1)}
                                      </span>
                                    </div>

                                    <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-4 mb-3">
                                      {review.comment}
                                    </p>

                                    {review.photos &&
                                      review.photos.length > 0 && (
                                        <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                                          {review.photos.map(
                                            (
                                              photo: string,
                                              idx: number
                                            ) => (
                                              <div
                                                key={idx}
                                                className="relative group/photo cursor-pointer"
                                                onClick={() =>
                                                  setSelectedPhoto(
                                                    photo
                                                  )
                                                }
                                              >
                                                <img
                                                  src={photo}
                                                  alt={`Foto ${idx + 1
                                                    }`}
                                                  className="w-20 h-20 md:w-24 md:h-24 rounded-lg object-cover flex-shrink-0 hover:scale-105 transition-transform"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                                  <Eye className="w-5 h-5 text-white" />
                                                </div>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      )}

                                    {review.response && (
                                      <div className="mb-3 p-3 bg-gradient-to-r from-[#7CE0A8]/10 to-[#7CE0A8]/5 rounded-lg border border-[#7CE0A8]/20">
                                        <div className="flex items-start gap-2">
                                          <div className="w-6 h-6 rounded-full bg-[#7CE0A8] flex items-center justify-center flex-shrink-0">
                                            <MessageCircle className="w-3 h-3 text-white" />
                                          </div>
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="font-semibold text-[#7CE0A8] text-sm">
                                                Balasan {
                                                  review.vendorName
                                                }
                                              </span>
                                              <span className="text-xs text-neutral-500">
                                                {
                                                  review
                                                    .response
                                                    .replyDate
                                                }
                                              </span>
                                            </div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                              {
                                                review.response
                                                  .vendorReply
                                              }
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Like Section */}
                                    <div className="flex items-center gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                      {mitraLiked && (
                                        <div className="flex items-center gap-1 text-xs md:text-sm text-[#7CE0A8] bg-[#7CE0A8]/10 px-2 py-1 rounded-full">
                                          <ThumbsUp className="w-3 h-3 fill-[#7CE0A8]" />
                                          <span>
                                            {
                                              review.mitraLikes
                                                ?.length
                                            }{' '}
                                            Membantu
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )
                          })}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">
                Dapatkan Penawaran
              </CardTitle>
              <p className="text-sm text-muted-foreground text-justify">
                Ingin mendapatkan informasi lebih lanjut atau
                perkiraan harga? Pilih yang Anda inginkan di
                bawah ini untuk memulai pesan atau chat.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                size="lg"
                className="w-full bg-[#7CE0A8] text-white hover:bg-[#5CA68A] shadow-lg rounded-lg transition duration-300"
                onClick={handlePesanSekarang}
              >
                <Send className="mr-2 h-4 w-4" />
                Pesan Sekarang
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Atau
                  </span>
                </div>
              </div>

              <Button
                size="lg"
                variant="outline"
                className="w-full border-2 border-gray-300 text-gray-700 hover:border-[#7CE0A8] hover:text-[#7CE0A8] hover:bg-[#7CE0A8]/5 rounded-lg transition duration-300"
                onClick={handleChatClick}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Chat dengan Vendor
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-10">
        <SiteFooter />
      </div>

      {/* Mobile Bottom Action */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg z-50">
        <div className="max-w-7xl mx-auto flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-2 border-[#7CE0A8] text-[#7CE0A8] hover:bg-[#7CE0A8]/5 rounded-lg transition duration-300"
            onClick={handleChatClick}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Chat
          </Button>
          <Button
            className="flex-1 bg-[#7CE0A8] text-white hover:bg-[#5CA68A] shadow-lg rounded-lg transition duration-300"
            onClick={handlePesanSekarang}
          >
            <Send className="mr-2 h-4 w-4" />
            Pesan
          </Button>
        </div>
      </div>

      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Login Diperlukan
            </DialogTitle>
            <DialogDescription>
              Anda perlu login untuk mengakses fitur ini. Silakan masuk ke akun Anda terlebih dahulu.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <LoginForm
              userType="user"
              onSuccess={handleLoginSuccess}
              onRegisterClick={handleRegisterClick}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Transition Loader */}
      <AnimatePresence>
        {(leaving || isTransitioning) && (
          <motion.div
            key="route-leave"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: prefersReduced ? 0 : 0.5,
            }}
            className="fixed inset-0 z-[9999] bg-white dark:bg-neutral-950 flex items-center justify-center"
          >
            <LoaderTwo />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Viewer Modal */}
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
                <CloseIcon className="w-6 h-6" />
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

      {/* Custom Scrollbar Styling */}
      <style jsx>{`
        .reviews-scroll-container {
          scrollbar-width: thin;
          scrollbar-color: rgba(124, 224, 168, 0.4) transparent;
        }

        .reviews-scroll-container::-webkit-scrollbar {
          width: 8px;
        }

        .reviews-scroll-container::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 10px;
        }

        .reviews-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(124, 224, 168, 0.4);
          border-radius: 10px;
        }

        .reviews-scroll-container::-webkit-scrollbar-thumb:hover {
          background: rgba(124, 224, 168, 0.6);
        }

        @media (prefers-color-scheme: dark) {
          .reviews-scroll-container {
            scrollbar-color: rgba(124, 224, 168, 0.4) transparent;
          }

          .reviews-scroll-container::-webkit-scrollbar-track {
            background: transparent;
          }

          .reviews-scroll-container::-webkit-scrollbar-thumb {
            background: rgba(124, 224, 168, 0.4);
          }

          .reviews-scroll-container::-webkit-scrollbar-thumb:hover {
            background: rgba(124, 224, 168, 0.6);
          }
        }
      `}</style>
    </motion.main>
  )
}