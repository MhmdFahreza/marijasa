"use client";

import { Search, UserCheck, CreditCard, Star, ArrowRight, CheckCircle } from "lucide-react";
import PageTransition from "@/app/components/transition/PageTransition";

const steps = [
  {
    icon: Search,
    title: "Cari Layanan",
    description: "Telusuri berbagai kategori jasa yang tersedia dan temukan yang sesuai dengan kebutuhan Anda",
    color: "from-blue-500 to-cyan-500",
    details: [
      "Filter berdasarkan kategori, lokasi, dan harga",
      "Lihat rating dan review dari pengguna lain",
      "Bandingkan beberapa penyedia jasa"
    ]
  },
  {
    icon: UserCheck,
    title: "Pilih Penyedia",
    description: "Pilih penyedia jasa terpercaya dengan melihat profil, portofolio, dan ulasan pelanggan",
    color: "from-purple-500 to-pink-500",
    details: [
      "Profil lengkap dan terverifikasi",
      "Portfolio pekerjaan sebelumnya",
      "Rating dan testimoni real"
    ]
  },
  {
    icon: CreditCard,
    title: "Lakukan Pembayaran",
    description: "Bayar dengan aman menggunakan berbagai metode pembayaran yang tersedia",
    color: "from-emerald-500 to-teal-500",
    details: [
      "Transfer bank, e-wallet, atau kartu kredit",
      "Dana aman dengan sistem escrow",
      "Konfirmasi otomatis real-time"
    ]
  },
  {
    icon: Star,
    title: "Nikmati Layanan",
    description: "Penyedia jasa akan menyelesaikan pekerjaan sesuai kesepakatan dan berikan rating",
    color: "from-orange-500 to-red-500",
    details: [
      "Komunikasi langsung dengan penyedia",
      "Progress tracking real-time",
      "Garansi kepuasan pelanggan"
    ]
  }
];

const benefits = [
  { title: "Aman & Terpercaya", description: "Sistem escrow melindungi transaksi Anda" },
  { title: "Penyedia Terverifikasi", description: "Semua penyedia jasa sudah diverifikasi" },
  { title: "Harga Transparan", description: "Tidak ada biaya tersembunyi" },
  { title: "Support 24/7", description: "Tim kami siap membantu kapan saja" }
];

export default function CaraKerjaPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#7CE0A8] via-emerald-400 to-teal-500">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:30px_30px]" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl" />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Cara Kerja MARIJASA
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Temukan dan pesan jasa yang Anda butuhkan dengan mudah dan aman. Hanya dalam 4 langkah sederhana!
            </p>
          </div>
        </div>

        {/* Steps Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid gap-12">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute left-[52px] top-32 w-0.5 h-24 bg-gradient-to-b from-gray-300 to-transparent dark:from-gray-700" />
                )}
                
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  {/* Left Side - Icon & Title */}
                  <div className={`${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0">
                        <div className={`inline-flex items-center justify-center w-28 h-28 bg-gradient-to-br ${step.color} rounded-3xl shadow-2xl`}>
                          <step.icon className="w-14 h-14 text-white" />
                        </div>
                      </div>
                      
                      <div className="flex-1 pt-4">
                        <div className="inline-flex items-center gap-3 mb-4">
                          <span className="text-5xl font-bold text-gray-200 dark:text-gray-700">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {step.title}
                          </h2>
                        </div>
                        <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Details */}
                  <div className={`${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                        Fitur Unggulan:
                      </h3>
                      <ul className="space-y-4">
                        {step.details.map((detail, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-[#7CE0A8] flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {detail}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-gray-50 dark:bg-gray-800/50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Kenapa Memilih MARIJASA?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Kami berkomitmen memberikan pengalaman terbaik dalam mencari dan menyediakan jasa
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-[#7CE0A8] to-emerald-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-gradient-to-r from-[#7CE0A8] to-emerald-500 rounded-3xl p-12 shadow-2xl">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Siap Memulai?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Bergabunglah dengan ribuan pengguna yang sudah mempercayai MARIJASA untuk kebutuhan jasa mereka
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-white text-[#7CE0A8] px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2">
                  Cari Jasa Sekarang
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-[#7CE0A8] transition-all flex items-center justify-center gap-2">
                  Daftar Sebagai Penyedia
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}