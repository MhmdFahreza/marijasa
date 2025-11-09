"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/app/components/ui/breadcrumb";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { Vendors } from "@/app/data/dataVendor";
import SiteFooter from "@/app/footer";
import { LoaderTwo } from "@/app/components/transition/loader";
import { Star, CheckCircle2, Heart, MapPin, Phone, Mail, MessageCircle } from "lucide-react";

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  const [leaving, setLeaving] = useState(false);

  const vendorId = params.vendorId as string;
  const vendor = Vendors.find((v) => v.id === vendorId);

  const handleNavigation = async (path: string) => {
    setLeaving(true);
    await new Promise((r) => setTimeout(r, prefersReduced ? 0 : 220));
    router.push(path);
  };

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Vendor Tidak Ditemukan</h1>
          <p className="text-muted-foreground mb-4">Vendor yang Anda cari tidak tersedia</p>
          <Button onClick={() => handleNavigation("/jasa")}>Kembali ke Daftar Jasa</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.main
        className="min-h-screen w-full max-w-7xl mx-auto px-4 py-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReduced ? 0 : 0.25, ease: "easeOut" }}
      >
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <motion.span whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                    <Link href="/" onClick={(e) => { e.preventDefault(); handleNavigation("/"); }}>
                      Home
                    </Link>
                  </motion.span>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <motion.span whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                    <Link href="/jasa" onClick={(e) => { e.preventDefault(); handleNavigation("/jasa"); }}>
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

        {/* Header Section */}
        <Card className="mb-6">
          <CardHeader className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="h-24 w-24 md:h-32 md:w-32">
                <AvatarImage src={vendor.avatar ?? ""} alt={vendor.name} />
                <AvatarFallback className="text-2xl md:text-3xl">
                  {vendor.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-2xl md:text-3xl font-bold">{vendor.name}</h1>
                      {vendor.verified && (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                          <CheckCircle2 className="h-5 w-5" />
                          Verified
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <RatingStars value={vendor.rating} />
                      <span className="font-semibold">{vendor.rating.toFixed(1)}</span>
                      <span className="text-muted-foreground">({vendor.reviewCount} review)</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {vendor.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="rounded-full">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button variant="ghost" size="icon" aria-label="Simpan">
                    <Heart className="h-5 w-5" />
                  </Button>
                </div>

                <p className="text-muted-foreground leading-relaxed">{vendor.summary}</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Button size="lg" className="w-full">
            <Phone className="mr-2 h-4 w-4" />
            Hubungi via Telepon
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="w-full"
            onClick={() => handleNavigation("/jasa")}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Chat Sekarang
          </Button>
          <Button size="lg" variant="outline" className="w-full">
            <Mail className="mr-2 h-4 w-4" />
            Kirim Email
          </Button>
        </div>

        {/* Gallery Section */}
        {vendor.gallery && vendor.gallery.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Portofolio & Hasil Pekerjaan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {vendor.gallery.map((img, i) => (
                  <motion.div
                    key={i}
                    className="aspect-square rounded-lg overflow-hidden bg-muted"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
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
        )}

        {/* Placeholder Sections */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tentang Layanan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Informasi detail tentang layanan akan ditampilkan di sini. Termasuk deskripsi lengkap,
              pengalaman, sertifikasi, dan keunggulan dari vendor ini.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Lokasi & Jangkauan Area</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="h-5 w-5 mt-0.5" />
              <p>Informasi lokasi dan area layanan akan ditampilkan di sini</p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Review & Testimoni</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Review dan testimoni dari pelanggan akan ditampilkan di sini
            </p>
          </CardContent>
        </Card>

        <div className="mt-10">
          <SiteFooter />
        </div>
      </motion.main>

      <AnimatePresence>
        {leaving && (
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
    </>
  );
}

function RatingStars({ value }: { value: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const total = 5;

  return (
    <div className="flex items-center">
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < full || (i === full && half);
        return (
          <Star
            key={i}
            className={`h-5 w-5 ${filled ? "fill-current text-yellow-500" : "text-muted-foreground/40"}`}
            aria-hidden="true"
          />
        );
      })}
      <span className="sr-only">{value} dari 5</span>
    </div>
  );
}