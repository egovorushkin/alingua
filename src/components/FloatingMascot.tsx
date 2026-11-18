"use client";

import { motion, useReducedMotion } from "framer-motion";
import ThreeDIcon from "@/components/ThreeDIcon";

export default function FloatingMascot() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      aria-hidden="true"
      animate={reduceMotion ? undefined : { y: [0, -10, 0], rotate: [-3, 3, -3] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="relative flex h-36 w-36 items-center justify-center rounded-full bg-white/15 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)] sm:h-48 sm:w-48"
    >
      <ThreeDIcon name="rocket" size={192} preload className="h-32 w-32 drop-shadow-xl sm:h-44 sm:w-44" />
      <ThreeDIcon name="star" size={40} className="absolute -right-2 top-1" />
      <ThreeDIcon name="star" size={32} className="absolute -bottom-2 left-0" />
    </motion.div>
  );
}
