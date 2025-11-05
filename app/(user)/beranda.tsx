"use client";

import React, { memo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { BackgroundLines } from "@/app/components/ui/background-lines";
import { useMagneticButton } from "@/app/components/lib/hooks/useMagneticButton";
import { Carousel, Card } from "@/app/components/ui/apple-cards-carousel";
import { InfiniteMovingCardsData } from "@/app/components/ui/infinite-moving-cards-data";
import { cardData, type ContentSection } from "@/app/data/dataContent";
import { dataReason } from "@/app/data/dataReason";
import { HoverEffect } from "@/app/components/ui/card-hover-effect";
import SiteFooter from "@/app/footer";
import { useRouter } from "next/navigation";
import { LoaderTwo } from "@/app/components/transition/loader";

type ContentCategoryProps = {
  sections?: ContentSection[];
};

const ContentCategory = memo(function ContentCategory({ sections = [] }: ContentCategoryProps) {
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
      (item.text || item.imageUrl)
        ? [{ text: item.text, imageUrl: item.imageUrl }].filter(s => s.text || s.imageUrl)
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
      <h2 className="max-w-7xl pl-4 mx-auto text-xl md:text-5xl font-bold text-neutral-800 dark:text-neutral-200 font-sans">
        Jasa yang tersedia.
      </h2>
      <Carousel items={cards} />
    </div>
  );
}

export default function Beranda() {
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  const [leaving, setLeaving] = useState(false);

  const { btnRef, x, y, scale, handleMouseMove, handleMouseLeave } =
    useMagneticButton({
      activationRadius: 180,
      strengthFactor: 0.15,
      scaleFactor: 0.12,
    });

  const handleTemukanJasa = async () => {
    setLeaving(true);
    // beri sedikit waktu untuk fade-out sebelum push
    await new Promise((r) => setTimeout(r, prefersReduced ? 0 : 220));
    router.push("/jasa");
  };

  return (
    <>
      <BackgroundLines
        className="flex items-center justify-center w-full flex-col px-4 relative"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="bg-clip-text text-transparent text-center bg-gradient-to-b
              from-neutral-900 to-neutral-700 dark:from-neutral-600 dark:to-white
              text-xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl
              leading-tight md:leading-tight font-sans py-3 md:py-8 relative z-20 font-bold tracking-tight"
          >
            Temukan Penyedia Jasa Terpercaya, untuk Kebutuhan Rumah Tangga Anda.
          </motion.h2>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.08 }}
          className="max-w-xl mx-auto text-sm md:text-lg text-neutral-700 dark:text-neutral-400 text-center relative z-20"
        >
          Dapatkan solusi jasa rumah tangga yang aman, terjangkau, dan terpercaya. Temukan
          penyedia jasa terbaik untuk Anda dengan mengeklik tombol di bawah.
        </motion.p>

        <motion.button
          ref={btnRef}
          style={{ x, y, scale }}
          onClick={handleTemukanJasa}
          aria-label="Temukan Jasa"
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 350, damping: 22 }}
          className="mt-6 md:mt-8 shadow-[inset_0_0_0_2px_#0B0B0B]
            text-black dark:text-neutral-200 px-5 py-2.5 md:px-7 md:py-3
            text-sm md:text-base rounded-full tracking-wide md:tracking-widest
            bg-transparent hover:bg-black hover:text-white dark:hover:bg-black
            dark:hover:text-white transition duration-200
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/60
            relative z-20"
        >
          Temukan Jasa
        </motion.button>
      </BackgroundLines>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.35 }}
        className="w-full"
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
        <h2 className="max-w-7xl px-4 mx-auto text-center text-lg md:text-3xl font-semibold md:font-bold text-neutral-800 dark:text-neutral-200 font-sans">
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

      <AnimatePresence>
        {leaving && (
          <motion.div
            key="route-leave"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.5 }}
            className="fixed inset-0 bg-white z-[9999]"
          >
            <LoaderTwo />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
