// app/(user)/profile/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Camera,
  Save,
  Home,
  Globe,
  UserCircle,
} from "lucide-react";
import { toast } from "sonner";

// Tipe data untuk user
interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gpsLink: string;
  joinDate: string;
  avatar: string;
}

export default function ProfilePage() {
  // State untuk data user
  const [user, setUser] = useState<UserProfile>({
    id: "user-001",
    name: "John Dinosaur",
    email: "dinosaur123@gmail.com",
    phone: "08838553739",
    address: "Jl. Raya No. 123, Kelurahan Dino, Kecamatan Prehistoric, Kota Jurassic",
    gpsLink: "https://maps.google.com/?q=-6.2088,106.8456",
    joinDate: "2023-10-15",
    avatar: "/avatars/user-avatar.jpg",
  });

  // State untuk preview avatar
  const [avatarPreview, setAvatarPreview] = useState<string>(user.avatar);
  const [isEditing, setIsEditing] = useState(false);

  // Load user profile dari localStorage saat component mount
  useEffect(() => {
    const savedProfile = localStorage.getItem("userProfile");
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setUser(profile);
      setAvatarPreview(profile.avatar);
    }
  }, []);

  // Handle change avatar
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      setIsEditing(true);
    }
  };

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setUser((prev) => ({
      ...prev,
      [name]: value,
    }));
    setIsEditing(true);
  };

  // Handle save profile
  const handleSaveProfile = () => {
    // Simpan perubahan ke localStorage
    const updatedProfile = {
      ...user,
      avatar: avatarPreview,
    };
    localStorage.setItem("userProfile", JSON.stringify(updatedProfile));
    
    toast.success("Profil berhasil disimpan!");
    setIsEditing(false);
  };

  // Handle cancel changes
  const handleCancelChanges = () => {
    const savedProfile = localStorage.getItem("userProfile");
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setUser(profile);
      setAvatarPreview(profile.avatar);
    } else {
      // Reset ke default jika belum ada data tersimpan
      setUser({
        id: "user-001",
        name: "John Dinosaur",
        email: "dinosaur123@gmail.com",
        phone: "08838553739",
        address: "Jl. Raya No. 123, Kelurahan Dino, Kecamatan Prehistoric, Kota Jurassic",
        gpsLink: "https://maps.google.com/?q=-6.2088,106.8456",
        joinDate: "2023-10-15",
        avatar: "/avatars/user-avatar.jpg",
      });
      setAvatarPreview("/avatars/user-avatar.jpg");
    }
    setIsEditing(false);
    toast.info("Perubahan dibatalkan");
  };

  // Format join date
  const formattedJoinDate = new Date(user.joinDate).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Profil Saya
          </h1>
          <p className="text-gray-600">
            Kelola informasi profil Anda untuk pengalaman yang lebih personal
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Kolom Kiri - Informasi Profil & Avatar */}
          <div className="lg:col-span-1 space-y-8">
            {/* Card Avatar */}
            <Card className="shadow-lg border-0">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    <Avatar className="h-40 w-40 border-4 border-white shadow-lg">
                      <AvatarImage src={avatarPreview} alt={user.name} />
                      <AvatarFallback className="text-4xl bg-gradient-to-br from-emerald-100 to-teal-100">
                        <UserCircle className="h-20 w-20 text-emerald-500" />
                      </AvatarFallback>
                    </Avatar>
                    <label
                      htmlFor="avatar-upload"
                      className="absolute bottom-2 right-2 bg-white p-3 rounded-full shadow-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <Camera className="h-5 w-5 text-emerald-600" />
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </label>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {user.name}
                  </h2>
                  <p className="text-gray-600 mb-4">Pengguna Aktif</p>
                  
                  <div className="w-full space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Bergabung</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {formattedJoinDate}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Email</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 truncate ml-2">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card Tips */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Tips Link Google Maps
                    </h3>
                    <p className="text-sm text-gray-600">
                      Simpan link Google Maps lokasi rumah Anda di sini. 
                      Saat memesan jasa, Anda bisa langsung menggunakan lokasi ini 
                      tanpa perlu membuka Google Maps lagi.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Kolom Kanan - Form Edit Profil */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <User className="h-6 w-6 text-emerald-600" />
                  Informasi Pribadi
                </CardTitle>
                <CardDescription>
                  Update informasi pribadi Anda. Email dan tanggal bergabung tidak dapat diubah.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Nama Lengkap */}
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-base font-medium">
                    Nama Lengkap
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="name"
                      name="name"
                      value={user.name}
                      onChange={handleInputChange}
                      className="pl-10 py-6 text-base border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>
                </div>

                {/* Email & Telepon - Tidak bisa diubah */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-base font-medium">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        id="email"
                        name="email"
                        value={user.email}
                        disabled
                        className="pl-10 py-6 text-base bg-gray-50 border-gray-300 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      Email tidak dapat diubah
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="phone" className="text-base font-medium">
                      Nomor Telepon
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        id="phone"
                        name="phone"
                        value={user.phone}
                        disabled
                        className="pl-10 py-6 text-base bg-gray-50 border-gray-300 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      Nomor telepon tidak dapat diubah
                    </p>
                  </div>
                </div>

                {/* Alamat Lengkap */}
                <div className="space-y-3">
                  <Label htmlFor="address" className="text-base font-medium flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Alamat Lengkap
                  </Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={user.address}
                    onChange={handleInputChange}
                    className="min-h-[120px] py-4 text-base border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    placeholder="Masukkan alamat lengkap (jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota)"
                  />
                </div>

                {/* Link Google Maps */}
                <div className="space-y-3">
                  <Label htmlFor="gpsLink" className="text-base font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Link Google Maps Lokasi Rumah
                  </Label>
                  <div className="space-y-2">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        id="gpsLink"
                        name="gpsLink"
                        type="url"
                        value={user.gpsLink}
                        onChange={handleInputChange}
                        className="pl-10 py-6 text-base border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                      <p className="text-sm text-emerald-800 font-medium mb-1">
                        💡 Tips: Simpan link lokasi rumah Anda
                      </p>
                      <p className="text-sm text-emerald-700">
                        Saat memesan jasa, Anda bisa langsung menggunakan lokasi ini tanpa perlu membuka Google Maps lagi
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="pt-8 border-t">
                  <div className="flex flex-col sm:flex-row gap-4 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelChanges}
                      className="px-8 py-6 text-base border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Batalkan
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={!isEditing}
                      className="px-8 py-6 text-base text-white transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5"
                      style={{ 
                        backgroundColor: isEditing ? '#7CE0A8' : '#C6F7D9',
                        cursor: isEditing ? 'pointer' : 'not-allowed'
                      }}
                      onMouseEnter={(e) => {
                        if (isEditing) {
                          e.currentTarget.style.backgroundColor = '#5CA68A';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (isEditing) {
                          e.currentTarget.style.backgroundColor = '#7CE0A8';
                        }
                      }}
                    >
                      <Save className="h-5 w-5 mr-2" />
                      Simpan Perubahan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informasi Tambahan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {/* Card Keamanan */}
              <Card className="shadow-md border-0">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg
                        className="h-5 w-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Keamanan Akun
                      </h3>
                      <p className="text-sm text-gray-600">
                        Akun Anda dilindungi dengan verifikasi email dan sistem keamanan terbaik.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card Notifikasi */}
              <Card className="shadow-md border-0">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <svg
                        className="h-5 w-5 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Notifikasi
                      </h3>
                      <p className="text-sm text-gray-600">
                        Anda akan menerima notifikasi untuk pemesanan, pembayaran, dan update jasa.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}