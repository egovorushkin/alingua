"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, LockKeyhole } from "lucide-react";
import ThreeDIcon, { type ThreeDIconName } from "@/components/ThreeDIcon";

export default function AchievementBadge({
  title, icon, description, unlocked,
}: {
  title: string;
  icon: ThreeDIconName;
  description: string;
  unlocked: boolean;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <article className={`relative flex h-full flex-col items-center rounded-[28px] border p-6 text-center ${unlocked ? "border-[#e8dff8] bg-gradient-to-br from-white to-[#f2edff] shadow-[0_8px_24px_rgba(115,86,190,0.08)]" : "border-[#e8e6ed] bg-[#f3f2f5]"}`}>
      <motion.div
        animate={unlocked && !reduceMotion ? { y: [0, -6, 0] } : undefined}
        transition={{ duration: 2, repeat: 2, ease: "easeInOut" }}
        className={`relative flex h-20 w-20 items-center justify-center rounded-[26px] ${unlocked ? "bg-[#fff1c8] shadow-[0_0_24px_#f5d47744]" : "bg-[#e6e3eb]"}`}
      >
        <ThreeDIcon name={icon} size={72} className={unlocked ? "" : "grayscale opacity-40"} />
        {!unlocked && <LockKeyhole size={23} className="absolute bottom-0 right-0 rounded-lg bg-white p-1 text-[#777184]" aria-hidden="true" />}
      </motion.div>
      <h3 className="mt-5 text-lg font-black">{title}</h3>
      <p className="mt-2 flex-1 text-sm font-bold leading-relaxed text-[#777184]">{description}</p>
      <p className={`mt-4 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide ${unlocked ? "text-emerald-700" : "text-[#777184]"}`}>
        {unlocked ? <Check size={15} aria-hidden="true" /> : <LockKeyhole size={14} aria-hidden="true" />}
        {unlocked ? "Открыто" : "Всё впереди"}
        {!unlocked && <span className="sr-only"> — Пока закрыто</span>}
      </p>
    </article>
  );
}
