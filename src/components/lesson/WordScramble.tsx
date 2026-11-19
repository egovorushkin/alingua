"use client";

import type { WordItem } from "@/data/lessons";
import { motion, useReducedMotion } from "framer-motion";
import { Lightbulb, LockKeyhole } from "lucide-react";
import Icon3D from "@/components/ui/Icon3D";
import { soundFX } from "@/utils/sound";
import { matchesWord } from "./lesson-state";
import { maskScrambleExample, scrambleHintLimit, type ScrambleBoard } from "./scramble-state";

export default function WordScramble({
  word, letters, board, formId, answer, checked, onAnswer, onPlace, onRemove, onHint, onSuccess, onFail,
}: {
  word: WordItem;
  letters: string[];
  board: ScrambleBoard;
  formId: string;
  answer: string;
  checked: boolean;
  onAnswer: (answer: string) => void;
  onPlace: (tileId: number) => void;
  onRemove: (index: number) => void;
  onHint: () => void;
  onSuccess: () => void;
  onFail: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const remaining = scrambleHintLimit(word.english) - board.hintsUsed;
  const canHint = !checked && remaining > 0 && !matchesWord(word, answer);
  const used = new Set(board.slots.map((slot) => slot.tileId));
  return (
    <form
      id={formId}
      onSubmit={(event) => {
        event.preventDefault();
        if (!checked) (matchesWord(word, answer) ? onSuccess : onFail)();
      }}
      className="w-full max-w-xl rounded-[32px] border border-[#eeeaf7] bg-white p-5 text-center shadow-lg sm:p-8"
    >
      <Icon3D name={word.icon} size={96} fallback={word.emoji} loading="eager" className="mx-auto drop-shadow-md" />
      <h2 className="mt-4 text-2xl font-black">Собери слово из букв!</h2>
      <p className="mt-2 font-bold text-[#77758b]">Как по-английски «{word.russian}»?</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2" role="group" aria-label="Собранное слово">
        {board.slots.map((slot, index) => (
          <motion.button
            key={`${index}-${slot.isLockedHint}`}
            type="button"
            disabled={checked || slot.isLockedHint || !slot.letter}
            aria-label={`Буква ${index + 1}: ${slot.letter === " " ? "пробел" : slot.letter || "пусто"}${slot.isLockedHint ? ", подсказка закреплена" : slot.letter ? ", вернуть в набор" : ""}`}
            onClick={() => onRemove(index)}
            initial={slot.isLockedHint && !reduceMotion ? { scale: 0.65, y: -8 } : false}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 16 }}
            whileTap={reduceMotion ? undefined : { scale: 0.92 }}
            className={`relative flex h-12 min-w-11 items-center justify-center rounded-xl border-2 border-b-4 px-2 text-xl font-black disabled:cursor-default ${slot.isLockedHint ? "border-amber-400 bg-amber-100 text-amber-900 shadow-[0_0_14px_#fbbf2440]" : "border-[#d6cdef] bg-[#f7f5ff] text-[#604ac5]"}`}
          >
            <span lang="en">{slot.letter === " " ? "␣" : slot.letter || "·"}</span>
            {slot.isLockedHint && <LockKeyhole size={10} aria-hidden="true" className="absolute -right-1 -top-1 rounded-full bg-amber-200" />}
          </motion.button>
        ))}
      </div>
      <motion.button
        type="button"
        data-sound="off"
        disabled={!canHint}
        onClick={() => { onHint(); soundFX.playClick(); }}
        whileTap={reduceMotion ? undefined : { scale: 0.95 }}
        className="mt-5 inline-flex min-h-12 flex-wrap items-center justify-center gap-2 rounded-2xl border-b-4 border-amber-300 bg-amber-100 px-4 py-2 font-black text-amber-900 shadow-[0_0_18px_#fbbf2425] disabled:cursor-default disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500 disabled:shadow-none"
      >
        <Lightbulb size={21} aria-hidden="true" /> Подсказка <span className="text-sm">· осталось {remaining}</span>
      </motion.button>
      <p role="status" aria-live="polite" className="mt-2 text-sm font-bold text-[#77758b]">{board.hintsUsed ? "Золотые буквы закреплены — продолжим вместе!" : "Нажимай на буквы или напиши ответ ниже."}</p>
      {board.hintsUsed > 0 && word.exampleSentence && (
        <motion.p initial={reduceMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 break-words rounded-2xl bg-amber-50 p-4 font-extrabold text-amber-900">
          <span className="mb-1 block text-xs">Предложение-подсказка</span>
          <span lang="en">{maskScrambleExample(word.exampleSentence, word.english)}</span>
        </motion.p>
      )}
      <div className="my-6 flex flex-wrap justify-center gap-2" role="group" aria-label="Буквы вперемешку">
        {letters.map((letter, index) => (
          <motion.button key={index} type="button" aria-label={`Буква ${letter === " " ? "пробел" : letter}, плитка ${index + 1}`} disabled={checked || used.has(index) || board.slots.every((slot) => slot.letter)} onClick={() => onPlace(index)} whileTap={reduceMotion ? undefined : { scale: 0.92 }} className="flex h-12 min-w-11 items-center justify-center rounded-xl border-b-4 border-[#ded7f5] bg-[#eeeaff] px-2 text-xl font-black text-[#604ac5] disabled:cursor-default disabled:opacity-30"><span lang="en">{letter === " " ? "␣" : letter}</span></motion.button>
        ))}
      </div>
      <label htmlFor={`${formId}-answer`} className="mb-2 block text-sm font-extrabold text-[#615878]">Напиши слово по-английски</label>
      <input id={`${formId}-answer`} lang="en" value={answer} onChange={(event) => onAnswer(event.target.value)} disabled={checked} required pattern={".*\\S.*"} title="Сначала напиши слово, а потом проверь." autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={letters.length} className="min-h-14 w-full rounded-2xl border-2 border-[#d6cdef] px-4 text-center text-xl font-extrabold disabled:bg-[#f5f3f8]" />
    </form>
  );
}
