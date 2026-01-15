"use client";

import { useState } from "react";
import { 
  Wrench, Paintbrush, Laptop, Camera, Heart, GraduationCap, 
  Car, Home, Scissors, ShoppingBag, TrendingUp, Search
} from "lucide-react";
import PageTransition from "@/app/components/transition/PageTransition";

const categories = [
  {
    icon: Wrench,
    title: "Perbaikan & Renovasi",
    description: "Tukang, instalasi listrik, plumbing",
    count: "2,340+ penyedia",
    color: "from-blue-500 to-cyan-500",
    popular: true
  },
  {
    icon: Paintbrush,
    title: "Desain & Kreatif",
    description: "Graphic design, UI/UX, ilustrasi",
    count: "1,890+ penyedia",
    color: "from-purple-500 to-pink-500",
    popular: true
  },
  {
    icon: Laptop,
    title: "IT & Programming",
    description: "Web development, app development",
    count: "3,120+ penyedia",
    color: "from-emerald-500 to-teal-500",
    popular: true
  },
  {
    icon: Camera,
    title: "Fotografi & Video",
    description: "Wedding, event, product photography",
    count: "1,560+ penyedia",
    color: "from-orange-500 to-red-500",
    popular: true
  },
  {
    icon: Heart,
    title: "Kesehatan & Kecantikan",
    description: "Makeup artist, hairstylist, spa",
    count: "980+ penyedia",
    color: "from-rose-500 to-pink-500",
    popular: false
  },
  {
    icon: GraduationCap,
    title: "Pendidikan & Les",
    description: "Tutor, guru les, mentor",
    count: "1,230+ penyedia",
    color: "from-indigo-500 to-purple-500",
    popular: false
  },
  {
    icon: Car,
    title: "Transportasi & Logistik",
    description: "Delivery, moving service, driver",
    count: "2,100+ penyedia",
    color: "from-yellow-500 to-orange-500",
    popular: false
  },
  {
    icon: Home,
    title: "Kebersihan & Perawatan",
    description: "Cleaning service, laundry, gardening",
    count: "1,670+ penyedia",
    color: "from-green-500 to-emerald-500",
    popular: false
  },
  {
    icon: Scissors,
    title: "Fashion & Jahit",
    description: "Tailor, alterasi, custom clothing",
    count: "890+ penyedia",
    color: "from-fuchsia-500 to-purple-500",
    popular: false
  },
  {
    icon: ShoppingBag,
    title: "Event & Katering",
    description: "Catering, event organizer, dekorasi",
    count: "1,450+ penyedia",
    color: "from-amber-500 to-orange-500",
    popular: false
  }
];

export default function KategoriJasaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filteredCategories = categories.filter(cat =>
    cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedCategories = showAll ? filteredCategories : filteredCategories.slice(0, 6);

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#7CE0A8] via-emerald-400 to-teal-500">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:40px_40px]" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white mb-6">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">10+ Kategori Tersedia</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                Kategori Jasa Populer
              </h1>
              <p className="text-xl text-white/90 max-w-3xl mx-auto">
                Temukan penyedia jasa terbaik untuk kebutuhan Anda dari berbagai kategori pilihan
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari kategori jasa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-0 shadow-2xl focus:ring-2 focus:ring-white/50 text-gray-900 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Popular Badge Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-1 h-8 bg-gradient-to-b from-[#7CE0A8] to-emerald-500 rounded-full" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Kategori Terpopuler
            </h2>
          </div>

          {/* Categories Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {displayedCategories.map((category, index) => (
              <div
                key={index}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700"
              >
                {/* Popular Badge */}
                {category.popular && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      POPULER
                    </div>
                  </div>
                )}

                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-5 transition-opacity`} />

                <div className="relative p-8">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${category.color} rounded-2xl mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                    <category.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-[#7CE0A8] transition-colors">
                    {category.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 leading-relaxed">
                    {category.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {category.count}
                    </span>
                    <button className="text-[#7CE0A8] hover:text-emerald-600 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                      Lihat Semua
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Show More Button */}
          {filteredCategories.length > 6 && (
            <div className="text-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="bg-gradient-to-r from-[#7CE0A8] to-emerald-500 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                {showAll ? "Tampilkan Lebih Sedikit" : `Lihat Semua Kategori (${filteredCategories.length})`}
              </button>
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-[#7CE0A8] to-emerald-500 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: "15,000+", label: "Penyedia Jasa" },
                { value: "50,000+", label: "Proyek Selesai" },
                { value: "10+", label: "Kategori" },
                { value: "4.8/5", label: "Rating Rata-rata" }
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-white/90 text-sm">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-12 text-center border border-gray-100 dark:border-gray-700">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Tidak Menemukan Kategori yang Anda Cari?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                Hubungi tim kami dan beri tahu kami layanan apa yang Anda butuhkan. Kami akan membantu mencarikan penyedia jasa yang tepat!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-gradient-to-r from-[#7CE0A8] to-emerald-500 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all">
                  Hubungi Kami
                </button>
                <button className="border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-xl font-semibold hover:border-[#7CE0A8] hover:text-[#7CE0A8] transition-all">
                  Lihat Panduan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}