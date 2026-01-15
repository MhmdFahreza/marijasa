"use client";

import { motion } from "framer-motion";
import { Target, Eye, Lightbulb, Users, Award, TrendingUp } from "lucide-react";
import PageTransition from "@/app/components/transition/PageTransition";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] as const
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] as const
    }
  },
  hover: {
    scale: 1.03,
    y: -5,
    transition: {
      duration: 0.3,
      ease: "easeOut" as const
    }
  }
};

export default function VisiMisiPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#7CE0A8] to-emerald-500 mb-6 shadow-lg"
            >
              <Target className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              Visi & Misi Kami
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Membangun ekosistem jasa digital yang terpercaya dan memberdayakan masyarakat Indonesia
            </p>
          </motion.div>

          {/* Visi Section */}
          <motion.section
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="mb-20"
          >
            <motion.div variants={itemVariants} className="text-center mb-12">
              <div className="inline-flex items-center gap-3 mb-4">
                <Eye className="w-8 h-8 text-[#7CE0A8]" />
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                  Visi
                </h2>
              </div>
            </motion.div>

            <motion.div
              variants={cardVariants}
              whileHover="hover"
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#7CE0A8] to-emerald-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 dark:border-gray-700">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#7CE0A8]/10 to-transparent rounded-bl-full" />
                <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-200 leading-relaxed text-center relative z-10">
                  Menjadi platform jasa digital terdepan di Indonesia yang menghubungkan 
                  penyedia jasa profesional dengan pencari jasa, menciptakan ekosistem yang 
                  adil, transparan, dan memberdayakan ekonomi kreatif lokal.
                </p>
              </div>
            </motion.div>
          </motion.section>

          {/* Misi Section */}
          <motion.section
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="mb-20"
          >
            <motion.div variants={itemVariants} className="text-center mb-12">
              <div className="inline-flex items-center gap-3 mb-4">
                <Lightbulb className="w-8 h-8 text-[#7CE0A8]" />
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                  Misi
                </h2>
              </div>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
              {[
                {
                  icon: Users,
                  title: "Memberdayakan Penyedia Jasa",
                  description: "Memberikan akses mudah bagi para profesional untuk menjangkau lebih banyak pelanggan dan mengembangkan bisnis mereka secara digital."
                },
                {
                  icon: Award,
                  title: "Standar Kualitas Tinggi",
                  description: "Memastikan setiap transaksi dilakukan dengan standar kualitas terbaik melalui sistem verifikasi dan rating yang transparan."
                },
                {
                  icon: TrendingUp,
                  title: "Inovasi Berkelanjutan",
                  description: "Terus berinovasi dalam teknologi dan fitur untuk memberikan pengalaman terbaik bagi pengguna dan mitra kami."
                },
                {
                  icon: Target,
                  title: "Kepercayaan & Transparansi",
                  description: "Membangun kepercayaan melalui sistem pembayaran yang aman, ulasan jujur, dan proses transaksi yang transparan."
                }
              ].map((misi, index) => (
                <motion.div
                  key={index}
                  variants={cardVariants}
                  whileHover="hover"
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#7CE0A8]/20 to-emerald-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 shadow-lg border border-gray-100 dark:border-gray-700 h-full">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-[#7CE0A8] to-emerald-500 mb-4 shadow-lg"
                    >
                      <misi.icon className="w-7 h-7 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                      {misi.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {misi.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Values Section */}
          <motion.section
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div variants={itemVariants} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Nilai-Nilai Kami
              </h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Prinsip yang menjadi fondasi dalam setiap langkah kami
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Integritas", emoji: "🤝" },
                { title: "Inovasi", emoji: "💡" },
                { title: "Kolaborasi", emoji: "🌟" },
                { title: "Kepuasan Pelanggan", emoji: "❤️" }
              ].map((value, index) => (
                <motion.div
                  key={index}
                  variants={cardVariants}
                  whileHover={{ scale: 1.05, rotate: [0, -2, 2, 0] }}
                  className="bg-gradient-to-br from-[#7CE0A8] to-emerald-500 rounded-2xl p-6 text-center shadow-xl"
                >
                  <div className="text-5xl mb-3">{value.emoji}</div>
                  <h3 className="text-xl font-bold text-white">
                    {value.title}
                  </h3>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </div>
      </div>
    </PageTransition>
  );
}