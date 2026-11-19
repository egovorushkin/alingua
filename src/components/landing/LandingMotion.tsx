"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import useReducedMotion from "@/hooks/useReducedMotion";

export default function LandingMotion({ children, className, float = false }: {
  children: ReactNode;
  className?: string;
  float?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={false}
      whileInView={reducedMotion ? undefined : { y: float ? [0, -6, 0] : [5, 0], opacity: float ? 1 : [0.86, 1] }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: float ? 3 : 0.45, ease: "easeInOut" }}
      animate={{ y: 0, opacity: 1 }}
    >
      {children}
    </motion.div>
  );
}
