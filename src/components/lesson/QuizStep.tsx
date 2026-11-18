"use client";

import type { WordItem } from "@/data/lessons";
import Icon3D from "@/components/ui/Icon3D";
import { motion, useReducedMotion } from "framer-motion";

export default function QuizStep({
  word,
  options,
  selected,
  checked,
  onSelect,
}: {
  word: WordItem;
  options: WordItem[];
  selected: string | null;
  checked: boolean;
  onSelect: (id: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <div className="w-full max-w-2xl">
      <div className="mb-7 text-center">
        <Icon3D name={word.icon} size={96} fallback={word.emoji} loading="eager" className="mx-auto drop-shadow-md" />
        <h2 className="mt-5 text-2xl font-black tracking-tight sm:text-3xl">Что значит <span lang="en" className="text-[#745ce4]">{word.english}</span>?</h2>
        <p className="mt-2 text-sm font-bold text-[#858196]">Выбери верный перевод на русский.</p>
      </div>
      <fieldset disabled={checked}>
        <legend className="sr-only">Выбери перевод слова <span lang="en">{word.english}</span></legend>
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          {options.map((option) => (
            <motion.label
              key={option.id}
              animate={{ scale: !reduceMotion && selected === option.id ? 1.025 : 1 }}
              whileTap={checked || reduceMotion ? undefined : { scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border-2 px-5 py-4 text-lg font-extrabold shadow-[0_4px_0_rgba(54,44,96,0.05)] transition-colors ${checked && option.id === word.id ? "border-emerald-500 bg-emerald-50 text-emerald-800" : checked && selected === option.id ? "border-rose-400 bg-rose-50 text-rose-800" : selected === option.id ? "border-[#806be3] bg-[#f0ecff] text-[#5843b8]" : "border-[#eeedf3] bg-white hover:border-[#cfc5fa]"} ${checked ? "cursor-default" : ""}`}>
              <input type="radio" name="answer" value={option.id} checked={selected === option.id} onChange={() => onSelect(option.id)} className="h-5 w-5 shrink-0 accent-[#745ce4]" />
              <span lang="ru">{option.russian}</span>
            </motion.label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
