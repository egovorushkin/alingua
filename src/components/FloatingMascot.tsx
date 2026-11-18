"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function FloatingMascot() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      aria-hidden="true"
      animate={reduceMotion ? undefined : { y: [0, -10, 0], rotate: [-3, 3, -3] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="relative flex h-36 w-36 items-center justify-center rounded-full bg-white/15 text-7xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)] sm:h-48 sm:w-48 sm:text-8xl"
    >
      🦊
      <span className="absolute -right-2 top-1 text-3xl sm:text-4xl">✨</span>
      <span className="absolute -bottom-2 left-0 text-3xl sm:text-4xl">⭐</span>
    </motion.div>
  );
}
