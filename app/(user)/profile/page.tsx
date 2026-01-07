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
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/contexts/AuthContext";

// Tipe data untuk user
interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  gps_link: string | null;
  created_at: string;
  avatar: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // State untuk data user
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // State untuk preview avatar
  const [avatarPreview, setAvatarPreview] = useState<string>("/profile.svg");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Load user profile dari database saat component mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!isAuthenticated || !user) {
        toast.error("Anda harus login terlebih dahulu");
        router.push("/login");
        return;
      }

      try {
        setIsLoading(true);
        
        // Fetch user profile from API
        const response = await fetch("/api/user/profile", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 401) {
            toast.error("Sesi Anda telah berakhir. Silakan login kembali.");
            router.push("/login");
            return;
          }
          throw new Error("Gagal memuat profil");
        }

        const data = await response.json();
        
        if (data.profile) {
          setProfile(data.profile);
          setAvatarPreview(data.profile.avatar || "/profile.svg");
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
        toast.error("Terjadi kesalahan saat memuat profil");
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      loadProfile();
    }
  }, [isAuthenticated, user, authLoading, router]);

  // Handle change avatar
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("File harus berupa gambar");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarPreview(event.target.result as string);
          setAvatarFile(file);
          setIsEditing(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: value,
      };
    });
    setIsEditing(true);
  };

  // Handle save profile
  const handleSaveProfile = async () => {
    if (!profile) return;

    setIsSaving(true);

    try {
      // Upload avatar if changed
      let avatarUrl = profile.avatar;
      
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);

        const uploadResponse = await fetch("/api/user/upload-avatar", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Gagal mengupload avatar");
        }

        const uploadData = await uploadResponse.json();
        avatarUrl = uploadData.avatarUrl;
      }

      // Update profile
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: profile.name,
          address: profile.address,
          gps_link: profile.gps_link,
          avatar: avatarUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal menyimpan profil");
      }

      const data = await response.json();
      
      // Update state with new profile data
      setProfile(data.profile);
      setAvatarPreview(data.profile.avatar || "/profile.svg");
      setAvatarFile(null);
      
      // Refresh auth context
      await refreshUser();
      
      toast.success("Profil berhasil disimpan!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Terjadi kesalahan saat menyimpan profil");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel changes
  const handleCancelChanges = async () => {
    if (!user) return;

    try {
      // Reload profile from server
      const response = await fetch("/api/user/profile", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setAvatarPreview(data.profile.avatar || "/profile.svg");
        setAvatarFile(null);
      }
    } catch (error) {
      console.error("Error reloading profile:", error);
    }

    setIsEditing(false);
    toast.info("Perubahan dibatalkan");
  };

  // Format join date
  const formattedJoinDate = profile
    ? new Date(profile.created_at).toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  // Loading state
  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="h-96 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="lg:col-span-2">
                <div className="h-96 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-600">Profil tidak ditemukan</p>
        </div>
      </div>
    );
  }

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
                      <AvatarImage src={avatarPreview} alt={profile.name} />
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
                        disabled={isSaving}
                      />
                    </label>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {profile.name || "Pengguna"}
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
                        {profile.email}
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
                      Simpan link Google Maps lokasi rumah Anda di sini. Saat
                      memesan jasa, Anda bisa langsung menggunakan lokasi ini
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
                  Update informasi pribadi Anda. Nama dan alamat dapat diubah
                  sesuai kebutuhan.
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
                      value={profile.name}
                      onChange={handleInputChange}
                      disabled={isSaving}
                      className="pl-10 py-6 text-base border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>
                </div>

                {/* Email & Telepon */}
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
                        value={profile.email}
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
                        value={profile.phone || ""}
                        disabled
                        className="pl-10 py-6 text-base bg-gray-50 border-gray-300 text-gray-500 cursor-not-allowed"
                        placeholder="Belum ada nomor telepon"
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      Nomor telepon tidak dapat diubah
                    </p>
                  </div>
                </div>

                {/* Alamat Lengkap */}
                <div className="space-y-3">
                  <Label
                    htmlFor="address"
                    className="text-base font-medium flex items-center gap-2"
                  >
                    <Home className="h-4 w-4" />
                    Alamat Lengkap
                  </Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={profile.address || ""}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    className="min-h-[120px] py-4 text-base border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    placeholder="Masukkan alamat lengkap (jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota)"
                  />
                </div>

                {/* Link Google Maps */}
                <div className="space-y-3">
                  <Label
                    htmlFor="gps_link"
                    className="text-base font-medium flex items-center gap-2"
                  >
                    <Globe className="h-4 w-4" />
                    Link Google Maps Lokasi Rumah
                  </Label>
                  <div className="space-y-2">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        id="gps_link"
                        name="gps_link"
                        type="url"
                        value={profile.gps_link || ""}
                        onChange={handleInputChange}
                        disabled={isSaving}
                        className="pl-10 py-6 text-base border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                        placeholder="https://maps.google.com/?q=..."
                      />
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                      <p className="text-sm text-emerald-800 font-medium mb-1">
                        💡 Tips: Simpan link lokasi rumah Anda
                      </p>
                      <p className="text-sm text-emerald-700">
                        Saat memesan jasa, Anda bisa langsung menggunakan
                        lokasi ini tanpa perlu membuka Google Maps lagi
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
                      disabled={!isEditing || isSaving}
                      className="px-8 py-6 text-base border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Batalkan
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={!isEditing || isSaving}
                      className="px-8 py-6 text-base text-white transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5"
                      style={{
                        backgroundColor: isEditing && !isSaving ? "#7CE0A8" : "#C6F7D9",
                        cursor: isEditing && !isSaving ? "pointer" : "not-allowed",
                      }}
                      onMouseEnter={(e) => {
                        if (isEditing && !isSaving) {
                          e.currentTarget.style.backgroundColor = "#5CA68A";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (isEditing && !isSaving) {
                          e.currentTarget.style.backgroundColor = "#7CE0A8";
                        }
                      }}
                    >
                      {isSaving ? (
                        <>
                          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5 mr-2" />
                          Simpan Perubahan
                        </>
                      )}
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
                        Akun Anda dilindungi dengan verifikasi email dan sistem
                        keamanan terbaik.
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
                        Anda akan menerima notifikasi untuk pemesanan,
                        pembayaran, dan update jasa.
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