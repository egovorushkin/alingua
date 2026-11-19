"use client";

import { useEffect, useId, useState } from "react";
import { motion } from "framer-motion";
import Icon3D from "@/components/ui/Icon3D";
import useReducedMotion from "@/hooks/useReducedMotion";
import { soundFX } from "@/utils/sound";

type Mood = "idle" | "excited" | "encouraging";

const phrases = [
  "Готов к открытиям? 🚀",
  "Твой английский растёт! 🌱",
  "Ошибаться можно. Пробуй смело! 💛",
  "Каждое слово — маленькая победа! ⭐",
  "Давай откроем что-то новое! ✨",
];

export default function MascotGuide({ nodeId, position, completedCount }: {
  nodeId: string;
  position: { x: number; y: number };
  completedCount: number;
}) {
  const reducedMotion = useReducedMotion();
  const bubbleId = useId();
  const [reaction, setReaction] = useState<{ nodeId: string; completedCount: number; mood: Mood; taps: number }>({
    nodeId, completedCount, mood: "idle", taps: 0,
  });
  if (reaction.nodeId !== nodeId || reaction.completedCount !== completedCount) {
    setReaction({ nodeId, completedCount, mood: completedCount > reaction.completedCount ? "excited" : "idle", taps: 0 });
  }
  useEffect(() => {
    if (reaction.mood === "encouraging") return;
    const timer = window.setTimeout(() => {
      setReaction((current) => current === reaction ? { ...current, mood: "encouraging" } : current);
    }, reaction.mood === "excited" ? 3500 : 14000);
    return () => window.clearTimeout(timer);
  }, [reaction]);

  const side = position.x >= 0 ? "left" : "right";
  const message = reaction.taps === 0 && reaction.mood !== "idle"
    ? reaction.mood === "excited" ? "Ещё шаг вперёд! Отличная работа! 🎉" : "Смело пробуй! Я рядом. 💛"
    : phrases[reaction.taps % phrases.length];
  const layout = reducedMotion ? false : "position";

  return (
    <motion.aside
      aria-label="Твой проводник"
      data-mood={reaction.mood}
      data-side={side}
      layout={layout}
      initial={false}
      transition={{ layout: { duration: 0.45, ease: "easeInOut" } }}
      className="pointer-events-none absolute inset-x-0 h-12"
      style={{ top: position.y - 104 }}
    >
      <motion.div
        layout={layout}
        className={`absolute flex h-12 w-60 -translate-x-1/2 items-center gap-2 ${side === "left" ? "" : "flex-row-reverse"}`}
        style={{ left: `clamp(128px, calc(50% + ${position.x}px), calc(100% - 128px))` }}
      >
        <motion.button
          type="button"
          layout={layout}
          data-sound="off"
          aria-label="Попросить поддержки у проводника"
          aria-describedby={bubbleId}
          onClick={() => {
            soundFX.playClick();
            setReaction((current) => ({ ...current, taps: current.taps + 1, mood: "excited" }));
          }}
          whileTap={reducedMotion ? undefined : { scale: 0.95 }}
          className={`pointer-events-auto relative grid size-12 shrink-0 place-items-center rounded-2xl border-b-4 shadow-md outline-offset-4 focus-visible:outline-4 focus-visible:outline-violet-600 ${reaction.mood === "excited" ? "border-amber-300 bg-amber-100" : "border-violet-200 bg-violet-100"}`}
        >
          <motion.span
            key={`${nodeId}-${completedCount}-${reaction.taps}`}
            aria-hidden="true"
            className="block"
            animate={reducedMotion ? { y: 0, rotate: 0, scale: 1 } : reaction.mood === "excited"
              ? { y: [0, -6, 0], rotate: [0, -10, 10, -6, 0], scale: [1, 1.1, 1] }
              : { y: [0, -2, 0], rotate: reaction.mood === "encouraging" ? [0, -3, 3, 0] : 0, scale: [1, 1.03, 1] }}
            transition={reducedMotion ? { duration: 0 } : reaction.mood === "excited"
              ? { duration: 0.55 } : { duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Icon3D name="boy" fallback="🧑‍🚀" size={44} />
          </motion.span>
          <span aria-hidden="true" className="absolute -right-1 -top-2 text-sm">{reaction.mood === "excited" ? "✨" : "💛"}</span>
        </motion.button>
        <motion.p layout={layout} id={bubbleId} role="status" aria-atomic="true" className="flex h-12 min-w-0 flex-1 items-center justify-center rounded-2xl border-2 border-violet-200 bg-white px-2 py-1 text-center text-xs font-extrabold leading-4 text-violet-900 shadow-sm">
          {message}
        </motion.p>
      </motion.div>
      <span aria-hidden="true" className="absolute top-11 size-2 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-violet-200 bg-white" style={{ left: `calc(50% + ${position.x}px)` }} />
    </motion.aside>
  );
}
