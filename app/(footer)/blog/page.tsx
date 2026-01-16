"use client";

import { motion, Variants, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, Clock, Tag, TrendingUp, Sparkles } from "lucide-react";

// Animasi yang lebih smooth
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

// Sample blog data
const blogPosts = [
  {
    id: 1,
    title: "Tips Memilih Penyedia Jasa Terpercaya",
    excerpt: "Panduan lengkap untuk memastikan Anda mendapatkan penyedia jasa yang profesional dan terpercaya",
    category: "Tips",
    date: "14 Januari 2025",
    readTime: "5 min",
    image: "📝",
    gradient: "from-blue-400 to-cyan-300",
    tags: ["Panduan", "Profesional", "Trust"],
    featured: true,
    content: `
      <p>Memilih penyedia jasa yang tepat adalah kunci untuk mendapatkan hasil yang memuaskan. Berikut adalah panduan lengkap untuk membantu Anda membuat keputusan yang tepat:</p>

      <h2>1. Periksa Profil dan Portfolio</h2>
      <p>Langkah pertama yang harus dilakukan adalah memeriksa profil penyedia jasa secara menyeluruh. Lihat portfolio mereka, proyek-proyek yang pernah dikerjakan, dan testimoni dari klien sebelumnya. Profil yang lengkap dengan foto profesional dan deskripsi jelas menunjukkan keseriusan penyedia jasa.</p>

      <h2>2. Baca Review dan Rating</h2>
      <p>Review dari pelanggan sebelumnya adalah indikator penting tentang kualitas layanan. Perhatikan tidak hanya rating bintang, tetapi juga baca komentar detail dari klien. Cari pola dalam feedback - apakah konsisten positif atau ada keluhan yang berulang?</p>

      <h2>3. Verifikasi Identitas dan Keahlian</h2>
      <p>Pastikan penyedia jasa telah terverifikasi di platform MARIJASA. Verifikasi identitas dan sertifikasi keahlian menunjukkan kredibilitas. Jangan ragu untuk meminta bukti keahlian tambahan seperti sertifikat pelatihan atau pengalaman kerja.</p>

      <h2>4. Komunikasi yang Jelas</h2>
      <p>Penyedia jasa profesional akan merespons pertanyaan Anda dengan cepat dan jelas. Perhatikan bagaimana mereka berkomunikasi - apakah mereka memahami kebutuhan Anda? Apakah mereka memberikan penjelasan yang detail tentang proses kerja?</p>

      <h2>5. Bandingkan Harga dan Nilai</h2>
      <p>Jangan hanya memilih berdasarkan harga termurah. Pertimbangkan nilai yang ditawarkan - pengalaman, kualitas, dan jaminan layanan. Harga yang terlalu murah bisa jadi indikasi kualitas yang kurang baik.</p>

      <h2>Kesimpulan</h2>
      <p>Dengan mengikuti tips di atas, Anda dapat meminimalkan risiko dan menemukan penyedia jasa yang tepat untuk kebutuhan Anda. Investasi waktu untuk riset di awal akan menghemat waktu dan uang Anda di kemudian hari.</p>
    `
  },
  {
    id: 2,
    title: "Cara Kerja Sistem Pembayaran MARIJASA",
    excerpt: "Pelajari bagaimana sistem pembayaran aman kami melindungi setiap transaksi Anda",
    category: "Panduan",
    date: "12 Januari 2025",
    readTime: "4 min",
    image: "💳",
    gradient: "from-purple-400 to-pink-300",
    tags: ["Pembayaran", "Keamanan", "Escrow"],
    featured: false,
    content: `
      <p>Sistem pembayaran MARIJASA dirancang untuk memberikan keamanan maksimal bagi pembeli dan penyedia jasa. Mari kita pelajari bagaimana sistem escrow kami bekerja:</p>

      <h2>Apa itu Sistem Escrow?</h2>
      <p>Escrow adalah sistem pembayaran pihak ketiga yang menahan dana pembeli sampai pekerjaan selesai dengan memuaskan. Ini melindungi kedua belah pihak dalam transaksi.</p>

      <h2>Langkah-langkah Pembayaran</h2>
      
      <h3>1. Pembayaran Awal</h3>
      <p>Setelah Anda menyetujui penawaran dari penyedia jasa, dana akan ditransfer ke rekening escrow MARIJASA. Dana ini aman dan tidak dapat diakses oleh siapapun sampai pekerjaan selesai.</p>

      <h3>2. Penyedia Jasa Mulai Bekerja</h3>
      <p>Penyedia jasa mendapat notifikasi bahwa pembayaran sudah diamankan dan dapat memulai pekerjaan dengan tenang. Mereka tahu bahwa dana sudah tersedia.</p>

      <h2>Sistem Proteksi Pembeli</h2>
      <p>Jika ada dispute, tim mediasi MARIJASA akan membantu menyelesaikan masalah. Dana akan tetap di escrow sampai dispute diselesaikan secara adil.</p>
    `
  },
  {
    id: 3,
    title: "Keuntungan Menjadi Mitra Penyedia Jasa",
    excerpt: "Temukan berbagai benefit yang akan Anda dapatkan sebagai mitra penyedia jasa MARIJASA",
    category: "Mitra",
    date: "10 Januari 2025",
    readTime: "6 min",
    image: "🤝",
    gradient: "from-green-400 to-emerald-300",
    tags: ["Partnership", "Benefits", "Income"],
    featured: true,
    content: `
      <p>Bergabung dengan MARIJASA sebagai penyedia jasa membuka banyak peluang untuk mengembangkan bisnis Anda. Berikut adalah keuntungan yang akan Anda dapatkan:</p>

      <h2>1. Akses ke Pasar yang Luas</h2>
      <p>MARIJASA memiliki ribuan pengguna aktif yang mencari jasa profesional setiap harinya. Dengan bergabung, Anda mendapat akses langsung ke pasar yang sudah terbangun tanpa perlu marketing sendiri.</p>

      <h2>2. Sistem Pembayaran Terjamin</h2>
      <p>Tidak perlu khawatir soal pembayaran. Sistem escrow kami memastikan Anda mendapat bayaran setelah pekerjaan selesai. Tidak ada lagi risiko tidak dibayar oleh klien.</p>

      <h2>Kesimpulan</h2>
      <p>Dengan mengikuti tips di atas, Anda dapat memaksimalkan potensi sebagai mitra MARIJASA.</p>
    `
  },
  {
    id: 4,
    title: "Tren Jasa Profesional 2025",
    excerpt: "Analisis tren industri jasa profesional yang sedang berkembang di tahun 2025",
    category: "Insight",
    date: "8 Januari 2025",
    readTime: "7 min",
    image: "📊",
    gradient: "from-orange-400 to-red-300",
    tags: ["Trends", "Industry", "Future"],
    featured: false,
    content: `
      <p>Industri jasa profesional terus berkembang pesat di tahun 2025. Mari kita lihat tren-tren yang sedang membentuk masa depan dunia kerja:</p>

      <h2>1. Remote Services Semakin Dominan</h2>
      <p>Pandemi telah mengubah cara kerja secara permanen. Di 2025, 70% jasa profesional dapat dilakukan secara remote.</p>
    `
  },
  {
    id: 5,
    title: "Panduan Verifikasi Akun Penyedia",
    excerpt: "Langkah-langkah mudah untuk menyelesaikan proses verifikasi akun penyedia jasa",
    category: "Panduan",
    date: "5 Januari 2025",
    readTime: "5 min",
    image: "✅",
    gradient: "from-teal-400 to-cyan-300",
    tags: ["Verification", "Account", "Setup"],
    featured: false,
    content: `
      <p>Verifikasi akun adalah langkah penting untuk membangun kepercayaan dengan calon klien. Berikut panduan lengkap:</p>

      <h2>Mengapa Verifikasi Penting?</h2>
      <p>Akun terverifikasi mendapat 5x lebih banyak order dibanding yang belum terverifikasi.</p>
    `
  },
  {
    id: 6,
    title: "Memaksimalkan Profile Penyedia Jasa",
    excerpt: "Tips dan trik untuk membuat profile yang menarik dan meningkatkan orderan",
    category: "Tips",
    date: "3 Januari 2025",
    readTime: "6 min",
    image: "⭐",
    gradient: "from-yellow-400 to-orange-300",
    tags: ["Profile", "Optimization", "Marketing"],
    featured: false,
    content: `
      <p>Profile adalah etalase digital Anda. Profile yang menarik dan profesional bisa meningkatkan order hingga 10x lipat.</p>

      <h2>1. Foto Profil yang Profesional</h2>
      <p>Foto profil adalah hal pertama yang dilihat klien. Gunakan foto close-up dengan latar belakang bersih.</p>
    `
  }
];

const categories = ["Semua", "Tips", "Panduan", "Mitra", "Insight"];

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedPost, setSelectedPost] = useState<number | null>(null);

  // Scroll to top when post changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedPost]);

  // Filter posts
  const filteredPosts = selectedCategory === "Semua" 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  const currentPost = selectedPost !== null 
    ? blogPosts.find(post => post.id === selectedPost)
    : null;

  const featuredPosts = blogPosts.filter(post => post.featured);

  // Handler untuk kembali - FIX BUG
  const handleBack = () => {
    setSelectedPost(null);
  };

  // Detail Post View
  if (currentPost) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="detail"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
        >
          {/* Enhanced Header */}
          <div className={`relative bg-gradient-to-br ${currentPost.gradient} py-16 overflow-hidden`}>
            {/* Decorative Elements */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            </div>

            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={handleBack}
                className="flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-8 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-white/20"
              >
                <ArrowLeft size={20} />
                <span className="font-medium">Kembali ke Blog</span>
              </motion.button>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-full border border-white/30">
                    {currentPost.category}
                  </span>
                  <span className="flex items-center gap-2 text-white/90 text-sm bg-white/10 backdrop-blur-sm px-3 py-2 rounded-full">
                    <Calendar size={16} />
                    {currentPost.date}
                  </span>
                  <span className="flex items-center gap-2 text-white/90 text-sm bg-white/10 backdrop-blur-sm px-3 py-2 rounded-full">
                    <Clock size={16} />
                    {currentPost.readTime} baca
                  </span>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                  {currentPost.title}
                </h1>

                <p className="text-xl text-white/90 mb-6">
                  {currentPost.excerpt}
                </p>

                <div className="flex flex-wrap gap-2">
                  {currentPost.tags.map((tag, idx) => (
                    <span key={idx} className="flex items-center gap-1 px-3 py-1 bg-white/10 backdrop-blur-sm text-white text-sm rounded-full border border-white/20">
                      <Tag size={14} />
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Content */}
          <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100 dark:border-gray-700"
            >
              <div 
                className="prose prose-lg dark:prose-invert max-w-none
                  prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white
                  prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-3 prose-h2:border-b prose-h2:border-gray-200 dark:prose-h2:border-gray-700
                  prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                  prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-6 prose-p:text-lg
                  prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-semibold
                  prose-ul:my-6 prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-li:my-2"
                dangerouslySetInnerHTML={{ __html: currentPost.content }}
              />
            </motion.div>

            {/* Related Posts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-16"
            >
              <div className="flex items-center gap-3 mb-8">
                <Sparkles className="text-[#7CE0A8]" size={24} />
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Artikel Terkait
                </h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {blogPosts
                  .filter(post => post.id !== currentPost.id && post.category === currentPost.category)
                  .slice(0, 2)
                  .map(post => (
                    <motion.div
                      key={post.id}
                      whileHover={{ y: -5, scale: 1.02 }}
                      onClick={() => setSelectedPost(post.id)}
                      className="cursor-pointer bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 hover:shadow-xl transition-all border border-gray-200 dark:border-gray-600 group"
                    >
                      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${post.gradient} flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform`}>
                        {post.image}
                      </div>
                      
                      <span className="inline-block px-3 py-1 bg-[#7CE0A8]/10 text-[#7CE0A8] text-xs font-semibold rounded-full mb-3">
                        {post.category}
                      </span>
                      
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2 group-hover:text-[#7CE0A8] transition-colors">
                        {post.title}
                      </h4>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                        {post.excerpt}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Clock size={14} />
                        {post.readTime}
                      </div>
                    </motion.div>
                  ))}
              </div>
            </motion.div>
          </article>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Blog List View - Enhanced
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="list"
        initial="hidden"
        animate="visible"
        exit={{ opacity: 0 }}
        variants={containerVariants}
        className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
      >
        {/* Enhanced Hero Section */}
        <motion.section
          variants={itemVariants}
          className="relative bg-gradient-to-br from-[#7CE0A8] via-[#5BC88E] to-[#3DAF75] py-24 overflow-hidden"
        >
          {/* Decorative Elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          <div className="relative max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.8 }}
                className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full mb-6 border border-white/30"
              >
                <TrendingUp size={20} />
                <span className="font-semibold">Blog & Insight Terbaru</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight"
              >
                Wawasan untuk
                <br />
                <span className="text-white/90">Profesional</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed"
              >
                Artikel, tips, dan panduan seputar jasa profesional untuk membantu Anda berkembang
              </motion.p>
            </div>
          </div>
        </motion.section>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <motion.section
            variants={itemVariants}
            className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 -mt-12"
          >
            <div className="grid md:grid-cols-2 gap-6">
              {featuredPosts.map((post, idx) => (
                <motion.div
                  key={post.id}
                  variants={cardVariants}
                  whileHover={{ y: -8, scale: 1.02 }}
                  onClick={() => setSelectedPost(post.id)}
                  className="cursor-pointer bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 group"
                >
                  <div className={`relative h-56 bg-gradient-to-br ${post.gradient} flex items-center justify-center overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                    <div className="relative text-7xl group-hover:scale-110 transition-transform">{post.image}</div>
                    <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm text-xs font-bold text-gray-900 rounded-full flex items-center gap-1">
                      <Sparkles size={14} className="text-yellow-500" />
                      Featured
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-[#7CE0A8]/10 text-[#7CE0A8] text-xs font-bold rounded-full">
                        {post.category}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock size={14} />
                        {post.readTime}
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-[#7CE0A8] transition-colors">
                      {post.title}
                    </h3>

                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Calendar size={14} />
                        {post.date}
                      </span>
                      <span className="text-[#7CE0A8] font-semibold text-sm group-hover:gap-2 flex items-center gap-1 transition-all">
                        Baca <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Categories Filter */}
        <motion.section
          variants={itemVariants}
          className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg z-10 border-b border-gray-200 dark:border-gray-700 shadow-sm mt-12"
        >
          <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-3 py-4 overflow-x-auto scrollbar-hide">
              {categories.map((category) => (
                <motion.button
                  key={category}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-2.5 rounded-full whitespace-nowrap font-semibold transition-all ${
                    category === selectedCategory
                      ? "bg-gradient-to-r from-[#7CE0A8] to-[#5BC88E] text-white shadow-lg shadow-[#7CE0A8]/30"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {category}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Blog Grid */}
        <motion.section variants={itemVariants} className="py-16">
          <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post, index) => (
                <motion.article
                  key={post.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.08 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden border border-gray-100 dark:border-gray-700 group cursor-pointer"
                  onClick={() => setSelectedPost(post.id)}
                >
                  {/* Image with Gradient */}
                  <div className={`relative bg-gradient-to-br ${post.gradient} aspect-video flex items-center justify-center overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors"></div>
                    <div className="relative text-6xl group-hover:scale-110 transition-transform duration-300">{post.image}</div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1.5 bg-[#7CE0A8]/10 text-[#7CE0A8] text-xs font-bold rounded-full">
                        {post.category}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock size={14} />
                        {post.readTime}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-[#7CE0A8] transition-colors">
                      {post.title}
                    </h3>

                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Calendar size={14} />
                        {post.date}
                      </span>
                      <span className="text-[#7CE0A8] hover:text-[#5BC88E] text-sm font-semibold group-hover:gap-2 flex items-center gap-1 transition-all">
                        Baca <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>

            {/* Load More Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center mt-16"
            >
              <button className="px-10 py-4 bg-gradient-to-r from-[#7CE0A8] to-[#5BC88E] hover:from-[#5BC88E] hover:to-[#7CE0A8] text-white font-bold rounded-full transition-all shadow-lg shadow-[#7CE0A8]/30 hover:shadow-xl hover:shadow-[#7CE0A8]/40 hover:scale-105">
                Muat Lebih Banyak Artikel
              </button>
            </motion.div>
          </div>
        </motion.section>

        {/* Newsletter Section */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="py-20 bg-gradient-to-br from-[#7CE0A8] to-[#5BC88E] relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              Dapatkan Update Terbaru
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Subscribe newsletter kami untuk mendapatkan artikel dan tips terbaru langsung ke email Anda
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Email Anda"
                className="flex-1 px-6 py-4 rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:border-white transition-colors"
              />
              <button className="px-8 py-4 bg-white text-[#7CE0A8] font-bold rounded-full hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:scale-105">
                Subscribe
              </button>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}