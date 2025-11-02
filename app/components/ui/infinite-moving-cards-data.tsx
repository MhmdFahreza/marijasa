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
  { quote: "It was the best of times, it was the worst of times, ...", name: "Charles Dickens", title: "A Tale of Two Cities" },
  { quote: "To be, or not to be, that is the question: ...", name: "William Shakespeare", title: "Hamlet" },
  { quote: "All that we see or seem is but a dream within a dream.", name: "Edgar Allan Poe", title: "A Dream Within a Dream" },
  { quote: "It is a truth universally acknowledged, ...", name: "Jane Austen", title: "Pride and Prejudice" },
  { quote: "Call me Ishmael. Some years ago—never mind how long precisely—...", name: "Herman Melville", title: "Moby-Dick" },
];
