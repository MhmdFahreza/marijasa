"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MessageCircle, Book, HelpCircle, ChevronDown, ChevronRight } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    category: "Umum",
    question: "Apa itu MARIJASA?",
    answer: "MARIJASA adalah platform yang menghubungkan pencari jasa dengan penyedia jasa profesional di berbagai kategori. Kami memudahkan Anda menemukan dan memesan layanan yang Anda butuhkan."
  },
  {
    category: "Umum",
    question: "Bagaimana cara mendaftar di MARIJASA?",
    answer: "Anda dapat mendaftar dengan mengklik tombol 'Daftar' di halaman utama, lalu mengisi formulir pendaftaran dengan data yang valid. Verifikasi email akan dikirim untuk mengaktifkan akun Anda."
  },
  {
    category: "Pembayaran",
    question: "Metode pembayaran apa saja yang tersedia?",
    answer: "Kami menerima berbagai metode pembayaran termasuk transfer bank, e-wallet (GoPay, OVO, Dana), kartu kredit/debit, dan virtual account."
  },
  {
    category: "Pembayaran",
    question: "Apakah transaksi di MARIJASA aman?",
    answer: "Ya, semua transaksi dilindungi dengan enkripsi SSL dan sistem escrow. Dana Anda akan disimpan dengan aman dan hanya akan diteruskan ke penyedia jasa setelah layanan selesai."
  },
  {
    category: "Penyedia Jasa",
    question: "Bagaimana cara menjadi penyedia jasa?",
    answer: "Klik 'Daftar sebagai Penyedia' di footer atau halaman utama, lengkapi profil Anda, upload dokumen verifikasi, dan tunggu proses verifikasi dari tim kami (1-3 hari kerja)."
  },
  {
    category: "Penyedia Jasa",
    question: "Berapa biaya untuk menjadi penyedia jasa?",
    answer: "Pendaftaran sebagai penyedia jasa gratis. Kami hanya mengambil komisi 10-15% dari setiap transaksi yang berhasil diselesaikan."
  },
  {
    category: "Layanan",
    question: "Bagaimana cara memesan layanan?",
    answer: "Cari layanan yang Anda butuhkan, pilih penyedia jasa yang sesuai, tentukan detail pesanan, lakukan pembayaran, dan tunggu konfirmasi dari penyedia jasa."
  },
  {
    category: "Layanan",
    question: "Apa yang harus dilakukan jika tidak puas dengan layanan?",
    answer: "Anda dapat mengajukan komplain melalui menu 'Pesanan Saya', tim support kami akan membantu menyelesaikan masalah Anda. Jika terbukti valid, dana dapat dikembalikan."
  }
];

const categories = ["Semua", "Umum", "Pembayaran", "Penyedia Jasa", "Layanan"];

const quickLinks = [
  { icon: MessageCircle, title: "Chat Support", description: "Hubungi tim kami secara langsung" },
  { icon: Book, title: "Panduan Lengkap", description: "Pelajari cara menggunakan platform" },
  { icon: HelpCircle, title: "Forum Komunitas", description: "Diskusi dengan pengguna lain" }
];

export default function PusatBantuanPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filteredFAQ = faqData.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Semua" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleContactSupport = () => {
    router.push("/hubungi-kami");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#7CE0A8] to-emerald-400 dark:from-emerald-600 dark:to-emerald-700">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Pusat Bantuan MARIJASA
            </h1>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Temukan jawaban atas pertanyaan Anda atau hubungi tim support kami
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari pertanyaan atau topik..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-0 shadow-xl focus:ring-2 focus:ring-white/50 text-gray-900 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {quickLinks.map((link, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group border border-gray-100 dark:border-gray-700"
            >
              <link.icon className="w-12 h-12 text-[#7CE0A8] mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {link.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {link.description}
              </p>
            </div>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                selectedCategory === category
                  ? "bg-[#7CE0A8] text-white shadow-lg"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {filteredFAQ.length} pertanyaan ditemukan
            </p>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredFAQ.map((faq, index) => (
              <div key={index} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-start justify-between text-left gap-4"
                >
                  <div className="flex-1">
                    <span className="inline-block px-3 py-1 text-xs font-medium bg-[#7CE0A8]/10 text-[#7CE0A8] rounded-full mb-2">
                      {faq.category}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {faq.question}
                    </h3>
                  </div>
                  {openIndex === index ? (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                  )}
                </button>
                
                {openIndex === index && (
                  <div className="mt-4 pl-4 border-l-4 border-[#7CE0A8]">
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-12 bg-gradient-to-r from-[#7CE0A8] to-emerald-400 dark:from-emerald-600 dark:to-emerald-700 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Masih Butuh Bantuan?
          </h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Tim support kami siap membantu Anda 24/7. Hubungi kami melalui chat, email, atau telepon.
          </p>
          <button 
            onClick={handleContactSupport}
            className="bg-white text-[#7CE0A8] px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg"
          >
            Hubungi Support
          </button>
        </div>
      </div>
    </div>
  );
}