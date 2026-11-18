"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Volume2 } from "lucide-react";
import Icon3D from "@/components/ui/Icon3D";
import type { WordItem } from "@/data/lessons";
import { soundFX } from "@/utils/sound";
import { cancelSpeech, speakWord } from "@/utils/speech";

export default function ListenGuessStep({
  word, options, selected, checked, onSelect,
}: {
  word: WordItem;
  options: WordItem[];
  selected: string | null;
  checked: boolean;
  onSelect: (id: string) => void;
}) {
  const muted = useSyncExternalStore(soundFX.subscribe, soundFX.isMuted, () => false);
  const reduceMotion = useReducedMotion();
  const [speaking, setSpeaking] = useState(false);
  const [speechError, setSpeechError] = useState(false);
  const request = useRef({ id: 0 });
  const groupId = useId();
  const active = speaking && !muted && !checked;

  const play = useCallback((rate: number) => {
    const playback = request.current;
    const id = ++playback.id;
    setSpeaking(false);
    setSpeechError(false);
    const failed = () => {
      if (id === playback.id) { setSpeaking(false); setSpeechError(true); }
    };
    if (!speakWord(word.english, failed, {
      rate,
      onStart: () => { if (id === playback.id) setSpeaking(true); },
      onEnd: () => { if (id === playback.id) setSpeaking(false); },
    })) failed();
  }, [word.english]);

  useEffect(() => {
    const playback = request.current;
    // Let navigation cleanup finish before attempting browser-controlled autoplay.
    const timer = !muted && !checked ? setTimeout(() => play(0.85), 0) : undefined;
    return () => {
      clearTimeout(timer);
      playback.id++;
      cancelSpeech();
    };
  }, [play, muted, checked]);

  return (
    <div className="w-full max-w-2xl">
      <div className="rounded-[32px] border border-[#eeeaf7] bg-white p-5 text-center shadow-[0_12px_40px_rgba(70,53,130,0.07)] sm:p-7">
        <h2 className="text-xl font-black sm:text-2xl">Какое слово прозвучало?</h2>
        <p className="mt-2 text-sm font-bold text-[#777184]">Послушай и выбери подходящую картинку.</p>
        <div className="relative mx-auto my-6 flex h-36 w-36 items-center justify-center">
          <motion.span
            aria-hidden="true"
            initial={false}
            animate={active && !reduceMotion ? { scale: [1, 1.25, 1], opacity: [0.5, 0.1, 0.5] } : { scale: 1, opacity: 0.3 }}
            transition={{ duration: 1.2, repeat: active && !reduceMotion ? Infinity : 0 }}
            className="absolute inset-0 rounded-full bg-[#b8a8fa]"
          />
          <motion.button
            type="button"
            data-sound="off"
            aria-label="Послушать слово"
            disabled={muted || checked}
            onClick={() => play(0.85)}
            whileTap={{ scale: reduceMotion ? 1 : 0.94 }}
            className="relative flex h-28 w-28 items-center justify-center rounded-full border-b-8 border-[#5843b8] bg-[#745ce4] text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Volume2 size={54} aria-hidden="true" />
          </motion.button>
        </div>
        <div aria-hidden="true" className="mb-3 flex h-8 items-center justify-center gap-1">
          {[0, 1, 2, 3, 4].map((bar) => (
            <motion.span
              key={bar}
              initial={false}
              animate={{ scaleY: active && !reduceMotion ? [0.35, 1, 0.35] : 0.35 }}
              transition={{ duration: 0.55, delay: bar * 0.08, repeat: active && !reduceMotion ? Infinity : 0 }}
              className="h-8 w-1.5 rounded-full bg-[#8c78e9]"
            />
          ))}
        </div>
        <button type="button" data-sound="off" disabled={muted || checked} onClick={() => play(0.65)} className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#eeeaff] px-5 font-extrabold text-[#604ac5] transition-transform motion-safe:active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"><span aria-hidden="true">🐢</span> Помедленнее</button>
        <p role="status" className="mt-3 text-sm font-bold text-[#777184]">
          {muted ? "Звук выключен. Включи его кнопкой вверху, чтобы послушать." : speechError ? "Не получилось озвучить слово. Нажми на динамик ещё раз. Если звука нет, попроси взрослого проверить поддержку речи в браузере." : active ? "Слушай внимательно..." : "Нажми на динамик, чтобы послушать ещё раз."}
        </p>
        {checked && (
          <div className="mt-5 rounded-2xl bg-[#f3efff] p-4">
            <p className="text-2xl font-black text-[#604ac5]"><span lang="en">{word.english}</span> <span className="text-lg" lang="ru">· {word.russian}</span></p>
            <p lang="en" className="mt-2 text-sm font-bold text-[#706a81]">{word.exampleSentence}</p>
          </div>
        )}
      </div>
      <fieldset disabled={checked} className="mt-5">
        <legend className="sr-only">Выбери прозвучавшее слово</legend>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {options.map((option) => (
            <motion.label
              key={option.id}
              initial={false}
              animate={{ x: checked && selected === option.id && option.id !== word.id && !reduceMotion ? [0, -6, 6, -3, 3, 0] : 0 }}
              transition={{ duration: 0.35 }}
              className={`relative flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 p-3 text-center shadow-[0_4px_0_rgba(54,44,96,0.05)] transition-colors ${checked && option.id === word.id ? "border-emerald-500 bg-emerald-50 text-emerald-800" : checked && selected === option.id ? "border-rose-400 bg-rose-50 text-rose-800" : selected === option.id ? "border-[#806be3] bg-[#f0ecff] text-[#5843b8]" : "border-[#eeedf3] bg-white hover:border-[#cfc5fa]"} ${checked ? "cursor-default" : ""}`}
            >
              <input type="radio" name={groupId} value={option.id} checked={selected === option.id} onChange={() => onSelect(option.id)} className="absolute left-3 top-3 h-5 w-5 accent-[#745ce4]" />
              <Icon3D name={option.icon} size={56} fallback={option.emoji} />
              <span lang="ru" className="max-w-full break-words text-base font-extrabold sm:text-lg">{option.russian}</span>
              {checked && option.id === word.id && <Check size={18} className="absolute right-2 top-2" aria-label="Верный ответ" />}
            </motion.label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
