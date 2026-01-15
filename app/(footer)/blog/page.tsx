"use client";

import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

// Animasi container yang lebih cepat
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

// Animasi item yang lebih ringan dan cepat
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

// Animasi card yang lebih cepat
const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.25,
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
    image: "📝"
  },
  {
    id: 2,
    title: "Cara Kerja Sistem Pembayaran MARIJASA",
    excerpt: "Pelajari bagaimana sistem pembayaran aman kami melindungi setiap transaksi Anda",
    category: "Panduan",
    date: "12 Januari 2025",
    readTime: "4 min",
    image: "💳"
  },
  {
    id: 3,
    title: "Keuntungan Menjadi Mitra Penyedia Jasa",
    excerpt: "Temukan berbagai benefit yang akan Anda dapatkan sebagai mitra penyedia jasa MARIJASA",
    category: "Mitra",
    date: "10 Januari 2025",
    readTime: "6 min",
    image: "🤝"
  },
  {
    id: 4,
    title: "Tren Jasa Profesional 2025",
    excerpt: "Analisis tren industri jasa profesional yang sedang berkembang di tahun 2025",
    category: "Insight",
    date: "8 Januari 2025",
    readTime: "7 min",
    image: "📊"
  },
  {
    id: 5,
    title: "Panduan Verifikasi Akun Penyedia",
    excerpt: "Langkah-langkah mudah untuk menyelesaikan proses verifikasi akun penyedia jasa",
    category: "Panduan",
    date: "5 Januari 2025",
    readTime: "5 min",
    image: "✅"
  },
  {
    id: 6,
    title: "Memaksimalkan Profile Penyedia Jasa",
    excerpt: "Tips dan trik untuk membuat profile yang menarik dan meningkatkan orderan",
    category: "Tips",
    date: "3 Januari 2025",
    readTime: "6 min",
    image: "⭐"
  }
];

const categories = ["Semua", "Tips", "Panduan", "Mitra", "Insight"];

export default function BlogPage() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Terima kasih! Email ${email} telah terdaftar untuk newsletter.`);
    setEmail("");
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
      variants={containerVariants}
      className="min-h-screen bg-white dark:bg-gray-900"
    >
      {/* Hero Section */}
      <motion.section
        variants={itemVariants}
        className="relative bg-gradient-to-br from-[#7CE0A8] to-[#5BC88E] py-20"
      >
        <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Blog MARIJASA
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Artikel, tips, dan panduan seputar jasa profesional untuk membantu Anda
            </p>
          </div>
        </div>
      </motion.section>

      {/* Categories Filter */}
      <motion.section
        variants={itemVariants}
        className="border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10"
      >
        <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4 py-4 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  category === "Semua"
                    ? "bg-[#7CE0A8] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Blog Grid */}
      <motion.section variants={itemVariants} className="py-16">
        <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <motion.article
                key={post.id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5, transition: { duration: 0.15 } }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                {/* Image Placeholder */}
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 aspect-video flex items-center justify-center">
                  <div className="text-6xl">{post.image}</div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-[#7CE0A8]/10 text-[#7CE0A8] text-xs font-medium rounded-full">
                      {post.category}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {post.readTime} baca
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {post.date}
                    </span>
                    <Link
                      href={`/blog/${post.id}`}
                      className="text-[#7CE0A8] hover:text-[#5BC88E] text-sm font-medium"
                    >
                      Baca selengkapnya →
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          {/* Load More Button */}
          <div className="text-center mt-12">
            <button className="px-8 py-3 bg-[#7CE0A8] hover:bg-[#5BC88E] text-white font-medium rounded-lg transition-colors">
              Muat Lebih Banyak
            </button>
          </div>
        </div>
      </motion.section>

      {/* Newsletter Section */}
      <motion.section variants={itemVariants} className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Berlangganan Newsletter
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Dapatkan artikel terbaru dan tips menarik langsung ke email Anda
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Anda"
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7CE0A8]"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-[#7CE0A8] hover:bg-[#5BC88E] text-white font-medium rounded-lg transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}