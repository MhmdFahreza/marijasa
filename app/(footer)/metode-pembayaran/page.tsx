"use client";

import { motion } from "framer-motion";
import { CreditCard, Smartphone, Building2, Wallet, Shield, Zap, Check } from "lucide-react";
import PageTransition from "@/app/components/transition/PageTransition";
import Image from "next/image";

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
      duration: 0.5
    }
  },
  hover: {
    scale: 1.02,
    y: -8,
    transition: {
      duration: 0.3,
      ease: "easeOut" as const
    }
  }
};

export default function MetodePembayaranPage() {
  const paymentMethods = [
    {
      category: "E-Wallet",
      icon: Smartphone,
      color: "from-blue-500 to-cyan-500",
      methods: [
        { name: "GoPay", logo: "https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg" },
        { name: "OVO", logo: "https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_ovo_purple.svg" },
        { name: "DANA", logo: "https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dana_blue.svg" },
        { name: "ShopeePay", logo: "https://upload.wikimedia.org/wikipedia/commons/f/fe/Shopee.svg" },
        { name: "LinkAja", logo: "https://upload.wikimedia.org/wikipedia/commons/8/85/LinkAja.svg" }
      ]
    },
    {
      category: "Virtual Account",
      icon: Building2,
      color: "from-emerald-500 to-teal-500",
      methods: [
        { name: "BCA", logo: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg" },
        { name: "Mandiri", logo: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg" },
        { name: "BNI", logo: "https://upload.wikimedia.org/wikipedia/id/5/55/BNI_logo.svg" },
        { name: "BRI", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2e/BRI_2020.svg" },
        { name: "Permata", logo: "https://upload.wikimedia.org/wikipedia/id/thumb/5/55/Permata_Bank_logo.svg/1280px-Permata_Bank_logo.svg.png" }
      ]
    },
    {
      category: "Kartu Kredit/Debit",
      icon: CreditCard,
      color: "from-purple-500 to-pink-500",
      methods: [
        { name: "Visa", logo: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" },
        { name: "Mastercard", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" },
        { name: "JCB", logo: "https://upload.wikimedia.org/wikipedia/commons/4/40/JCB_logo.svg" },
        { name: "American Express", logo: "https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg" }
      ]
    },
    {
      category: "Lainnya",
      icon: Wallet,
      color: "from-orange-500 to-red-500",
      methods: [
        { name: "Indomaret", logo: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Logo_Indomaret.png" },
        { name: "Alfamart", logo: "https://upload.wikimedia.org/wikipedia/commons/9/9e/Logo_Alfamart.png" },
        { name: "Kredivo", logo: "https://upload.wikimedia.org/wikipedia/commons/3/3b/Kredivo_wordmark.svg" },
        { name: "Akulaku", logo: "https://seeklogo.com/images/A/akulaku-logo-0194D1F14B-seeklogo.com.png" }
      ]
    }
  ];

  const features = [
    {
      icon: Shield,
      title: "Aman & Terpercaya",
      description: "Semua transaksi dilindungi dengan enkripsi tingkat bank"
    },
    {
      icon: Zap,
      title: "Proses Cepat",
      description: "Konfirmasi pembayaran otomatis dalam hitungan detik"
    },
    {
      icon: Check,
      title: "Mudah Digunakan",
      description: "Interface yang sederhana dan user-friendly"
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-16 px-4 sm:px-6 lg:px-8">
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
              <CreditCard className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              Metode Pembayaran
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Bayar dengan mudah menggunakan metode pembayaran favorit Anda
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6 mb-16"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 text-center"
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-[#7CE0A8] to-emerald-500 mb-4 shadow-lg"
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Payment Methods */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-12"
          >
            {paymentMethods.map((category, idx) => (
              <motion.div key={idx} variants={itemVariants}>
                <div className="flex items-center gap-3 mb-6">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} shadow-lg`}
                  >
                    <category.icon className="w-6 h-6 text-white" />
                  </motion.div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    {category.category}
                  </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {category.methods.map((method, index) => (
                    <motion.div
                      key={index}
                      variants={cardVariants}
                      whileHover="hover"
                      className="relative group cursor-pointer"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${category.color} rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300`} />
                      <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 h-32 flex items-center justify-center">
                        <div className="relative w-full h-16">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              {method.name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <motion.div
                        initial={{ scale: 0 }}
                        whileHover={{ scale: 1 }}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg"
                      >
                        <Check className="w-5 h-5 text-white" />
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16 text-center"
          >
            <div className="bg-gradient-to-br from-[#7CE0A8] to-emerald-500 rounded-3xl p-8 md:p-12 shadow-2xl">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Butuh Bantuan?
              </h3>
              <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                Tim support kami siap membantu Anda 24/7 untuk segala pertanyaan seputar pembayaran
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-[#7CE0A8] px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow"
              >
                Hubungi Support
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}