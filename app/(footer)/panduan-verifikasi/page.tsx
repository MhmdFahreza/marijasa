"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  FileText, Upload, CheckCircle, Clock, AlertCircle, 
  Shield, Award, User, Briefcase, Camera, ChevronRight 
} from "lucide-react";
import PageTransition from "@/app/components/transition/PageTransition";

const verificationSteps = [
  {
    icon: User,
    title: "Lengkapi Profil",
    description: "Isi informasi pribadi dan profesional Anda",
    duration: "5 menit",
    requirements: [
      "Nama lengkap sesuai KTP",
      "Nomor telepon aktif",
      "Email valid",
      "Foto profil profesional"
    ]
  },
  {
    icon: FileText,
    title: "Upload Dokumen",
    description: "Siapkan dan upload dokumen identitas",
    duration: "10 menit",
    requirements: [
      "KTP/SIM/Passport (foto/scan)",
      "NPWP (jika ada)",
      "Sertifikat keahlian (jika ada)",
      "Portfolio pekerjaan"
    ]
  },
  {
    icon: Briefcase,
    title: "Verifikasi Keahlian",
    description: "Tunjukkan keahlian dan pengalaman Anda",
    duration: "15 menit",
    requirements: [
      "Deskripsi layanan yang ditawarkan",
      "Harga dan paket layanan",
      "Area layanan",
      "Pengalaman kerja"
    ]
  },
  {
    icon: CheckCircle,
    title: "Review & Persetujuan",
    description: "Tim kami akan mereview dokumen Anda",
    duration: "1-3 hari kerja",
    requirements: [
      "Verifikasi identitas",
      "Validasi dokumen",
      "Pengecekan background",
      "Persetujuan tim"
    ]
  }
];

const documentTypes = [
  {
    icon: Camera,
    title: "KTP/Identitas",
    description: "Foto KTP yang jelas dan tidak blur",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Award,
    title: "Sertifikat",
    description: "Sertifikat keahlian atau pelatihan",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Briefcase,
    title: "Portfolio",
    description: "Contoh hasil pekerjaan sebelumnya",
    color: "from-emerald-500 to-teal-500"
  }
];

const verificationBenefits = [
  "Badge verifikasi di profil Anda",
  "Muncul di hasil pencarian teratas",
  "Akses fitur premium gratis 1 bulan",
  "Prioritas customer support",
  "Dipromosikan di media sosial kami",
  "Mendapat lebih banyak pesanan"
];

export default function PanduanVerifikasiPage() {
  const [activeStep, setActiveStep] = useState(0);
  const router = useRouter();

  const handleStartVerification = () => {
    router.push('/mitra/daftar');
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#7CE0A8] via-emerald-400 to-teal-500">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:30px_30px]" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white mb-6">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Proses Verifikasi Aman & Terpercaya</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Panduan Verifikasi Penyedia Jasa
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
              Ikuti 4 langkah mudah untuk menjadi penyedia jasa terverifikasi dan dapatkan akses ke ribuan pelanggan potensial
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handleStartVerification}
                className="bg-white text-[#7CE0A8] px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-2xl hover:shadow-3xl hover:scale-105"
              >
                Mulai Verifikasi
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-[#7CE0A8] transition-all">
                Download Panduan PDF
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Steps Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
              Langkah Verifikasi
            </h2>

            <div className="grid lg:grid-cols-4 gap-6">
              {verificationSteps.map((step, index) => (
                <div
                  key={index}
                  onClick={() => setActiveStep(index)}
                  className={`cursor-pointer transition-all duration-300 ${
                    activeStep === index
                      ? "scale-105"
                      : "hover:scale-102"
                  }`}
                >
                  <div className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all border-2 ${
                    activeStep === index
                      ? "border-[#7CE0A8]"
                      : "border-gray-100 dark:border-gray-700"
                  } overflow-hidden h-full`}>
                    {/* Step Number */}
                    <div className="absolute top-4 right-4 w-10 h-10 bg-gradient-to-br from-[#7CE0A8] to-emerald-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      {index + 1}
                    </div>

                    <div className="p-6">
                      {/* Icon */}
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#7CE0A8] to-emerald-500 rounded-2xl mb-4 shadow-lg">
                        <step.icon className="w-8 h-8 text-white" />
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {step.title}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                        {step.description}
                      </p>

                      {/* Duration */}
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <Clock className="w-4 h-4" />
                        <span>{step.duration}</span>
                      </div>

                      {/* Requirements */}
                      {activeStep === index && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Yang Dibutuhkan:
                          </p>
                          <ul className="space-y-2">
                            {step.requirements.map((req, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <CheckCircle className="w-4 h-4 text-[#7CE0A8] flex-shrink-0 mt-0.5" />
                                <span>{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Document Types */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">
              Dokumen yang Diperlukan
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-12 max-w-2xl mx-auto">
              Pastikan semua dokumen Anda jelas, terbaca, dan tidak kadaluarsa
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {documentTypes.map((doc, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-gray-100 dark:border-gray-700 group"
                >
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${doc.color} rounded-2xl mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                    <doc.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {doc.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {doc.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits Section */}
          <div className="bg-gradient-to-r from-[#7CE0A8] to-emerald-500 rounded-3xl p-12 shadow-2xl">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <Award className="w-16 h-16 text-white mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white mb-4">
                  Keuntungan Menjadi Terverifikasi
                </h2>
                <p className="text-white/90 text-lg">
                  Tingkatkan kredibilitas dan dapatkan lebih banyak pelanggan
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {verificationBenefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white"
                  >
                    <CheckCircle className="w-6 h-6 flex-shrink-0" />
                    <span className="font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="mt-20">
            <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-lg p-6">
              <div className="flex gap-4">
                <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-200 mb-2">
                    Penting untuk Diperhatikan:
                  </h3>
                  <ul className="space-y-2 text-amber-800 dark:text-amber-300 text-sm">
                    <li>• Semua dokumen harus asli dan masih berlaku</li>
                    <li>• Foto/scan dokumen harus jelas dan terbaca dengan baik</li>
                    <li>• Informasi yang diberikan harus akurat dan dapat diverifikasi</li>
                    <li>• Proses verifikasi memakan waktu 1-3 hari kerja</li>
                    <li>• Anda akan menerima email notifikasi setelah verifikasi selesai</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Siap Untuk Memulai?
            </h3>
            <button 
              onClick={handleStartVerification}
              className="bg-gradient-to-r from-[#7CE0A8] to-emerald-500 text-white px-10 py-5 rounded-xl font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all inline-flex items-center gap-2"
            >
              Mulai Proses Verifikasi
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}