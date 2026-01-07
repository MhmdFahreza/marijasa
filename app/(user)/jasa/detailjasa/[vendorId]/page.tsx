// app/jasa/detailjasa/[vendorId]/page.tsx
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
import { Send, CheckCircle2, Heart, MessageCircle, AlertCircle, ImageIcon, User, Eye, X as CloseIcon, ThumbsUp, Star } from 'lucide-react'
import SiteFooter from '@/app/footer'
import { LoaderTwo } from '@/app/components/transition/loader'
import { LoginForm } from '@/app/components/ui/login-form'
import { RatingStars } from '@/app/components/ui/rating-stars'
import { useAuth } from '@/app/components/contexts/AuthContext'

type GalleryImage = {
  src: string
  alt: string
}

type Review = {
  id: string
  userName: string
  userEmail: string
  userAvatar?: string
  rating: number
  comment: string
  date: string
}

export default function VendorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const prefersReduced = useReducedMotion()
  const { user, isAuthenticated } = useAuth()

  const [leaving, setLeaving] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('layanan')
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [vendor, setVendor] = useState<any>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoadingVendor, setIsLoadingVendor] = useState(true)
  const [isLoadingReviews, setIsLoadingReviews] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)

  const vendorId = params.vendorId as string

  // Load vendor data dari API
  useEffect(() => {
    const loadVendor = async () => {
      try {
        setIsLoadingVendor(true)
        const response = await fetch(`/api/vendors/${vendorId}`, {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          setVendor(data.vendor)
          setReviews(data.vendor.reviews || [])
        } else {
          console.error('Error loading vendor:', await response.text())
          setVendor(null)
        }
      } catch (error) {
        console.error('Error loading vendor:', error)
        setVendor(null)
      } finally {
        setIsLoadingVendor(false)
        setIsLoadingReviews(false)
      }
    }

    loadVendor()
  }, [vendorId])

  // Check if vendor is favorite
  useEffect(() => {
    const checkFavorite = async () => {
      if (!isAuthenticated || !user) return

      try {
        const response = await fetch(`/api/user/favorites/check?vendorId=${vendorId}`, {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          setIsFavorite(data.isFavorite)
        }
      } catch (error) {
        console.error('Error checking favorite:', error)
      }
    }

    checkFavorite()
  }, [vendorId, isAuthenticated, user])

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
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth',
      })
    }
  }

  const handleLoginSuccess = async (email: string) => {
    setShowLoginModal(false);

    await new Promise((r) => setTimeout(r, 500));

    window.location.reload();
  };

  const handleRegisterClick = async () => {
    setShowLoginModal(false);
    setIsTransitioning(true);
    await new Promise((r) => setTimeout(r, prefersReduced ? 0 : 500));
    router.push('/register');
  };

  const handleFavoriteClick = async () => {
    if (!isAuthenticated || !user) {
      setShowLoginModal(true)
      return
    }

    setIsTogglingFavorite(true)

    try {
      const endpoint = isFavorite ? '/api/user/favorites/remove' : '/api/user/favorites/add'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ vendorId }),
      })

      if (response.ok) {
        setIsFavorite(!isFavorite)

        // Dispatch event untuk update favorites page
        window.dispatchEvent(new CustomEvent('favoritesUpdated'))
      } else {
        const error = await response.json()
        console.error('Error toggling favorite:', error)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    } finally {
      setIsTogglingFavorite(false)
    }
  }

  const handlePesanSekarang = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }
    handleNavigation(`/jasa/detailjasa/${vendorId}/form`)
  }

  const handleChatClick = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }
    handleNavigation(`/chat/${vendorId}`)
  }

  const tabs = [
    { id: 'layanan', label: 'Layanan' },
    { id: 'hasil-pekerjaan', label: 'Hasil Pekerjaan' },
    { id: 'ulasan', label: 'Ulasan' },
  ]

  const hasGallery = vendor && vendor.gallery && vendor.gallery.length > 0

  const calculateAverageRating = () => {
    if (reviews.length === 0) {
      return vendor?.rating || 0
    }
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
    return sum / reviews.length
  }

  const averageRating = calculateAverageRating()

  if (isLoadingVendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderTwo />
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Vendor Tidak Ditemukan</h1>
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
      transition={{ duration: prefersReduced ? 0 : 0.25, ease: 'easeOut' }}
    >
      {/* Breadcrumb */}
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <motion.span whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                  <Link href="/" onClick={(e) => { e.preventDefault(); handleNavigation('/') }}>
                    Home
                  </Link>
                </motion.span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <motion.span whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                  <Link href="/jasa" onClick={(e) => { e.preventDefault(); handleNavigation('/jasa') }}>
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
                {vendor.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h1 className="text-lg md:text-3xl font-bold">{vendor.name}</h1>
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
                  aria-label={isFavorite ? 'Hapus dari favorit' : 'Simpan ke favorit'}
                  className="flex-shrink-0"
                  onClick={handleFavoriteClick}
                  disabled={isTogglingFavorite}
                >
                  <Heart
                    className={`h-5 w-5 transition-all duration-200 ${isFavorite ? 'text-[#7CE0A8] fill-[#7CE0A8]' : ''
                      }`}
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
            <nav className="flex space-x-8" aria-label="Tabs">
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
                  {vendor.tags?.map((tag: string, i: number) => (
                    <Badge key={i} variant="outline" className="px-3 py-1">
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
                  {vendor.serviceAreas?.map((area: string, i: number) => (
                    <Badge key={i} variant="outline" className="px-3 py-1">
                      {area}
                    </Badge>
                  ))}
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
                    {vendor.gallery.map((img: GalleryImage, i: number) => (
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
                    ))}
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
                          Vendor ini belum mengunggah foto hasil pekerjaan.
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
                      <RatingStars value={averageRating} size="lg" />
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
                          ? ((reviews.filter((r) => r.rating >= 4).length / reviews.length) * 100).toFixed(0)
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
                    <p className="text-sm text-muted-foreground mt-4">Memuat ulasan...</p>
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
                          Jadilah yang pertama memberikan ulasan untuk vendor ini.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 md:space-y-6">
                    <div className="reviews-scroll-container max-h-[calc(315px*2.4)] md:max-h-[calc(416px*3.2)] overflow-y-auto pr-2">
                      <div className="space-y-4 md:space-y-6">
                        <AnimatePresence>
                          {reviews.map((review, index) => (
                            <motion.div
                              key={review.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="group relative rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900/50 hover:border-[#7CE0A8]/30 hover:shadow-md transition-all duration-300 p-4 md:p-5"
                            >
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#7CE0A8] to-[#7CE0A8]/50 rounded-l-lg" />

                              <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-4">
                                <Avatar className="h-12 w-12 md:h-14 md:w-14 flex-shrink-0 ring-2 ring-[#7CE0A8]/20">
                                  <AvatarImage src={review.userAvatar} alt={review.userName} />
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
                                      {new Date(review.date).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                      })}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 mb-3 md:mb-4">
                                    <RatingStars value={review.rating} size="sm" />
                                    <span className="text-sm font-semibold text-[#7CE0A8] bg-[#7CE0A8]/10 px-2.5 py-1 rounded-full">
                                      {review.rating.toFixed(1)}
                                    </span>
                                  </div>

                                  <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-4 mb-3">
                                    {review.comment}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
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
              <CardTitle className="text-lg">Dapatkan Penawaran</CardTitle>
              <p className="text-sm text-muted-foreground text-justify">
                Ingin mendapatkan informasi lebih lanjut atau perkiraan harga? Pilih yang Anda inginkan di bawah ini.
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
                  <span className="bg-background px-2 text-muted-foreground">Atau</span>
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

      {/* Login Modal - Updated Design */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-[440px] md:max-w-[480px] p-0 overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 dark:from-neutral-900 dark:to-neutral-950 max-h-[90vh] overflow-y-auto">
          {/* Decorative gradient background */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#7CE0A8]/10 to-transparent rounded-full -z-0 blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-tr from-[#7CE0A8]/10 to-transparent rounded-full -z-0 blur-3xl"></div>

          <DialogHeader className="relative z-10 p-4 sm:p-5 md:p-6 pb-3 sm:pb-4">
            <div className="flex items-start gap-2.5 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#7CE0A8]/20 to-[#7CE0A8]/10 flex-shrink-0">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[#7CE0A8]" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-700 dark:from-white dark:via-neutral-100 dark:to-neutral-300 bg-clip-text text-transparent">
                  Login Diperlukan
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-0.5 sm:mt-1">
                  Silakan masuk untuk mengakses fitur ini
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="relative z-10 px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6">
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
            transition={{ duration: prefersReduced ? 0 : 0.5 }}
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
      `}</style>
    </motion.main>
  )
}