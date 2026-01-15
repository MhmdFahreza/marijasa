"use client";

import { motion } from "framer-motion";
import { ShoppingCart, CreditCard, Clock, CheckCircle, AlertCircle, HelpCircle, Smartphone, Building2, Wallet } from "lucide-react";
import PageTransition from "@/app/components/transition/PageTransition";
import { useState } from "react";

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

export default function CaraPembayaranPage() {
  const [activeMethod, setActiveMethod] = useState("ewallet");

  const paymentSteps = {
    ewallet: [
      {
        number: 1,
        title: "Pilih Layanan Jasa",
        description: "Pilih jasa yang Anda inginkan dan klik 'Pesan Sekarang'",
        icon: ShoppingCart
      },
      {
        number: 2,
        title: "Pilih E-Wallet",
        description: "Pada halaman pembayaran, pilih metode E-Wallet (GoPay, OVO, DANA, dll)",
        icon: Smartphone
      },
      {
        number: 3,
        title: "Scan QR Code",
        description: "Buka aplikasi e-wallet Anda dan scan QR code yang ditampilkan",
        icon: CreditCard
      },
      {
        number: 4,
        title: "Konfirmasi Pembayaran",
        description: "Konfirmasi pembayaran di aplikasi e-wallet Anda",
        icon: CheckCircle
      },
      {
        number: 5,
        title: "Selesai",
        description: "Pembayaran berhasil! Notifikasi akan dikirim ke email Anda",
        icon: CheckCircle
      }
    ],
    va: [
      {
        number: 1,
        title: "Pilih Layanan Jasa",
        description: "Pilih jasa yang Anda inginkan dan klik 'Pesan Sekarang'",
        icon: ShoppingCart
      },
      {
        number: 2,
        title: "Pilih Bank",
        description: "Pilih bank yang Anda gunakan (BCA, Mandiri, BNI, BRI, dll)",
        icon: Building2
      },
      {
        number: 3,
        title: "Salin Nomor VA",
        description: "Salin nomor Virtual Account yang diberikan",
        icon: CreditCard
      },
      {
        number: 4,
        title: "Transfer",
        description: "Lakukan transfer melalui ATM, mobile banking, atau internet banking",
        icon: Clock
      },
      {
        number: 5,
        title: "Selesai",
        description: "Pembayaran otomatis terverifikasi dalam 1-2 menit",
        icon: CheckCircle
      }
    ],
    card: [
      {
        number: 1,
        title: "Pilih Layanan Jasa",
        description: "Pilih jasa yang Anda inginkan dan klik 'Pesan Sekarang'",
        icon: ShoppingCart
      },
      {
        number: 2,
        title: "Pilih Kartu Kredit/Debit",
        description: "Pada halaman pembayaran, pilih metode Kartu Kredit/Debit",
        icon: CreditCard
      },
      {
        number: 3,
        title: "Isi Data Kartu",
        description: "Masukkan nomor kartu, tanggal kadaluarsa, dan CVV",
        icon: Wallet
      },
      {
        number: 4,
        title: "Verifikasi OTP",
        description: "Masukkan kode OTP yang dikirim ke nomor HP Anda",
        icon: AlertCircle
      },
      {
        number: 5,
        title: "Selesai",
        description: "Pembayaran berhasil diproses!",
        icon: CheckCircle
      }
    ]
  };

  const methods = [
    { id: "ewallet", name: "E-Wallet", icon: Smartphone, color: "from-blue-500 to-cyan-500" },
    { id: "va", name: "Virtual Account", icon: Building2, color: "from-emerald-500 to-teal-500" },
    { id: "card", name: "Kartu Kredit/Debit", icon: CreditCard, color: "from-purple-500 to-pink-500" }
  ];

  const tips = [
    {
      icon: Clock,
      title: "Batas Waktu Pembayaran",
      description: "Selesaikan pembayaran dalam 24 jam untuk menghindari pembatalan otomatis"
    },
    {
      icon: AlertCircle,
      title: "Pastikan Saldo Cukup",
      description: "Periksa saldo Anda sebelum melakukan pembayaran untuk menghindari kegagalan transaksi"
    },
    {
      icon: CheckCircle,
      title: "Simpan Bukti Pembayaran",
      description: "Simpan screenshot atau bukti pembayaran untuk keperluan konfirmasi"
    },
    {
      icon: HelpCircle,
      title: "Hubungi Support",
      description: "Jika ada kendala, hubungi tim support kami yang siap membantu 24/7"
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-16 px-4 sm:px-6 lg:px-8">
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
              Cara Pembayaran
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Panduan lengkap melakukan pembayaran di MARIJASA
            </p>
          </motion.div>

          {/* Method Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <div className="flex flex-wrap justify-center gap-4">
              {methods.map((method) => (
                <motion.button
                  key={method.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveMethod(method.id)}
                  className={`relative group overflow-hidden rounded-2xl transition-all duration-300 ${
                    activeMethod === method.id
                      ? "ring-4 ring-[#7CE0A8] shadow-2xl"
                      : "shadow-lg hover:shadow-xl"
                  }`}
                >
                  <div className={`bg-gradient-to-br ${method.color} p-6 min-w-[200px]`}>
                    <method.icon className="w-8 h-8 text-white mb-2 mx-auto" />
                    <h3 className="text-white font-semibold text-lg text-center">
                      {method.name}
                    </h3>
                  </div>
                  {activeMethod === method.id && (
                    <motion.div
                      layoutId="activeMethodIndicator"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-white"
                      initial={false}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Steps */}
          <motion.div
            key={activeMethod}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              Langkah-Langkah Pembayaran
            </h2>
            <div className="space-y-6">
              {paymentSteps[activeMethod as keyof typeof paymentSteps].map((step, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, x: 10 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#7CE0A8]/20 to-emerald-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 flex items-start gap-6">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-[#7CE0A8] to-emerald-500 flex items-center justify-center shadow-lg"
                    >
                      <span className="text-2xl font-bold text-white">{step.number}</span>
                    </motion.div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <step.icon className="w-6 h-6 text-[#7CE0A8]" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Tips Section */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              Tips Pembayaran
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {tips.map((tip, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-start gap-4">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#7CE0A8] to-emerald-500 flex items-center justify-center shadow-lg"
                    >
                      <tip.icon className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {tip.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {tip.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="bg-gradient-to-br from-[#7CE0A8] to-emerald-500 rounded-3xl p-8 md:p-12 shadow-2xl">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Masih Ada Pertanyaan?
              </h3>
              <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                Tim support kami siap membantu Anda dengan segala pertanyaan seputar pembayaran
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-[#7CE0A8] px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow"
                >
                  Hubungi Support
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white/20 backdrop-blur-sm text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow border-2 border-white/50"
                >
                  Lihat FAQ
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}