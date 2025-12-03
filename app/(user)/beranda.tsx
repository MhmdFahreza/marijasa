"use client";

import React, { memo, ReactNode, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Carousel, Card } from "@/app/components/ui/apple-cards-carousel";
import { InfiniteMovingCardsData } from "@/app/components/ui/infinite-moving-cards-data";
import { cardData, type ContentSection } from "@/app/data/dataContent";
import { dataReason } from "@/app/data/dataReason";
import { HoverEffect } from "@/app/components/ui/card-hover-effect";
import SiteFooter from "@/app/footer";
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

export function CardHoverEffect() {
  return (
    <div className="max-w-5xl mx-auto px-8">
      <HoverEffect items={dataReason} />
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
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.5 }}
      >
        <InfiniteMovingCardsData />
      </motion.div>

      <div className="w-full py-16">
        <h2 className="max-w-7xl px-4 mx-auto text-center text-lg md:text-3xl font-semibold md:font-bold text-[#7CE0A8] dark:text-[#7CE0A8] font-sans">
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

      <SiteFooter />

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