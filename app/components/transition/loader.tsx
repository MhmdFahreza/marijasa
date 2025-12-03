"use client";

import { motion } from "motion/react";

export const LoaderTwo = () => {
  const bouncingTransition = {
    duration: 0.6,
    repeat: Infinity,
    repeatType: "reverse" as const,
    ease: "easeInOut" as const,
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Memuat"
      className="w-full flex items-center justify-center gap-3 sm:gap-3.5 md:gap-4 scale-125 sm:scale-140 md:scale-150"
    >
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ ...bouncingTransition, delay: 0 }}
        className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 rounded-full bg-[#7CE0A8] shadow-lg shadow-[#7CE0A8]/40"
      />
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ ...bouncingTransition, delay: 0.1 }}
        className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 rounded-full bg-[#7CE0A8] shadow-lg shadow-[#7CE0A8]/40"
      />
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ ...bouncingTransition, delay: 0.2 }}
        className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 rounded-full bg-[#7CE0A8] shadow-lg shadow-[#7CE0A8]/40"
      />
    </div>
  );
};