// app/(user)/profile/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "motion/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
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
  Home,
  Globe,
  UserCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/contexts/AuthContext";

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

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("/profile.svg");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Refs for debouncing and preventing auto-reload
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);
  const hasLoadedOnce = useRef(false);

  // Load user profile - ONLY ONCE on mount, no auto-reload
  useEffect(() => {
    const loadProfile = async () => {
      // Skip if already loaded or auth is still loading
      if (hasLoadedOnce.current || authLoading) {
        return;
      }

      if (!isAuthenticated || !user) {
        toast.error("Anda harus login terlebih dahulu");
        router.push("/login");
        return;
      }

      try {
        setIsInitialLoading(true);
        
        const response = await fetch("/api/user/profile", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
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
          hasLoadedOnce.current = true;
          console.log("[Profile] Data loaded successfully");
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
        toast.error("Terjadi kesalahan saat memuat profil");
      } finally {
        setIsInitialLoading(false);
        // Mark initial mount as complete after a short delay
        setTimeout(() => {
          isInitialMount.current = false;
        }, 1000);
      }
    };

    // Only load if we haven't loaded before
    if (!hasLoadedOnce.current) {
      loadProfile();
    }
  }, [isAuthenticated, user, authLoading, router]);

  // Auto-save function
  const autoSaveProfile = useCallback(async (updatedProfile: UserProfile, newAvatarFile?: File) => {
    if (isInitialMount.current) {
      console.log("[Profile] Skipping save during initial mount");
      return;
    }
    
    setSaveStatus("saving");
    console.log("[Profile] Auto-saving...");

    try {
      let avatarUrl = updatedProfile.avatar;
      
      // Upload avatar if changed
      if (newAvatarFile) {
        const formData = new FormData();
        formData.append("avatar", newAvatarFile);

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
        console.log("[Profile] Avatar uploaded:", avatarUrl);
      }

      // Update profile
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: updatedProfile.name,
          address: updatedProfile.address,
          gps_link: updatedProfile.gps_link,
          avatar: avatarUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal menyimpan profil");
      }

      const data = await response.json();
      
      // Update local state with server response
      setProfile(data.profile);
      setAvatarPreview(data.profile.avatar || "/profile.svg");
      if (newAvatarFile) {
        setAvatarFile(null);
      }
      
      // Refresh auth context to update navbar
      await refreshUser();
      
      setSaveStatus("saved");
      console.log("[Profile] Profile saved successfully");
      
      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setSaveStatus("error");
      toast.error("Gagal menyimpan perubahan");
      
      // Reset to idle after showing error
      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    }
  }, [refreshUser]);

  // Debounced save
  const debouncedSave = useCallback((updatedProfile: UserProfile, newAvatarFile?: File) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      autoSaveProfile(updatedProfile, newAvatarFile);
    }, 1500); // Increased to 1.5 seconds
  }, [autoSaveProfile]);

  // Handle avatar change with immediate save
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

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

    // Show preview immediately (optimistic update)
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarPreview(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    setAvatarFile(file);
    
    // Save immediately for avatar changes
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await autoSaveProfile(profile, file);
  };

  // Handle input changes with debounced save
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    setProfile((prev) => {
      if (!prev) return prev;
      
      const updatedProfile = {
        ...prev,
        [name]: value,
      };
      
      // Trigger debounced save
      debouncedSave(updatedProfile);
      
      return updatedProfile;
    });
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Format join date
  const formattedJoinDate = profile
    ? new Date(profile.created_at).toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  // Save status indicator
  const SaveStatusIndicator = () => {
    switch (saveStatus) {
      case "saving":
        return (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Menyimpan...</span>
          </div>
        );
      case "saved":
        return (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Tersimpan</span>
          </div>
        );
      case "error":
        return (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <span>Gagal menyimpan</span>
          </div>
        );
      default:
        return null;
    }
  };

  // Loading state
  if (isInitialLoading || authLoading) {
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
        {/* Header with Save Status */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Profil Saya
            </h1>
            <p className="text-gray-600">
              Kelola informasi profil Anda untuk pengalaman yang lebih personal
            </p>
          </div>
          <SaveStatusIndicator />
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
                        disabled={saveStatus === "saving"}
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

            {/* Card Tips Auto-Save */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Auto-Save Aktif
                    </h3>
                    <p className="text-sm text-gray-600">
                      Semua perubahan akan disimpan secara otomatis setelah 1.5 detik. Data Anda aman bahkan saat berpindah tab.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card Tips Maps */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Tips Link Google Maps
                    </h3>
                    <p className="text-sm text-gray-600">
                      Simpan link Google Maps lokasi rumah Anda. Saat memesan jasa, Anda bisa langsung menggunakan lokasi ini.
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
                  Update informasi pribadi Anda. Perubahan akan disimpan otomatis.
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
                      disabled={saveStatus === "saving"}
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
                    disabled={saveStatus === "saving"}
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
                        disabled={saveStatus === "saving"}
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