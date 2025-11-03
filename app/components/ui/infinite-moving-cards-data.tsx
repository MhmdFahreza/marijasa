"use client";

import React from "react";
import { InfiniteMovingCards } from "@/app/components/ui/infinite-moving-cards";
import { SparklesCore } from "@/app/components/ui/sparkles"; 

export function InfiniteMovingCardsData() {
  return (
    <section className="relative isolate w-full pt-6 md:pt-8 pb-10">
      <h2 className="mx-auto max-w-7xl text-center text-2xl md:text-5xl font-bold text-neutral-800 dark:text-neutral-200 font-sans tracking-tight leading-tight mt-2 md:mt-4 mb-3 md:mb-5">
        Testimoni Customer
      </h2>

      <div
        className="relative mt-0 flex flex-col justify-start items-center
        overflow-hidden rounded-md antialiased
        bg-white dark:bg-black dark:bg-grid-white/[0.05]
        h-[15rem] sm:h-[16rem] md:h-[18rem] lg:h-[20rem] pt-1 md:pt-2"
      >
        <SparklesCore
          className="pointer-events-none absolute inset-0 z-0"
          background="transparent"
          minSize={1}
          maxSize={3}
          particleDensity={110}
          particleColor="#60a5fa" 
        />

        <div className="relative z-10 w-full">
          <InfiniteMovingCards items={testimonials} direction="right" speed="slow" />
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
];

