"use client";

import React, { memo, ReactNode, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Carousel, Card } from "@/app/components/ui/apple-cards-carousel";
import { InfiniteMovingCardsData } from "@/app/components/ui/infinite-moving-cards-data";
import { cardData, type ContentSection } from "@/app/data/dataContent";
import { dataReason } from "@/app/data/dataReason";
import { HoverEffect } from "@/app/components/ui/card-hover-effect";
import SiteFooter from "@/app/(footer)/footer";
import { useRouter } from "next/navigation";
import {
  LayoutGrid,
  PlugZap,
  AirVent,
  Brush,
  ShowerHead,
  Toilet,
  Trees,
  Armchair,
} from "lucide-react";
import { ContainerTextFlip } from "@/app/components/ui/container-text-flip";
import { LoaderTwo } from "@/app/components/transition/loader";
import { AnimatePresence } from "motion/react";
import Chatbot from "@/app/(user)/chatbot/Chatbot";

type ContentCategoryProps = {
  sections?: ContentSection[];
};

const ContentCategory = memo(function ContentCategory({
  sections = [],
}: ContentCategoryProps) {
  if (!sections.length) return null;

  return (
    <>
      {sections.map((sec, idx) => (
        <div
          key={`content-${idx}`}
          className="bg-[#F5F5F7] dark:bg-neutral-800 p-8 md:p-14 rounded-3xl mb-4"
        >
          {sec.text && (
            <p className="text-neutral-600 dark:text-neutral-400 text-base md:text-2xl font-sans max-w-3xl mx-auto">
              <span className="font-bold text-neutral-700 dark:text-neutral-200">
                {sec.text}
              </span>
            </p>
          )}
        </div>
      ))}
    </>
  );
});

// Komponen CardHoverEffect yang sudah diresponsifkan
export function CardHoverEffect() {
  return (
    <div className="w-full px-3 sm:px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {dataReason.map((item, index) => (
            <div
              key={index}
              className="group relative bg-white dark:bg-neutral-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-neutral-700 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-100/50 dark:hover:shadow-emerald-900/20 overflow-hidden"
            >
              {/* Background effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white to-emerald-50 dark:from-neutral-900 dark:to-emerald-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10">
                {/* Icon container */}
                <div className="mb-3 sm:mb-4">
                  <div className="inline-flex items-center justify-center p-2 sm:p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                    {item.icon || (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                        <span className="text-lg">✨</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 line-clamp-2">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3 sm:line-clamp-4 ">
                  {item.description}
                </p>
              </div>

              {/* Hover border effect */}
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-emerald-200 dark:group-hover:border-emerald-800 rounded-xl sm:rounded-2xl transition-all duration-300 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CardCategory() {
  const cards = cardData.map((item, index) => {
    const fallbackSections: ContentSection[] =
      item.text || item.imageUrl
        ? [{ text: item.text, imageUrl: item.imageUrl }].filter(
          (s) => s.text || s.imageUrl
        )
        : [];
    const sections = item.sections?.length ? item.sections : fallbackSections;

    return (
      <Card
        key={item.title + index}
        card={{
          category: item.category,
          title: item.title,
          src: item.src,
          content: <ContentCategory sections={sections} />,
        }}
        index={index}
      />
    );
  });

  return (
    <div className="w-full h-full py-20">
      <h2 className="max-w-7xl pl-4 mx-auto text-xl md:text-5xl font-bold text-[#7CE0A8] dark:text-[#7CE0A8] font-sans">
        Jasa yang tersedia.
      </h2>
      <Carousel items={cards} />
    </div>
  );
}

type TechnicianCategory = {
  key: string;
  label: string;
  icon: ReactNode;
};

// Mapping kategori dari beranda ke filter di page jasa
const CATEGORY_MAPPING: Record<string, string> = {
  "tukang-listrik": "listrik",
  "tukang-ac": "ac",
  "pembersihan-rumah": "pembersihanrumah",
  "tukang-ledeng": "ledeng",
  "tukang-sedot-wc": "sedotwc",
  "tukang-kebun": "kebun",
  "tukang-mebel": "furnitur",
};

const technicianCategories: TechnicianCategory[] = [
  {
    key: "tukang-listrik",
    label: "Tukang Listrik",
    icon: <PlugZap className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-yellow-500" />,
  },
  {
    key: "tukang-ac",
    label: "Tukang AC",
    icon: <AirVent className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-sky-500" />,
  },
  {
    key: "pembersihan-rumah",
    label: "Tukang Pembersihan Rumah",
    icon: <Brush className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-emerald-500" />,
  },
  {
    key: "tukang-ledeng",
    label: "Tukang Ledeng",
    icon: <ShowerHead className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-cyan-500" />,
  },
  {
    key: "tukang-sedot-wc",
    label: "Tukang Sedot WC",
    icon: <Toilet className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-indigo-500" />,
  },
  {
    key: "tukang-kebun",
    label: "Tukang Kebun",
    icon: <Trees className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-green-600" />,
  },
  {
    key: "tukang-mebel",
    label: "Tukang Mebel",
    icon: <Armchair className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-amber-600" />,
  },
  {
    key: "semua-kategori",
    label: "Semua Kategori",
    icon: <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[#0D6EFD]" />,
  },
];

export default function Beranda() {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const prefersReduced = useReducedMotion();

  const handlePilihKategori = async (kategori: string) => {
    setLeaving(true);

    // Tunggu sebentar untuk animasi loader
    await new Promise(resolve => setTimeout(resolve, prefersReduced ? 0 : 300));

    if (kategori === "semua-kategori") {
      router.push("/jasa");
    } else {
      // Gunakan mapping untuk mengubah key beranda menjadi filter yang sesuai
      const filterKey = CATEGORY_MAPPING[kategori] || kategori;
      router.push(`/jasa?kategori=${encodeURIComponent(filterKey)}`);
    }
  };

  // Fungsi baru untuk navigasi ke halaman daftar mitra
  const handleNavigateToDaftarMitra = async () => {
    setLeaving(true);

    // Tunggu sebentar untuk animasi loader
    await new Promise(resolve => setTimeout(resolve, prefersReduced ? 0 : 300));

    router.push("/mitra/daftar");
  };

  return (
    <>
      {/* HERO SECTION dengan background yang tidak full */}
      <section className="relative w-full">
        {/* Background hijau yang dibatasi tingginya */}
        <div className="absolute inset-x-0 top-0 h-[300px] md:h-[400px] bg-[#7CE0A8] overflow-hidden">
          {/* Layer dekorasi 3D */}
          <div className="pointer-events-none absolute inset-0">
            {/* Glow putih lembut kiri atas */}
            <div className="absolute -top-16 -left-16 h-56 w-56 md:h-64 md:w-64 rounded-full bg-white/35 blur-3xl" />

            {/* Glow hijau lebih gelap kanan bawah */}
            <div className="absolute -bottom-20 right-[-3rem] h-64 w-64 md:h-72 md:w-72 rounded-full bg-emerald-400/45 blur-3xl" />

            {/* Layer radial di tengah untuk efek depth */}
            <div className="absolute top-1/2 left-1/2 h-[350px] w-[120%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_rgba(124,224,168,0.0))]" />

            {/* Sedikit garis halus untuk kesan panel 3D */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-emerald-500/25 via-transparent to-transparent" />
          </div>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 pt-10 pb-36 sm:pt-12 sm:pb-40 md:pt-16 md:pb-44 flex flex-col items-center">
          {/* HERO TEXT ala Fastwork */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="text-center text-white font-sans py-3 sm:py-4 md:py-6"
          >
            <p className="text-xs sm:text-sm md:text-xl font-medium mb-1 sm:mb-1.5 md:mb-2 
      whitespace-nowrap overflow-hidden text-ellipsis max-w-[90%] mx-auto sm:max-w-full sm:truncate">
              Kami memiliki teknisi penyedia jasa rumah tangga.
            </p>

            <div className="mt-1 sm:mt-2 md:mt-3">
              <ContainerTextFlip
                words={[
                  "Tukang Listrik",
                  "Tukang AC",
                  "Tukang Pembersihan Rumah",
                  "Tukang Ledeng",
                  "Tukang Sedot WC",
                  "Tukang Kebun",
                  "Tukang Mebel",
                ]}
                interval={2500}
                animationDuration={700}
                withBackground={false}
                className="text-white text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight [background:none] dark:[background:none] shadow-none"
                textClassName="px-1"
              />
            </div>

            <p className="mt-3 sm:mt-4 md:mt-4 text-xs sm:text-base md:text-base text-white/90 max-w-[90%] mx-auto sm:max-w-full">
              Temukan Penyedia Jasa Terpercaya, untuk Kebutuhan Rumah Tangga Anda.
            </p>
          </motion.div>

          {/* CARD PUTIH PEMBUNGKUS MENU KATEGORI - Positioned absolutely */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut", delay: 0.08 }}
            className="absolute -bottom-20 sm:-bottom-36 md:-bottom-28 left-4 right-4 sm:left-8 sm:right-8 md:left-4 md:right-4 max-w-4xl mx-auto"
          >
            <div className="bg-white rounded-2xl sm:rounded-xl md:rounded-3xl border border-neutral-200 shadow-xl shadow-emerald-900/10 px-3 py-3 sm:px-3 sm:py-3 md:px-6 md:py-6">
              <div className="grid grid-cols-4 md:grid-cols-4 gap-2 sm:gap-2 md:gap-4">
                {technicianCategories.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => handlePilihKategori(cat.key)}
                    className="group flex flex-col items-center justify-center rounded-xl sm:rounded-lg md:rounded-2xl border border-neutral-200/80 dark:border-neutral-700/70 bg-white/90 hover:bg-blue-50/90 dark:bg-neutral-900/70 backdrop-blur-sm px-2 py-2.5 sm:px-2 sm:py-2 md:px-4 md:py-4 shadow-sm hover:shadow-md transition hover:border-blue-500/70 dark:hover:bg-blue-900/30"
                  >
                    <span className="mb-1 sm:mb-1 md:mb-2 flex items-center justify-center">
                      {cat.icon}
                    </span>
                    <span className="text-[9px] sm:text-[10px] md:text-sm font-medium text-neutral-800 text-center dark:text-neutral-100 leading-tight md:leading-normal">
                      {cat.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION LAIN TETAP SAMA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.35 }}
        className="w-full mt-28 sm:mt-44 md:mt-36"
      >
        <CardCategory />
      </motion.div>

      <motion.div
        id="section-testimoni"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.5 }}
      >
        <InfiniteMovingCardsData />
      </motion.div>
      {/* Section "Alasan Mengapa MARIJASA Jadi Pilihan Tepat" dengan padding yang lebih kecil untuk mobile */}
      <div className="w-full py-8 sm:py-12 md:py-16">
        <h2 className="max-w-7xl px-4 mx-auto text-center text-base sm:text-lg md:text-3xl font-semibold md:font-bold text-[#7CE0A8] dark:text-[#7CE0A8] font-sans mb-4 sm:mb-6 md:mb-8">
          Alasan Mengapa MARIJASA Jadi Pilihan Tepat
        </h2>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35 }}
        >
          <CardHoverEffect />
        </motion.div>
      </div>

      <motion.div
        id="section-daftar-mitra"  
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.5 }}
        className="w-full py-12 md:py-20"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Container utama - lebih soft tanpa border kaku */}
          <div className="relative bg-gradient-to-br from-white/90 via-emerald-50/40 to-white/90 dark:from-neutral-900/90 dark:via-neutral-800/40 dark:to-neutral-900/90 rounded-3xl md:rounded-[32px] shadow-soft">

            {/* Background dengan gradient yang lebih organik */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl md:rounded-[32px]">
              {/* Gradient utama */}
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-50/30 via-transparent to-cyan-50/20 dark:from-emerald-900/10 dark:via-transparent dark:to-cyan-900/10" />

              {/* Blob effects */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#7CE0A8]/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#0D6EFD]/5 rounded-full blur-3xl" />

              {/* Subtle pattern overlay */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 25px 25px, #7CE0A8 1px, transparent 0)`,
                  backgroundSize: '80px 80px'
                }} />
              </div>
            </div>

            <div className="relative lg:grid lg:grid-cols-2 gap-8 md:gap-12 items-stretch p-4 sm:p-6 md:p-8 lg:p-12">
              {/* Bagian kiri: Konten */}
              <div className="space-y-6 sm:space-y-8">
                {/* Header - Ukuran font lebih kecil di mobile */}
                <div className="space-y-3 sm:space-y-4">
                  <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight sm:leading-normal">
                    Menjadi Penyedia Jasa
                  </h2>
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                    Bergabunglah sebagai mitra kami dan raih lebih banyak pelanggan untuk bisnis jasa Anda.
                  </p>
                </div>

                {/* Tiga keuntungan pendaftaran dengan ikon */}
                <div className="space-y-3 sm:space-y-4">
                  {[
                    { icon: "✓", text: "Gratis pendaftaran" },
                    { icon: "⚡", text: "Diverifikasi dalam 24 jam" },
                    { icon: "💳", text: "Tanpa biaya bulanan" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 group transform transition-all duration-300 hover:translate-x-1">
                      <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-emerald-100 to-emerald-50 dark:from-emerald-900/40 dark:to-emerald-800/40 flex items-center justify-center group-hover:from-emerald-200 group-hover:to-emerald-100 dark:group-hover:from-emerald-800/60 dark:group-hover:to-emerald-700/60 transition-all duration-300">
                        <span className="text-sm sm:text-base md:text-lg font-bold text-emerald-600 dark:text-emerald-400">{item.icon}</span>
                      </div>
                      <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300 font-medium">{item.text}</span>
                    </div>
                  ))}
                </div>

                {/* Tombol CTA - Diperbarui untuk ukuran mobile kecil */}
                <div className="space-y-4">
                  <button
                    onClick={handleNavigateToDaftarMitra}
                    className="group inline-flex items-center justify-center gap-2 sm:gap-3 px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-[#7CE0A8] to-emerald-500 hover:from-emerald-500 hover:to-[#7CE0A8] text-white font-semibold sm:font-bold text-sm sm:text-base md:text-lg rounded-lg sm:rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-[1.02] w-full sm:w-auto transform hover:-translate-y-0.5 active:scale-95"
                  >
                    <span>DAFTAR SEKARANG</span>
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Bagian kanan: Gambar ilustrasi orang - Diperbaiki layoutnya */}
              <div className="hidden lg:flex relative h-full items-center justify-center">
                {/* Container utama untuk gambar dengan background gradient */}
                <div className="relative w-full h-[500px] flex items-center justify-center">
                  {/* Background gradient utama dengan efek glass morphism */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-100/20 via-white/10 to-cyan-100/20 dark:from-emerald-900/10 dark:via-neutral-800/10 dark:to-cyan-900/10 backdrop-blur-sm" />

                  {/* Blob effects untuk gambar */}
                  <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-[#7CE0A8]/10 blur-3xl" />
                  <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-[#0D6EFD]/10 blur-3xl" />

                  {/* Container gambar dengan efek floating */}
                  <div className="relative z-10 w-full max-w-[550px] h-full flex items-center justify-center p-4">
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="relative"
                    >
                      {/* Efek glow di belakang gambar */}
                      <div className="absolute -inset-6 bg-gradient-to-r from-[#7CE0A8]/15 to-emerald-400/15 blur-2xl rounded-full" />

                      {/* Gambar utama - diperbesar */}
                      <img
                        src="/tukang.png"
                        alt="Penyedia Jasa MARIJASA"
                        className="relative z-20 w-full h-auto max-h-[480px] object-contain drop-shadow-2xl transform hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          const imgElement = e.target as HTMLImageElement;
                          imgElement.style.display = 'none';

                          const fallback = document.createElement('div');
                          fallback.className = 'w-full h-[450px] bg-gradient-to-br from-emerald-100/50 to-cyan-100/50 dark:from-emerald-900/20 dark:to-cyan-900/20 rounded-2xl flex flex-col items-center justify-center p-8 backdrop-blur-sm';
                          fallback.innerHTML = `
                      <div class="text-center">
                        <div class="text-7xl mb-4 animate-pulse">👷‍♂️</div>
                        <div class="text-emerald-600 dark:text-emerald-400 font-bold text-3xl mb-3">Penyedia Jasa</div>
                        <div class="text-emerald-500 dark:text-emerald-300 text-lg">Bergabunglah dengan tim kami</div>
                      </div>
                    `;

                          if (imgElement.parentNode) {
                            imgElement.parentNode.appendChild(fallback);
                          }
                        }}
                      />
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <SiteFooter />

      <Chatbot />

      {/* Loader untuk transisi halaman */}
      <AnimatePresence>
        {leaving && (
          <motion.div
            key="route-leave"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.5 }}
            className="fixed inset-0 z-[9999] bg-white dark:bg-neutral-950 flex items-center justify-center"
          >
            <LoaderTwo />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}