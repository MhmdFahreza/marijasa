"use client";

import { motion, Variants } from "framer-motion";

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

export default function AboutPage() {
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
              Tentang MARIJASA
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Platform marketplace jasa terpercaya yang menghubungkan pencari jasa dengan penyedia jasa profesional di seluruh Indonesia
            </p>
          </div>
        </div>
      </motion.section>

      {/* Content Section */}
      <motion.section variants={itemVariants} className="py-16">
        <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Image/Illustration */}
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl aspect-square flex items-center justify-center">
              <div className="text-center p-8">
                <div className="text-6xl mb-4">🤝</div>
                <p className="text-gray-600 dark:text-gray-300">MARIJASA Platform</p>
              </div>
            </div>

            {/* Text Content */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Siapa Kami?
              </h2>
              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p>
                  MARIJASA adalah platform marketplace jasa yang didirikan dengan misi untuk memudahkan masyarakat Indonesia dalam menemukan dan memesan berbagai jenis jasa profesional.
                </p>
                <p>
                  Kami percaya bahwa setiap orang berhak mendapatkan akses ke layanan jasa berkualitas dengan harga yang transparan dan proses yang mudah. Melalui teknologi dan inovasi, kami menghubungkan ribuan penyedia jasa dengan jutaan pencari jasa di seluruh Indonesia.
                </p>
                <p>
                  Dengan sistem verifikasi ketat dan review transparan, kami memastikan setiap transaksi berlangsung aman dan memuaskan bagi kedua belah pihak.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Values Section */}
      <motion.section variants={itemVariants} className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Nilai-Nilai Kami
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Prinsip yang memandu setiap langkah kami dalam melayani Anda
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-700 p-8 rounded-xl shadow-sm">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Profesionalisme
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Kami memastikan setiap penyedia jasa terverifikasi dan profesional dalam bidangnya
              </p>
            </div>

            <div className="bg-white dark:bg-gray-700 p-8 rounded-xl shadow-sm">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Kepercayaan
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Sistem pembayaran aman dan perlindungan untuk setiap transaksi Anda
              </p>
            </div>

            <div className="bg-white dark:bg-gray-700 p-8 rounded-xl shadow-sm">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Kemudahan
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Platform yang user-friendly dengan proses pemesanan yang cepat dan mudah
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section variants={itemVariants} className="py-16">
        <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-[#7CE0A8] mb-2">10K+</div>
              <p className="text-gray-600 dark:text-gray-300">Penyedia Jasa</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#7CE0A8] mb-2">50K+</div>
              <p className="text-gray-600 dark:text-gray-300">Pengguna Aktif</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#7CE0A8] mb-2">100K+</div>
              <p className="text-gray-600 dark:text-gray-300">Transaksi Selesai</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#7CE0A8] mb-2">4.8/5</div>
              <p className="text-gray-600 dark:text-gray-300">Rating Kepuasan</p>
            </div>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}