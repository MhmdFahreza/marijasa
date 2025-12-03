"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion } from "motion/react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/app/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Checkbox } from "@/app/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Calendar, User, Receipt } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Vendors } from "@/app/data/dataVendor";
import { useParams } from "next/navigation";

const PRICES = {
  ac: {
    instalasi: { base: 500000, label: "Instalasi AC Baru" },
    service: { base: 150000, label: "Service/Perbaikan" },
    cuci: { base: 100000, label: "Cuci AC" },
    bongkar: { base: 300000, label: "Bongkar Pasang" }
  },
  electrical: {
    "Instalasi Baru": 750000,
    "Perbaikan": 200000,
    "Penambahan Titik Listrik": 150000,
    "Pemasangan Panel": 500000,
    "Ganti MCB": 100000
  },
  cleaning: {
    general: { base: 300000, label: "General Cleaning" },
    deep: { base: 500000, label: "Deep Cleaning" },
    "post-reno": { base: 800000, label: "Post Renovasi" }
  },
  plumbing: {
    "Kebocoran Pipa": 250000,
    "Saluran Mampet": 200000,
    "Instalasi Baru": 600000,
    "Ganti Wastafel/Kloset": 400000,
    "Pompa Air": 350000
  },
  sedotWC: {
    base: 400000,
    perUnit: 150000
  },
  garden: {
    "Pembuatan Taman Baru": 2000000,
    "Perawatan Rutin": 300000,
    "Pemangkasan": 150000,
    "Vertical Garden": 1500000,
    "Landscape Design": 3000000
  },
  furniture: {
    "Lemari": 3000000,
    "Kitchen Set": 5000000,
    "Rak TV": 1500000,
    "Meja Kerja": 2000000,
    "Tempat Tidur": 4000000,
    "Rak Buku": 1800000
  }
};

function getServiceCategory(tags: string[]): string {
  const firstTag = tags[0]?.toLowerCase() || "";

  if (firstTag.includes("ac")) return "ac";
  if (firstTag.includes("listrik")) return "listrik";
  if (firstTag.includes("pembersihan") || firstTag.includes("cleaning")) return "cleaning";
  if (firstTag.includes("ledeng") || firstTag.includes("pipa")) return "plumbing";
  if (firstTag.includes("sedot")) return "sedot-wc";
  if (firstTag.includes("kebun") || firstTag.includes("taman")) return "taman";
  if (firstTag.includes("mebel") || firstTag.includes("furnitur")) return "furniture";

  return "general";
}

export default function VendorFormPage() {
  const params = useParams();
  const [formData, setFormData] = useState<any>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Ambil vendorId dari URL params
  const vendorId = params.vendorId as string;
  const vendor = Vendors.find((v) => v.id === vendorId);

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Vendor Tidak Ditemukan</h1>
          <Button onClick={() => window.location.href = "/jasa"}>
            Kembali ke Daftar Jasa
          </Button>
        </div>
      </div>
    );
  }

  const serviceCategory = getServiceCategory(vendor.tags);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    alert("Pesanan berhasil dikirim! Kami akan menghubungi Anda segera.");
  };

  return (
    <motion.main
      className="min-h-screen w-full max-w-4xl mx-auto px-4 py-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <motion.span whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                  <a href="/" className="cursor-pointer">Home</a>
                </motion.span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <motion.span whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                  <a href="/jasa" className="cursor-pointer">Jasa</a>
                </motion.span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <motion.span whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                  <a href={`/jasa/detailjasa/${vendor.id}`} className="cursor-pointer">
                    {vendor.name}
                  </a>
                </motion.span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Form Pemesanan</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={vendor.avatar ?? ""} alt={vendor.name} />
              <AvatarFallback>
                {vendor.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{vendor.name}</h2>
              <p className="text-sm text-muted-foreground">{vendor.tags.join(" • ")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Form Pemesanan Layanan</CardTitle>
          <CardDescription>
            Lengkapi formulir di bawah untuk memesan layanan {vendor.tags[0]}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Data Pelanggan
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap *</Label>
                  <Input
                    id="name"
                    placeholder="Masukkan nama lengkap"
                    required
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">No. Telepon *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="08xxxxxxxxxx"
                    required
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Alamat Lengkap *</Label>
                <Textarea
                  id="address"
                  placeholder="Masukkan alamat lengkap"
                  rows={3}
                  required
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            <ServiceSpecificFormWithPrice
              category={serviceCategory}
              formData={formData}
              setFormData={setFormData}
            />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Jadwal Layanan
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Tanggal Pengerjaan *</Label>
                  <Input
                    id="date"
                    type="date"
                    required
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Waktu Pengerjaan *</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, time: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih waktu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="08:00-10:00">08:00 - 10:00</SelectItem>
                      <SelectItem value="10:00-12:00">10:00 - 12:00</SelectItem>
                      <SelectItem value="13:00-15:00">13:00 - 15:00</SelectItem>
                      <SelectItem value="15:00-17:00">15:00 - 17:00</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan Tambahan</Label>
              <Textarea
                id="notes"
                placeholder="Informasi tambahan yang perlu diketahui vendor..."
                rows={4}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1">
                Batal
              </Button>
              <Button
                type="submit"
                className="flex-1 text-white transition-colors duration-200"
                style={{ backgroundColor: '#7CE0A8' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5CA68A'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7CE0A8'}
              >
                Kirim Pesanan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.main>
  );
}

function ServiceSpecificFormWithPrice({ category, formData, setFormData }: { category: string; formData: any; setFormData: (data: any) => void }) {
  switch (category) {
    case "ac":
      return <ACServiceForm formData={formData} setFormData={setFormData} />;
    case "listrik":
      return <ElectricalServiceForm formData={formData} setFormData={setFormData} />;
    case "cleaning":
      return <CleaningServiceForm formData={formData} setFormData={setFormData} />;
    case "plumbing":
      return <PlumbingServiceForm formData={formData} setFormData={setFormData} />;
    case "sedot-wc":
      return <SedotWCServiceForm formData={formData} setFormData={setFormData} />;
    case "taman":
      return <GardenServiceForm formData={formData} setFormData={setFormData} />;
    case "furniture":
      return <FurnitureServiceForm formData={formData} setFormData={setFormData} />;
    default:
      return <GeneralServiceForm formData={formData} setFormData={setFormData} />;
  }
}

function PriceSummary({ totalPrice }: { totalPrice: number }) {
  return (
    <Card className="bg-muted/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Ringkasan Harga
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-2xl font-bold">
            <span>Total Estimasi:</span>
            <span className="text-primary">
              Rp {totalPrice.toLocaleString('id-ID')}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            * Harga dapat berubah setelah survey lokasi
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ACServiceForm({ formData, setFormData }: any) {
  const totalPrice = useMemo(() => {
    let total = 0;
    if (formData.serviceType && PRICES.ac[formData.serviceType as keyof typeof PRICES.ac]) {
      const servicePrice = PRICES.ac[formData.serviceType as keyof typeof PRICES.ac].base;
      const count = parseInt(formData.acCount) || 1;
      total = servicePrice * count;
    }
    return total;
  }, [formData.serviceType, formData.acCount]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Detail Layanan AC</h3>
        <div className="space-y-2">
          <Label>Jenis Layanan *</Label>
          <RadioGroup onValueChange={(value) => setFormData({ ...formData, serviceType: value })}>
            {Object.entries(PRICES.ac).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={key} id={key} />
                  <Label htmlFor={key} className="font-normal cursor-pointer">
                    {value.label}
                  </Label>
                </div>
                <span className="text-sm font-semibold text-primary">
                  Rp {value.base.toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="acType">Tipe AC *</Label>
          <Select onValueChange={(value) => setFormData({ ...formData, acType: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih tipe AC" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="split">Split</SelectItem>
              <SelectItem value="cassette">Cassette</SelectItem>
              <SelectItem value="standing">Standing/Floor</SelectItem>
              <SelectItem value="central">Central</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="acCount">Jumlah Unit *</Label>
          <Input
            id="acCount"
            type="number"
            min="1"
            defaultValue="1"
            placeholder="Jumlah unit AC"
            onChange={(e) => setFormData({ ...formData, acCount: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="acPk">Kapasitas (PK) *</Label>
          <Select onValueChange={(value) => setFormData({ ...formData, acPk: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih kapasitas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.5">0.5 PK</SelectItem>
              <SelectItem value="0.75">0.75 PK</SelectItem>
              <SelectItem value="1">1 PK</SelectItem>
              <SelectItem value="1.5">1.5 PK</SelectItem>
              <SelectItem value="2">2 PK</SelectItem>
              <SelectItem value="2.5">2.5 PK</SelectItem>
              <SelectItem value="3">3 PK</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {totalPrice > 0 && <PriceSummary totalPrice={totalPrice} />}
    </div>
  );
}

function ElectricalServiceForm({ formData, setFormData }: any) {
  const totalPrice = useMemo(() => {
    const works = formData.electricalWork || [];
    return works.reduce((sum: number, work: string) => {
      return sum + (PRICES.electrical[work as keyof typeof PRICES.electrical] || 0);
    }, 0);
  }, [formData.electricalWork]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Detail Layanan Listrik</h3>
        <div className="space-y-2">
          <Label>Jenis Pekerjaan *</Label>
          <div className="space-y-2">
            {Object.entries(PRICES.electrical).map(([item, price]) => (
              <div key={item} className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={item.toLowerCase().replace(/\s/g, "-")}
                    onCheckedChange={(checked) => {
                      const current = formData.electricalWork || [];
                      if (checked) {
                        setFormData({ ...formData, electricalWork: [...current, item] });
                      } else {
                        setFormData({ ...formData, electricalWork: current.filter((i: string) => i !== item) });
                      }
                    }}
                  />
                  <Label htmlFor={item.toLowerCase().replace(/\s/g, "-")} className="font-normal cursor-pointer">
                    {item}
                  </Label>
                </div>
                <span className="text-sm font-semibold text-primary">
                  Rp {price.toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="buildingType">Tipe Bangunan *</Label>
          <Select onValueChange={(value) => setFormData({ ...formData, buildingType: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih tipe bangunan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rumah">Rumah Tinggal</SelectItem>
              <SelectItem value="ruko">Ruko</SelectItem>
              <SelectItem value="kantor">Kantor</SelectItem>
              <SelectItem value="gudang">Gudang</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="powerCapacity">Daya Listrik Rumah *</Label>
          <Select onValueChange={(value) => setFormData({ ...formData, powerCapacity: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih daya" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="900">900 VA</SelectItem>
              <SelectItem value="1300">1300 VA</SelectItem>
              <SelectItem value="2200">2200 VA</SelectItem>
              <SelectItem value="3500">3500 VA</SelectItem>
              <SelectItem value="5500">5500 VA</SelectItem>
              <SelectItem value="7700">7700 VA</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {totalPrice > 0 && <PriceSummary totalPrice={totalPrice} />}
    </div>
  );
}

function CleaningServiceForm({ formData, setFormData }: any) {
  const totalPrice = useMemo(() => {
    if (!formData.cleaningType) return 0;
    const basePrice = PRICES.cleaning[formData.cleaningType as keyof typeof PRICES.cleaning]?.base || 0;
    const areaSize = parseInt(formData.areaSize) || 0;
    const pricePerSqm = basePrice / 50;
    return Math.round(pricePerSqm * areaSize);
  }, [formData.cleaningType, formData.areaSize]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Detail Layanan Pembersihan</h3>
        <div className="space-y-2">
          <Label>Jenis Layanan *</Label>
          <RadioGroup onValueChange={(value) => setFormData({ ...formData, cleaningType: value })}>
            {Object.entries(PRICES.cleaning).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={key} id={key} />
                  <Label htmlFor={key} className="font-normal cursor-pointer">
                    {value.label}
                  </Label>
                </div>
                <span className="text-sm font-semibold text-primary">
                  Mulai Rp {value.base.toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="propertyType">Tipe Properti *</Label>
          <Select onValueChange={(value) => setFormData({ ...formData, propertyType: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih tipe properti" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apartment">Apartemen</SelectItem>
              <SelectItem value="house">Rumah</SelectItem>
              <SelectItem value="office">Kantor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="areaSize">Luas Area (m²) *</Label>
          <Input
            id="areaSize"
            type="number"
            placeholder="Contoh: 50"
            onChange={(e) => setFormData({ ...formData, areaSize: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rooms">Jumlah Ruangan *</Label>
          <Input
            id="rooms"
            type="number"
            placeholder="Jumlah ruangan"
            onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
          />
        </div>
      </div>

      {totalPrice > 0 && <PriceSummary totalPrice={totalPrice} />}
    </div>
  );
}

function PlumbingServiceForm({ formData, setFormData }: any) {
  const totalPrice = useMemo(() => {
    const issues = formData.plumbingIssues || [];
    return issues.reduce((sum: number, issue: string) => {
      return sum + (PRICES.plumbing[issue as keyof typeof PRICES.plumbing] || 0);
    }, 0);
  }, [formData.plumbingIssues]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Detail Layanan Ledeng/Pipa</h3>
        <div className="space-y-2">
          <Label>Jenis Masalah *</Label>
          <div className="space-y-2">
            {Object.entries(PRICES.plumbing).map(([item, price]) => (
              <div key={item} className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={item.toLowerCase().replace(/\s/g, "-")}
                    onCheckedChange={(checked) => {
                      const current = formData.plumbingIssues || [];
                      if (checked) {
                        setFormData({ ...formData, plumbingIssues: [...current, item] });
                      } else {
                        setFormData({ ...formData, plumbingIssues: current.filter((i: string) => i !== item) });
                      }
                    }}
                  />
                  <Label htmlFor={item.toLowerCase().replace(/\s/g, "-")} className="font-normal cursor-pointer">
                    {item}
                  </Label>
                </div>
                <span className="text-sm font-semibold text-primary">
                  Rp {price.toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="urgency">Tingkat Urgensi *</Label>
          <Select onValueChange={(value) => setFormData({ ...formData, urgency: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih urgensi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="emergency">Darurat (dalam 24 jam)</SelectItem>
              <SelectItem value="urgent">Mendesak (1-2 hari)</SelectItem>
              <SelectItem value="normal">Normal (3-5 hari)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {totalPrice > 0 && <PriceSummary totalPrice={totalPrice} />}
    </div>
  );
}

function SedotWCServiceForm({ formData, setFormData }: any) {
  const totalPrice = useMemo(() => {
    const count = parseInt(formData.wcCount) || 0;
    if (count === 0) return 0;
    return PRICES.sedotWC.base + (PRICES.sedotWC.perUnit * (count - 1));
  }, [formData.wcCount]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Detail Layanan Sedot WC</h3>

        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span>Harga Dasar (1 unit):</span>
            <span className="font-semibold">Rp {PRICES.sedotWC.base.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tambahan per unit:</span>
            <span className="font-semibold">Rp {PRICES.sedotWC.perUnit.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="wcCount">Jumlah WC/Septic Tank *</Label>
          <Input
            id="wcCount"
            type="number"
            min="1"
            placeholder="Jumlah WC"
            onChange={(e) => setFormData({ ...formData, wcCount: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tankType">Tipe Septic Tank *</Label>
          <Select onValueChange={(value) => setFormData({ ...formData, tankType: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="biotech">Biotech</SelectItem>
              <SelectItem value="traditional">Konvensional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="accessibility">Akses Truk *</Label>
          <Select onValueChange={(value) => setFormData({ ...formData, accessibility: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih kondisi akses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Mudah (langsung ke lokasi)</SelectItem>
              <SelectItem value="moderate">Sedang (perlu selang tambahan)</SelectItem>
              <SelectItem value="difficult">Sulit (gang sempit)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {totalPrice > 0 && <PriceSummary totalPrice={totalPrice} />}
    </div>
  );
}

function GardenServiceForm({ formData, setFormData }: any) {
  const totalPrice = useMemo(() => {
    const services = formData.gardenServices || [];
    return services.reduce((sum: number, service: string) => {
      return sum + (PRICES.garden[service as keyof typeof PRICES.garden] || 0);
    }, 0);
  }, [formData.gardenServices]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Detail Layanan Taman</h3>
        <div className="space-y-2">
          <Label>Jenis Layanan *</Label>
          <div className="space-y-2">
            {Object.entries(PRICES.garden).map(([item, price]) => (
              <div key={item} className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={item.toLowerCase().replace(/\s/g, "-")}
                    onCheckedChange={(checked) => {
                      const current = formData.gardenServices || [];
                      if (checked) {
                        setFormData({ ...formData, gardenServices: [...current, item] });
                      } else {
                        setFormData({ ...formData, gardenServices: current.filter((i: string) => i !== item) });
                      }
                    }}
                  />
                  <Label htmlFor={item.toLowerCase().replace(/\s/g, "-")} className="font-normal cursor-pointer">
                    {item}
                  </Label>
                </div>
                <span className="text-sm font-semibold text-primary">
                  Rp {price.toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gardenSize">Luas Taman (m²) *</Label>
          <Input
            id="gardenSize"
            type="number"
            placeholder="Luas area taman"
            onChange={(e) => setFormData({ ...formData, gardenSize: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gardenStyle">Gaya Taman *</Label>
          <Select onValueChange={(value) => setFormData({ ...formData, gardenStyle: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih gaya taman" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minimalis">Minimalis</SelectItem>
              <SelectItem value="tropis">Tropis</SelectItem>
              <SelectItem value="modern">Modern</SelectItem>
              <SelectItem value="natural">Natural</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {totalPrice > 0 && <PriceSummary totalPrice={totalPrice} />}
    </div>
  );
}

function FurnitureServiceForm({ formData, setFormData }: any) {
  const totalPrice = useMemo(() => {
    const types = formData.furnitureTypes || [];
    return types.reduce((sum: number, type: string) => {
      return sum + (PRICES.furniture[type as keyof typeof PRICES.furniture] || 0);
    }, 0);
  }, [formData.furnitureTypes]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Detail Pesanan Furniture</h3>
        <div className="space-y-2">
          <Label>Jenis Furniture *</Label>
          <div className="space-y-2">
            {Object.entries(PRICES.furniture).map(([item, price]) => (
              <div key={item} className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={item.toLowerCase().replace(/\s/g, "-")}
                    onCheckedChange={(checked) => {
                      const current = formData.furnitureTypes || [];
                      if (checked) {
                        setFormData({ ...formData, furnitureTypes: [...current, item] });
                      } else {
                        setFormData({ ...formData, furnitureTypes: current.filter((i: string) => i !== item) });
                      }
                    }}
                  />
                  <Label htmlFor={item.toLowerCase().replace(/\s/g, "-")} className="font-normal cursor-pointer">
                    {item}
                  </Label>
                </div>
                <span className="text-sm font-semibold text-primary">
                  Rp {price.toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="material">Material Utama *</Label>
          <Select onValueChange={(value) => setFormData({ ...formData, material: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih material" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kayu-jati">Kayu Jati</SelectItem>
              <SelectItem value="kayu-mahoni">Kayu Mahoni</SelectItem>
              <SelectItem value="mdf">MDF</SelectItem>
              <SelectItem value="multiplek">Multiplek</SelectItem>
              <SelectItem value="hpl">HPL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="finishing">Finishing *</Label>
          <Select onValueChange={(value) => setFormData({ ...formData, finishing: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih finishing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="duco">Duco</SelectItem>
              <SelectItem value="natural">Natural/Politur</SelectItem>
              <SelectItem value="hpl">HPL</SelectItem>
              <SelectItem value="melamine">Melamine</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dimensions">Ukuran/Dimensi</Label>
          <Textarea
            id="dimensions"
            placeholder="Contoh: Lemari 200cm x 60cm x 180cm"
            rows={2}
            onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
          />
        </div>
      </div>

      {totalPrice > 0 && <PriceSummary totalPrice={totalPrice} />}
    </div>
  );
}

function GeneralServiceForm({ formData, setFormData }: any) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Detail Layanan</h3>
      <div className="space-y-2">
        <Label htmlFor="serviceDescription">Deskripsi Pekerjaan *</Label>
        <Textarea
          id="serviceDescription"
          placeholder="Jelaskan detail pekerjaan yang dibutuhkan..."
          rows={5}
          required
          onChange={(e) => setFormData({ ...formData, serviceDescription: e.target.value })}
        />
      </div>

      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Untuk estimasi harga yang akurat, kami akan menghubungi Anda setelah form dikirim.
        </p>
      </div>
    </div>
  );
}