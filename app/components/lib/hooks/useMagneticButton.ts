"use client";

import { useRef, useCallback } from "react";
import { useMotionValue, useSpring } from "motion/react";

type UseMagneticButtonOptions = {
  activationRadius?: number; 
  strengthFactor?: number;  
  scaleFactor?: number;     
};

export function useMagneticButton({
  activationRadius = 180,
  strengthFactor = 0.15,
  scaleFactor = 0.12,
}: UseMagneticButtonOptions = {}) {
  const btnRef = useRef<HTMLButtonElement | null>(null);

  // raw motion values
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rawScale = useMotionValue(1);

  // spring biar halus
  const x = useSpring(rawX, { stiffness: 220, damping: 18 });
  const y = useSpring(rawY, { stiffness: 220, damping: 18 });
  const scale = useSpring(rawScale, { stiffness: 220, damping: 18 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const button = btnRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const buttonCenterX = rect.left + rect.width / 2;
      const buttonCenterY = rect.top + rect.height / 2;

      const diffX = e.clientX - buttonCenterX;
      const diffY = e.clientY - buttonCenterY;
      const distance = Math.hypot(diffX, diffY);

      if (distance < activationRadius) {
        const strength = (activationRadius - distance) / activationRadius;

        rawX.set(diffX * strengthFactor * strength);
        rawY.set(diffY * strengthFactor * strength);
        rawScale.set(1 + scaleFactor * strength);
      } else {
        rawX.set(0);
        rawY.set(0);
        rawScale.set(1);
      }
    },
    [activationRadius, strengthFactor, scaleFactor, rawX, rawY, rawScale]
  );

  const handleMouseLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
    rawScale.set(1);
  }, [rawX, rawY, rawScale]);

  return {
    btnRef,
    x,
    y,
    scale,
    handleMouseMove,
    handleMouseLeave,
  };
}
