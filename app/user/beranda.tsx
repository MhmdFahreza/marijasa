// app/user/beranda.tsx
"use client";

import React, { memo } from "react";
import { motion } from "motion/react";
import { BackgroundLines } from "@/app/components/ui/background-lines";
import { useMagneticButton } from "@/app/components/lib/hooks/useMagneticButton";
import { Carousel, Card } from "@/app/components/ui/apple-cards-carousel";
import { InfiniteMovingCardsData } from "@/app/components/ui/infinite-moving-cards-data";
import { cardData } from "@/app/data/dataContent";
import { dataReason } from "@/app/data/dataReason";
import { HoverEffect } from "@/app/components/ui/card-hover-effect";
import SiteFooter from "@/app/footer"; // ⬅️ tambahkan ini

type ContentCategoryProps = {
    text?: string;
    imageUrl?: string;
};

const ContentCategory = memo(function ContentCategory({
    text,
    imageUrl,
}: ContentCategoryProps) {
    return (
        <>
            {[...new Array(3).fill(1)].map((_, index) => (
                <div
                    key={"dummy-content" + index}
                    className="bg-[#F5F5F7] dark:bg-neutral-800 p-8 md:p-14 rounded-3xl mb-4"
                >
                    <p className="text-neutral-600 dark:text-neutral-400 text-base md:text-2xl font-sans max-w-3xl mx-auto">
                        <span className="font-bold text-neutral-700 dark:text-neutral-200">
                            {text ?? "The first rule of Apple club is that you boast about Apple club."}
                        </span>{" "}
                        Keep a journal, quickly jot down a grocery list, and take amazing class notes.
                        Want to convert those notes to text? No problem.
                    </p>
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt="Macbook mockup from Aceternity UI"
                            height="500"
                            width="500"
                            className="md:w-1/2 md:h-1/2 h-full w-full mx-auto object-contain"
                        />
                    ) : null}
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
    const cards = cardData.map((item, index) => (
        <Card
            key={item.title + index}
            card={{
                category: item.category,
                title: item.title,
                src: item.src,
                content: <ContentCategory text={item.text} imageUrl={item.imageUrl} />,
            }}
            index={index}
        />
    ));

    return (
        <div className="w-full h-full py-20">
            <h2 className="max-w-7xl pl-4 mx-auto text-xl md:text-5xl font-bold text-neutral-800 dark:text-neutral-200 font-sans">
                Jasa yang kami sediakan.
            </h2>
            <Carousel items={cards} />
        </div>
    );
}

export default function Beranda() {
    const { btnRef, x, y, scale, handleMouseMove, handleMouseLeave } =
        useMagneticButton({
            activationRadius: 180,
            strengthFactor: 0.15,
            scaleFactor: 0.12,
        });

    return (
        <>
            <BackgroundLines
                className="flex items-center justify-center w-full flex-col px-4 relative"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                <div className="max-w-4xl mx-auto">
                    <h2
                        className="bg-clip-text text-transparent text-center bg-gradient-to-b
            from-neutral-900 to-neutral-700 dark:from-neutral-600 dark:to-white
            text-xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl
            leading-tight md:leading-tight
            font-sans py-3 md:py-8 relative z-20 font-bold tracking-tight"
                    >
                        Temukan Penyedia Jasa Terpercaya, untuk Kebutuhan Rumah Tangga Anda.
                    </h2>
                </div>

                <p className="max-w-xl mx-auto text-sm md:text-lg text-neutral-700 dark:text-neutral-400 text-center relative z-20">
                    Dapatkan solusi jasa rumah tangga yang aman, terjangkau, dan terpercaya. Temukan
                    penyedia jasa terbaik untuk Anda dengan mengeklik tombol di bawah.
                </p>

                <motion.button
                    ref={btnRef}
                    style={{ x, y, scale }}
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

            <div className="w-full">
                <CardCategory />
            </div>

            <InfiniteMovingCardsData />

            <div className="w-full py-16">
                <h2
                    className="max-w-7xl px-4 mx-auto text-center
          text-lg md:text-3xl font-semibold md:font-bold
          text-neutral-800 dark:text-neutral-200 font-sans"
                >
                    Alasan Mengapa MARIJASA Jadi Pilihan Tepat
                </h2>
                <CardHoverEffect />
            </div>

            <SiteFooter />
        </>
    );
}
