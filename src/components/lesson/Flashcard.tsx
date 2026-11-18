"use client";

import { RotateCw, Volume2 } from "lucide-react";
import { useState } from "react";
import type { WordItem } from "@/data/lessons";
import { speakWord } from "@/utils/speech";

export default function Flashcard({
  word,
  revealed,
  onReveal,
}: {
  word: WordItem;
  revealed: boolean;
  onReveal: () => void;
}) {
  const [speechError, setSpeechError] = useState(false);

  function listen() {
    setSpeechError(false);
    if (!speakWord(word.english, () => setSpeechError(true))) {
      setSpeechError(true);
    }
  }

  return (
    <div className="w-full max-w-xl">
      <div className="rounded-[32px] border border-[#eeeaf7] bg-white p-5 text-center shadow-[0_16px_50px_rgba(70,53,130,0.09)] sm:p-8">
        <button
          type="button"
          onClick={onReveal}
          aria-label={revealed ? `${word.english}: ${word.russian}. ${word.exampleSentence}` : `Reveal the translation of ${word.english}`}
          className="flex min-h-64 w-full flex-col items-center justify-center rounded-[26px] bg-[#f7f4ff] px-4 py-6 transition-colors hover:bg-[#f1ecff] active:scale-[0.99] sm:min-h-72"
        >
          <span className="text-7xl sm:text-8xl" aria-hidden="true">{word.emoji}</span>
          <span className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{word.english}</span>
          {revealed ? (
            <span className="mt-2 text-xl font-extrabold text-[#6d55cf]" lang="ru">{word.russian}</span>
          ) : (
            <span className="mt-3 flex items-center gap-1.5 text-sm font-bold text-[#7666b5]"><RotateCw size={15} aria-hidden="true" /> Tap to reveal</span>
          )}
        </button>
        <p className="mt-4 min-h-6 text-sm font-bold text-[#77758b]">
          {revealed ? `“${word.exampleSentence}”` : "What do you think this word means?"}
        </p>
        <button type="button" onClick={listen} className="mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#eeeaff] px-5 text-sm font-extrabold text-[#604ac5] transition-transform hover:-translate-y-0.5 active:scale-95">
          <Volume2 size={19} aria-hidden="true" /> Listen
        </button>
        {speechError && <p role="status" className="mt-3 text-sm font-bold text-[#a64242]">Audio isn&apos;t available right now. You can still read the word!</p>}
      </div>
    </div>
  );
}
