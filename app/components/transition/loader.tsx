"use client";

import { motion } from "motion/react";
import { easeInOut } from "framer-motion";

export const LoaderTwo = () => {
  const transition = (x: number) => {
    return {
      duration: 2,
      repeat: Infinity,
      repeatType: "loop" as const,
      delay: x * 0.2,
      ease: easeInOut,
    };
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Memuat"
      className="
        w-full
        flex items-center justify-center
        gap-2 sm:gap-2.5 md:gap-3 lg:gap-3.5 xl:gap-4
        scale-110 sm:scale-125 md:scale-140 lg:scale-150 xl:scale-160
      "
    >
      <motion.div
        transition={transition(0)}
        initial={{ x: 0 }}
        animate={{ x: [0, 20, 0] }}
        className="
          h-3 w-3
          sm:h-4 sm:w-4
          md:h-5 md:w-5
          lg:h-6 lg:w-6
          xl:h-7 xl:w-7
          2xl:h-8 2xl:w-8
          rounded-full
          bg-neutral-300 dark:bg-neutral-500
          shadow-md
        "
      />
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: [0, 20, 0] }}
        transition={transition(0.4)}
        className="
          h-3 w-3
          sm:h-4 sm:w-4
          md:h-5 md:w-5
          lg:h-6 lg:w-6
          xl:h-7 xl:w-7
          2xl:h-8 2xl:w-8
          -translate-x-2
          rounded-full
          bg-neutral-300 dark:bg-neutral-500
          shadow-md
        "
      />
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: [0, 20, 0] }}
        transition={transition(0.8)}
        className="
          h-3 w-3
          sm:h-4 sm:w-4
          md:h-5 md:w-5
          lg:h-6 lg:w-6
          xl:h-7 xl:w-7
          2xl:h-8 2xl:w-8
          -translate-x-4
          rounded-full
          bg-neutral-300 dark:bg-neutral-500
          shadow-md
        "
      />
    </div>
  );
};
