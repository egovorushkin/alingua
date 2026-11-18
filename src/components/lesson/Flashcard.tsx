"use client";

import { RotateCw, Volume2 } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import Icon3D from "@/components/ui/Icon3D";
import type { WordItem } from "@/data/lessons";
import { speakWord } from "@/utils/speech";
import { soundFX } from "@/utils/sound";

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
  const muted = useSyncExternalStore(soundFX.subscribe, soundFX.isMuted, () => false);

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
          aria-label={revealed ? `${word.english}: ${word.russian}. ${word.exampleSentence}` : `Показать перевод слова ${word.english}`}
          className="flex min-h-64 w-full flex-col items-center justify-center rounded-[26px] bg-[#f7f4ff] px-4 py-6 transition-colors hover:bg-[#f1ecff] active:scale-[0.99] sm:min-h-72"
        >
          <Icon3D name={word.icon} size={120} fallback={word.emoji} loading="eager" className="drop-shadow-md" />
          <span lang="en" className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{word.english}</span>
          {revealed ? (
            <span className="mt-2 text-xl font-extrabold text-[#6d55cf]" lang="ru">{word.russian}</span>
          ) : (
            <span className="mt-3 flex items-center gap-1.5 text-sm font-bold text-[#7666b5]"><RotateCw size={15} aria-hidden="true" /> Нажми, чтобы узнать перевод</span>
          )}
        </button>
        <p lang={revealed ? "en" : undefined} className="mt-4 min-h-6 text-sm font-bold text-[#77758b]">
          {revealed ? `“${word.exampleSentence}”` : "Как думаешь, что значит это слово?"}
        </p>
        <button type="button" data-sound="off" disabled={muted} onClick={listen} className="mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#eeeaff] px-5 text-sm font-extrabold text-[#604ac5] transition-transform hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60">
          <Volume2 size={19} aria-hidden="true" /> Послушать
        </button>
        {muted && <p className="mt-3 text-sm font-bold text-[#77758b]">Звук выключен. Включи его кнопкой вверху, чтобы послушать.</p>}
        {speechError && <p role="status" className="mt-3 text-sm font-bold text-[#a64242]">Сейчас звук недоступен. Ты всё равно можешь прочитать слово!</p>}
      </div>
    </div>
  );
}
