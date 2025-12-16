// app/mitra/settings/profile/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  Upload,
  ImagePlus
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
import { CITIES_ID } from "@/app/data/cities-id";
import { Skeleton } from "@/app/components/ui/skeleton";

type ServiceArea = {
  id: string;
  city: string;
  notes?: string;
};

type ProfileData = {
  id: string;
  name: string;
  email: string;
  phone: string;
  description: string;
  avatar: string;
  serviceAreas: ServiceArea[];
  rating: number;
  totalReviews: number;
  joinDate: string;
  verified: boolean;
  specialties: string[];
};

const MOCK_PROFILE: ProfileData = {
  id: "mitra-001",
  name: "Edi Taulany",
  email: "edi.taulany@example.com",
  phone: "+6281234567890",
  description: "Spesialis instalasi, perbaikan, dan perawatan AC rumah serta kantor. Menangani AC split, cassette, dan central dengan standar kerja rapi, cepat, dan bergaransi 30 hari. Pengalaman lebih dari 10 tahun dalam bidang AC.",
  avatar: "https://assets.aceternity.com/manu.png",
  serviceAreas: [
    { id: "1", city: "Jakarta Barat" },
    { id: "2", city: "Jakarta Utara" },
    { id: "3", city: "Tangerang" },
    { id: "4", city: "Cirebon" },
    { id: "5", city: "Subang" },
  ],
  rating: 4.3,
  totalReviews: 74,
  joinDate: "2023-01-15",
  verified: true,
  specialties: ["AC Split", "AC Cassette", "AC Central", "Pembersihan AC", "Perbaikan AC"],
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>(MOCK_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newServiceArea, setNewServiceArea] = useState("");
  const [tempProfile, setTempProfile] = useState<ProfileData>(MOCK_PROFILE);

  // Reset tempProfile when editing starts
  useEffect(() => {
    if (isEditing) {
      setTempProfile(profile);
    }
  }, [isEditing, profile]);

  const handleSave = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setProfile(tempProfile);
    setIsEditing(false);
    setIsLoading(false);
    setShowSuccess(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleCancel = () => {
    setTempProfile(profile);
    setIsEditing(false);
  };

  const handleAddServiceArea = () => {
    if (newServiceArea && !tempProfile.serviceAreas.some(area => area.city === newServiceArea)) {
      setTempProfile({
        ...tempProfile,
        serviceAreas: [
          ...tempProfile.serviceAreas,
          { id: Date.now().toString(), city: newServiceArea }
        ]
      });
      setNewServiceArea("");
    }
  };

  const handleRemoveServiceArea = (id: string) => {
    setTempProfile({
      ...tempProfile,
      serviceAreas: tempProfile.serviceAreas.filter(area => area.id !== id)
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate upload and get URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempProfile({
          ...tempProfile,
          avatar: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-1" />
          <Skeleton className="h-96 lg:col-span-2" />
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
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">Batal</span>
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-[#7CE0A8] hover:bg-[#6BC999] text-white flex items-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
                Profile berhasil diperbarui!
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

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
                      <AvatarImage src={isEditing ? tempProfile.avatar : profile.avatar} />
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
                        {profile.totalReviews}
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
                      Bergabung {new Date(profile.joinDate).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long'
                      })}
                    </span>
                  </div>
                </div>
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
                  {profile.specialties.map((specialty, index) => (
                    <Badge
                      key={index}
                      className="px-3 py-1.5 bg-[#7CE0A8]/20 text-[#5AB88A] border-[#7CE0A8]/30"
                    >
                      {specialty}
                    </Badge>
                  ))}
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
                            />
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              {tempProfile.description.length}/500 karakter
                            </p>
                          </>
                        ) : (
                          <div className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg border">
                            <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-line">
                              {profile.description}
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
                          <div className="flex flex-col sm:flex-row gap-2">
                            <div className="flex-1">
                              <CitySelect
                                value={newServiceArea}
                                onValueChange={setNewServiceArea}
                                placeholder="Pilih kota/daerah"
                                cities={CITIES_ID}
                                triggerClassName="focus:ring-[#7CE0A8]"
                              />
                            </div>
                            <Button
                              onClick={handleAddServiceArea}
                              disabled={!newServiceArea}
                              className="bg-[#7CE0A8] hover:bg-[#6BC999] text-white"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Tambah
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-base font-semibold">
                            Area Layanan Saat Ini ({tempProfile.serviceAreas.length} kota)
                          </Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {tempProfile.serviceAreas.map((area) => (
                              <div
                                key={area.id}
                                className="group relative p-4 bg-gradient-to-r from-gray-50 to-white dark:from-neutral-800 dark:to-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700 hover:border-[#7CE0A8]/50 transition-all"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-[#7CE0A8]" />
                                    <span className="font-medium text-neutral-900 dark:text-white">
                                      {area.city}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveServiceArea(area.id)}
                                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                                  >
                                    <X className="h-4 w-4 text-red-500" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {tempProfile.serviceAreas.length === 0 && (
                            <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-lg">
                              <Globe className="h-12 w-12 text-gray-400 dark:text-neutral-600 mx-auto mb-3" />
                              <p className="text-gray-500 dark:text-neutral-400">
                                Belum ada area layanan. Tambahkan kota pertama Anda.
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                Tips Menentukan Jangkauan
                              </p>
                              <ul className="text-xs text-blue-700 dark:text-blue-400 mt-2 space-y-1 list-disc list-inside">
                                <li>Pilih area yang sesuai dengan kapasitas perjalanan Anda</li>
                                <li>Pertimbangkan biaya transportasi dan waktu tempuh</li>
                                <li>Area yang terlalu luas mungkin mengurangi kualitas layanan</li>
                                <li>Fokus pada area yang paling sering mendapat permintaan</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <Label className="text-base font-semibold">
                            Area Layanan ({profile.serviceAreas.length} kota)
                          </Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {profile.serviceAreas.map((area) => (
                              <div
                                key={area.id}
                                className="p-4 bg-gradient-to-r from-gray-50 to-white dark:from-neutral-800 dark:to-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700"
                              >
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-[#7CE0A8]" />
                                  <span className="font-medium text-neutral-900 dark:text-white">
                                    {area.city}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                Total Area Layanan
                              </p>
                              <p className="text-2xl font-bold text-[#7CE0A8] mt-1">
                                {profile.serviceAreas.length}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                Area Terpopuler
                              </p>
                              <p className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mt-1">
                                {profile.serviceAreas[0]?.city || "-"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Mobile Action Buttons */}
            <div className="lg:hidden mt-6">
              <div className="flex gap-3">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className="flex-1"
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Batal
                    </Button>
                    <Button
                      onClick={handleSave}
                      className="flex-1 bg-[#7CE0A8] hover:bg-[#6BC999] text-white"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
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

        {/* Desktop Action Buttons */}
        <div className="hidden lg:flex justify-end gap-3 mt-8 pt-6 border-t">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                className="px-6"
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Batalkan Perubahan
              </Button>
              <Button
                onClick={handleSave}
                className="px-6 bg-[#7CE0A8] hover:bg-[#6BC999] text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Menyimpan Perubahan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Semua Perubahan
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              className="border-[#7CE0A8] text-[#7CE0A8] hover:bg-[#7CE0A8]/10"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Mulai Edit Profile
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Tambahkan komponen Info yang belum di-import
const Info = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);