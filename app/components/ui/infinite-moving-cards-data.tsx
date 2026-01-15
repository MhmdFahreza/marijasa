"use client";

import React from "react";
import { InfiniteMovingCards } from "@/app/components/ui/infinite-moving-cards";
import { SparklesCore } from "@/app/components/ui/sparkles";

export function InfiniteMovingCardsData() {
  return (
    <section className="relative isolate w-full pt-6 md:pt-8 pb-10">
      <h2 className="mx-auto max-w-7xl px-4 text-center text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold text-[#7CE0A8] dark:text-neutral-200 font-sans tracking-tight leading-tight mt-2 md:mt-4 mb-4 md:mb-6">
        Testimoni Customer
      </h2>

      <div
        className="relative mt-0 flex flex-col justify-start items-center
        overflow-hidden rounded-md antialiased
        bg-white dark:bg-black dark:bg-grid-white/[0.05]
        h-[16rem] sm:h-[17rem] md:h-[19rem] lg:h-[21rem] pt-1 md:pt-2"
      >
        {/* Sparkles Background Effect */}
        <SparklesCore
          className="pointer-events-none absolute inset-0 z-0"
          background="transparent"
          minSize={0.8}
          maxSize={2.5}
          particleDensity={100}
          particleColor="#7CE0A8"
        />

        {/* Infinite Moving Cards */}
        <div className="relative z-10 w-full">
          <InfiniteMovingCards 
            items={testimonials} 
            direction="right" 
            speed="slow" 
            pauseOnHover={true}
          />
        </div>
      </div>
    </section>
  );
}

const testimonials = [
  {
    quote: "Website MARIJASA benar-benar membantu saya menemukan asisten rumah tangga yang profesional dengan cepat dan mudah. Prosesnya aman dan transparan!",
    name: "Dewi Anggraini",
    title: "Ibu Rumah Tangga",
  },
  {
    quote: "Saya sangat puas dengan layanan MARIJASA. Tampilan websitenya simpel, tapi fiturnya lengkap. Sekarang, saya bisa pesan jasa bersih-bersih hanya dalam beberapa klik.",
    name: "Andi Pratama",
    title: "Karyawan Kantoran",
  },
  {
    quote: "Pelayanan MARIJASA luar biasa! Mitra jasanya ramah dan hasil kerjanya memuaskan. Cocok sekali untuk keluarga sibuk seperti saya.",
    name: "Rina Kurnia",
    title: "Pegawai Negeri",
  },
  {
    quote: "Dari semua platform penyedia jasa rumah tangga yang pernah saya coba, MARIJASA paling praktis. Respons cepat, harga jelas, dan pekerja sangat terpercaya.",
    name: "Budi Santoso",
    title: "Wirausaha",
  },
  {
    quote: "Saya sangat terbantu dengan adanya MARIJASA. Website-nya mudah digunakan dan customer service-nya responsif sekali. Terima kasih, MARIJASA!",
    name: "Siti Nurhaliza",
    title: "Pengguna Setia MARIJASA",
  },
  {
    quote: "MARIJASA membuat hidup saya jauh lebih mudah. Tidak perlu repot-repot mencari tukang lagi, semua ada di satu platform. Sangat recommended!",
    name: "Ahmad Fauzi",
    title: "Pengusaha",
  },
  {
    quote: "Platform yang sangat membantu! Saya bisa menemukan tukang AC berkualitas dengan mudah. Pelayanannya cepat dan hasilnya memuaskan.",
    name: "Linda Wijaya",
    title: "Profesional",
  },
];