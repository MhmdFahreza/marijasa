"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Save, 
  X, 
  Plus,
  Edit2,
  Check,
  Globe,
  Briefcase,
  Clock,
  Award,
  Star,
  Shield,
  Tag,
  Loader2
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import CitySelect from "@/app/components/ui/city-select";
import { Skeleton } from "@/app/components/ui/skeleton";
import { toast } from "sonner";

type City = {
  city_id: string;
  name: string;
  province: string;
};

type ProfileData = {
  vendor_id: string;
  name: string;
  email: string;
  phone: string;
  description: string;
  avatar: string;
  service_areas: string[];
  rating: number;
  review_count: number;
  verified: boolean;
  specialties: string[];
  tags: string[];
  category?: string;
  join_date: string;
  services?: any[];
  gallery?: any[];
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCities, setIsLoadingCities] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newServiceArea, setNewServiceArea] = useState("");
  const [tempProfile, setTempProfile] = useState<ProfileData | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  const fetchCities = useCallback(async () => {
    try {
      setIsLoadingCities(true);
      const response = await fetch('/api/master/cities', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Gagal memuat data kota');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setCities(result.data);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      toast.error('Gagal memuat data kota');
    } finally {
      setIsLoadingCities(false);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/mitra/profile', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/mitra/login';
          return;
        }
        throw new Error('Gagal memuat profil');
      }

      const data = await response.json();
      setProfile(data.vendor);
      setTempProfile(data.vendor);
      setAvatarPreview(data.vendor.avatar || "/default-avatar.png");
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Gagal memuat profil');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCities();
    fetchProfile();
  }, [fetchCities, fetchProfile]);

  useEffect(() => {
    if (isEditing && profile) {
      setTempProfile(profile);
    }
  }, [isEditing, profile]);

  const handleSave = async () => {
    if (!tempProfile) return;
    
    setIsSaving(true);
    
    try {
      let avatarUrl = tempProfile.avatar;
      
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);

        const uploadResponse = await fetch('/api/mitra/upload-avatar', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Gagal mengupload avatar');
        }

        const uploadData = await uploadResponse.json();
        avatarUrl = uploadData.avatarUrl;
      }

      const response = await fetch('/api/mitra/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: tempProfile.name,
          description: tempProfile.description,
          service_areas: tempProfile.service_areas,
          specialties: tempProfile.specialties,
          ...(avatarUrl !== profile?.avatar && { avatar: avatarUrl })
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal menyimpan profil');
      }

      const data = await response.json();
      
      setProfile(data.vendor);
      setTempProfile(data.vendor);
      setAvatarFile(null);
      
      toast.success('Profil berhasil diperbarui!');
      setShowSuccess(true);
      setIsEditing(false);
      
      setTimeout(() => setShowSuccess(false), 3000);
      
      window.dispatchEvent(new CustomEvent('mitraProfileUpdated', {
        detail: { 
          name: data.vendor.name, 
          avatar: data.vendor.avatar,
          verified: data.vendor.verified 
        }
      }));
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error(error.message || 'Terjadi kesalahan saat menyimpan profil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTempProfile(profile);
    setAvatarFile(null);
    setAvatarPreview(profile?.avatar || "");
    setIsEditing(false);
    toast.info("Perubahan dibatalkan");
  };

  const handleAddServiceArea = () => {
    if (!tempProfile || !newServiceArea.trim()) return;
    
    const normalizedCity = newServiceArea.trim();
    if (!tempProfile.service_areas.includes(normalizedCity)) {
      setTempProfile({
        ...tempProfile,
        service_areas: [...tempProfile.service_areas, normalizedCity]
      });
      setNewServiceArea("");
    }
  };

  const handleRemoveServiceArea = (city: string) => {
    if (!tempProfile) return;
    
    setTempProfile({
      ...tempProfile,
      service_areas: tempProfile.service_areas.filter(area => area !== city)
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!tempProfile) return;
    
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("File harus berupa gambar");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarPreview(event.target.result as string);
          setAvatarFile(file);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSpecialty = () => {
    if (!tempProfile) return;
    
    const newSpecialty = prompt("Masukkan keahlian baru:");
    if (newSpecialty?.trim() && !tempProfile.specialties.includes(newSpecialty.trim())) {
      setTempProfile({
        ...tempProfile,
        specialties: [...tempProfile.specialties, newSpecialty.trim()]
      });
    }
  };

  const handleRemoveSpecialty = (index: number) => {
    if (!tempProfile) return;
    
    setTempProfile({
      ...tempProfile,
      specialties: tempProfile.specialties.filter((_, i) => i !== index)
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-950">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-6">
                <Skeleton className="h-64 rounded-xl" />
                <Skeleton className="h-48 rounded-xl" />
              </div>
              
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-96 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile || !tempProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Profil Tidak Ditemukan
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Silakan login kembali atau hubungi admin
          </p>
          <Button onClick={() => window.location.href = '/mitra/login'}>
            Kembali ke Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-950">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
              Profile Settings
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mt-2">
              Kelola informasi profil dan jangkauan layanan Anda
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {isEditing ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex items-center gap-2"
                  disabled={isSaving}
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">Batal</span>
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-gradient-to-r from-[#7CE0A8] to-[#5AB894] hover:from-[#6BC999] hover:to-[#4BA683] text-white flex items-center gap-2"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="hidden sm:inline">Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span className="hidden sm:inline">Simpan Perubahan</span>
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="border-[#7CE0A8] text-[#7CE0A8] hover:bg-[#7CE0A8]/10 flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                <span className="hidden sm:inline">Edit Profile</span>
              </Button>
            )}
          </div>
        </div>

        {/* Success Alert */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6"
            >
              <Alert className="border-[#7CE0A8] bg-[#7CE0A8]/10">
                <Check className="h-4 w-4 text-[#7CE0A8]" />
                <AlertDescription className="text-[#5AB88A]">
                  Profile berhasil diperbarui dan akan terlihat di daftar jasa!
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <Card className="border-[#7CE0A8]/20 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#7CE0A8]/10 to-[#7CE0A8]/5 py-6">
                <CardTitle className="text-xl text-[#7CE0A8]">Profile Picture</CardTitle>
                <CardDescription>
                  {isEditing 
                    ? "Upload foto profil terbaru Anda" 
                    : "Foto profil Anda akan ditampilkan kepada pelanggan"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-32 w-32 sm:h-40 sm:w-40 border-4 border-white dark:border-neutral-800 shadow-lg">
                      <AvatarImage 
                        src={isEditing ? avatarPreview : profile.avatar} 
                        alt={profile.name}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/default-avatar.png";
                        }}
                      />
                      <AvatarFallback className="bg-[#7CE0A8]/20 text-[#7CE0A8] text-2xl">
                        {profile.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    {isEditing && (
                      <label
                        htmlFor="avatar-upload"
                        className="absolute bottom-2 right-2 bg-[#7CE0A8] text-white p-2 rounded-full cursor-pointer hover:bg-[#6BC999] transition-colors shadow-lg"
                      >
                        <Camera className="h-4 w-4" />
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                          disabled={isSaving}
                        />
                      </label>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                      {isEditing ? tempProfile.name : profile.name}
                    </h3>
                    {profile.verified && (
                      <div className="inline-flex items-center gap-1 mt-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm">
                        <Shield className="h-3 w-3" />
                        <span>Verified Mitra</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 text-amber-500" />
                      <span className="text-lg font-bold text-neutral-900 dark:text-white">
                        {profile.rating.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                      Rating
                    </p>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                    <div className="flex items-center justify-center gap-1">
                      <Briefcase className="h-4 w-4 text-[#7CE0A8]" />
                      <span className="text-lg font-bold text-neutral-900 dark:text-white">
                        {profile.review_count}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                      Ulasan
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      Bergabung {new Date(profile.join_date).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long'
                      })}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                {profile.tags && profile.tags.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tags Layanan
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs px-2 py-1"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Specialties Card */}
            <Card className="mt-6 border-[#7CE0A8]/20 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#7CE0A8]/10 to-[#7CE0A8]/5 py-4">
                <CardTitle className="text-lg text-[#7CE0A8] flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Keahlian Spesial
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  {isEditing ? (
                    <>
                      {tempProfile.specialties.map((specialty, index) => (
                        <Badge
                          key={index}
                          className="px-3 py-1.5 bg-[#7CE0A8]/20 text-[#5AB88A] border-[#7CE0A8]/30 flex items-center gap-1"
                        >
                          {specialty}
                          <button
                            onClick={() => handleRemoveSpecialty(index)}
                            className="ml-1 text-[#5AB88A] hover:text-[#4a9c7a]"
                            disabled={isSaving}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      <Button
                        onClick={handleAddSpecialty}
                        variant="outline"
                        size="sm"
                        className="border-dashed border-[#7CE0A8] text-[#7CE0A8] hover:bg-[#7CE0A8]/10"
                        disabled={isSaving}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Tambah
                      </Button>
                    </>
                  ) : (
                    profile.specialties.map((specialty, index) => (
                      <Badge
                        key={index}
                        className="px-3 py-1.5 bg-[#7CE0A8]/20 text-[#5AB88A] border-[#7CE0A8]/30"
                      >
                        {specialty}
                      </Badge>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Form */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="profile" className="data-[state=active]:bg-[#7CE0A8] data-[state=active]:text-white">
                  <User className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Profile</span>
                  <span className="sm:hidden">Info</span>
                </TabsTrigger>
                <TabsTrigger value="service" className="data-[state=active]:bg-[#7CE0A8] data-[state=active]:text-white">
                  <Globe className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Jangkauan Layanan</span>
                  <span className="sm:hidden">Area</span>
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card className="border-[#7CE0A8]/20 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-[#7CE0A8]/10 to-[#7CE0A8]/5 py-6">
                    <CardTitle className="text-xl text-[#7CE0A8]">Informasi Profil</CardTitle>
                    <CardDescription>
                      Kelola informasi dasar dan deskripsi profil Anda
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {/* Nama Mitra */}
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-base font-semibold flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Nama Mitra
                        </Label>
                        {isEditing ? (
                          <Input
                            id="name"
                            value={tempProfile.name}
                            onChange={(e) => setTempProfile({...tempProfile, name: e.target.value})}
                            placeholder="Masukkan nama mitra"
                            className="h-12 focus-visible:ring-[#7CE0A8]"
                            disabled={isSaving}
                          />
                        ) : (
                          <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg border">
                            <p className="text-neutral-900 dark:text-white">{profile.name}</p>
                          </div>
                        )}
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-base font-semibold flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </Label>
                        <div className="p-3 bg-gray-100 dark:bg-neutral-800 rounded-lg border">
                          <div className="flex items-center justify-between">
                            <p className="text-neutral-900 dark:text-white">{profile.email}</p>
                            <Badge variant="outline" className="text-xs">
                              Tidak dapat diubah
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Telepon */}
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-base font-semibold flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Nomor Telepon
                        </Label>
                        <div className="p-3 bg-gray-100 dark:bg-neutral-800 rounded-lg border">
                          <div className="flex items-center justify-between">
                            <p className="text-neutral-900 dark:text-white">{profile.phone}</p>
                            <Badge variant="outline" className="text-xs">
                              Tidak dapat diubah
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Deskripsi */}
                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-base font-semibold">
                          Deskripsi Profil
                        </Label>
                        {isEditing ? (
                          <>
                            <Textarea
                              id="description"
                              value={tempProfile.description}
                              onChange={(e) => setTempProfile({...tempProfile, description: e.target.value})}
                              placeholder="Ceritakan tentang layanan, pengalaman, dan keahlian Anda..."
                              rows={6}
                              className="focus-visible:ring-[#7CE0A8]"
                              disabled={isSaving}
                              maxLength={500}
                            />
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              {tempProfile.description.length}/500 karakter
                            </p>
                          </>
                        ) : (
                          <div className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg border">
                            <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-line">
                              {profile.description || "Belum ada deskripsi"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Service Area Tab */}
              <TabsContent value="service">
                <Card className="border-[#7CE0A8]/20 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-[#7CE0A8]/10 to-[#7CE0A8]/5 py-6">
                    <CardTitle className="text-xl text-[#7CE0A8] flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Jangkauan Layanan
                    </CardTitle>
                    <CardDescription>
                      Kelola kota/daerah tempat Anda menyediakan layanan
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {isEditing ? (
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <Label className="text-base font-semibold">
                            Tambah Area Layanan Baru
                          </Label>
                          {isLoadingCities ? (
                            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                              <Loader2 className="h-4 w-4 animate-spin text-[#7CE0A8]" />
                              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                Memuat data kota...
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <div className="flex-1">
                                <CitySelect
                                  value={newServiceArea}
                                  onValueChange={setNewServiceArea}
                                  placeholder="Pilih kota/daerah"
                                  cities={cities.map(city => city.name)}
                                  triggerClassName="focus:ring-[#7CE0A8]"
                                />
                              </div>
                              <Button
                                onClick={handleAddServiceArea}
                                disabled={!newServiceArea.trim() || isSaving}
                                className="bg-[#7CE0A8] hover:bg-[#6BC999] text-white"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Tambah
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <Label className="text-base font-semibold">
                            Area Layanan Saat Ini ({tempProfile.service_areas.length} kota)
                          </Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {tempProfile.service_areas.map((city, index) => (
                              <div
                                key={index}
                                className="group relative p-4 bg-gradient-to-r from-gray-50 to-white dark:from-neutral-800 dark:to-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700 hover:border-[#7CE0A8]/50 transition-all"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-[#7CE0A8]" />
                                    <span className="font-medium text-neutral-900 dark:text-white">
                                      {city}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveServiceArea(city)}
                                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                                    disabled={isSaving}
                                  >
                                    <X className="h-4 w-4 text-red-500" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {tempProfile.service_areas.length === 0 && (
                            <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-lg">
                              <Globe className="h-12 w-12 text-gray-400 dark:text-neutral-600 mx-auto mb-3" />
                              <p className="text-gray-500 dark:text-neutral-400">
                                Belum ada area layanan. Tambahkan kota pertama Anda.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <Label className="text-base font-semibold">
                            Area Layanan ({profile.service_areas.length} kota)
                          </Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {profile.service_areas.map((city, index) => (
                              <div
                                key={index}
                                className="p-4 bg-gradient-to-r from-gray-50 to-white dark:from-neutral-800 dark:to-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700"
                              >
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-[#7CE0A8]" />
                                  <span className="font-medium text-neutral-900 dark:text-white">
                                    {city}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Mobile Action Buttons */}
        <div className="lg:hidden mt-6">
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Batal
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-gradient-to-r from-[#7CE0A8] to-[#5AB894] hover:from-[#6BC999] hover:to-[#4BA683] text-white"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Simpan
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="flex-1 border-[#7CE0A8] text-[#7CE0A8] hover:bg-[#7CE0A8]/10"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}