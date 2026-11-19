"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function ConfettiBurst({ count = 16 }: { count?: number }) {
  const reducedMotion = useReducedMotion();
  if (reducedMotion !== false) return null;
  return Array.from({ length: count }, (_, index) => (
    <motion.span
      key={index}
      aria-hidden="true"
      initial={{ x: 0, y: 15, opacity: 1, scale: 0.5 }}
      animate={{ x: (index - (count - 1) / 2) * 24, y: [-10, -70, 60], opacity: [1, 1, 0], rotate: index * 75, scale: 1 }}
      transition={{ duration: 1.5, delay: (index % 4) * 0.05 }}
      className={`pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 rounded-sm ${["bg-amber-400", "bg-violet-400", "bg-emerald-400", "bg-rose-400"][index % 4]}`}
    />
  ));
}
