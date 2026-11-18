"use client";

import type { WordItem } from "@/data/lessons";

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
  return (
    <div className="w-full max-w-2xl">
      <div className="mb-7 text-center">
        <span className="text-6xl sm:text-7xl" aria-hidden="true">{word.emoji}</span>
        <h2 className="mt-5 text-2xl font-black tracking-tight sm:text-3xl">What does <span className="text-[#745ce4]">{word.english}</span> mean?</h2>
        <p className="mt-2 text-sm font-bold text-[#858196]">Choose the matching word in Russian.</p>
      </div>
      <fieldset disabled={checked}>
        <legend className="sr-only">Choose a translation for {word.english}</legend>
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          {options.map((option) => (
            <label key={option.id} className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border-2 px-5 py-4 text-lg font-extrabold shadow-[0_4px_0_rgba(54,44,96,0.05)] transition-colors ${selected === option.id ? "border-[#806be3] bg-[#f0ecff] text-[#5843b8]" : "border-[#eeedf3] bg-white hover:border-[#cfc5fa]"} ${checked ? "cursor-default" : ""}`}>
              <input type="radio" name="answer" value={option.id} checked={selected === option.id} onChange={() => onSelect(option.id)} className="h-5 w-5 shrink-0 accent-[#745ce4]" />
              <span lang="ru">{option.russian}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
