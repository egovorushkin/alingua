"use client";

import type { WordItem } from "@/data/lessons";
import Icon3D from "@/components/ui/Icon3D";
import { matchesWord } from "./lesson-state";

export default function WordScramble({
  word, letters, formId, answer, checked, onAnswer, onSuccess, onFail,
}: {
  word: WordItem;
  letters: string[];
  formId: string;
  answer: string;
  checked: boolean;
  onAnswer: (answer: string) => void;
  onSuccess: () => void;
  onFail: () => void;
}) {
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
      <div className="my-6 flex flex-wrap justify-center gap-2" aria-label="Буквы вперемешку">
        {letters.map((letter, index) => (
          <span key={index} lang="en" className="flex h-11 w-9 items-center justify-center rounded-xl border-b-4 border-[#ded7f5] bg-[#eeeaff] text-xl font-black text-[#604ac5]">{letter}</span>
        ))}
      </div>
      <label htmlFor={`${formId}-answer`} className="mb-2 block text-sm font-extrabold text-[#615878]">Напиши слово по-английски</label>
      <input id={`${formId}-answer`} lang="en" value={answer} onChange={(event) => onAnswer(event.target.value)} disabled={checked} required pattern={".*\\S.*"} title="Сначала напиши слово, а потом проверь." autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={60} className="min-h-14 w-full rounded-2xl border-2 border-[#d6cdef] px-4 text-center text-xl font-extrabold disabled:bg-[#f5f3f8]" />
    </form>
  );
}
