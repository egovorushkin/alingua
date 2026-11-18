"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Heart, Sparkles, Star, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { TopicData } from "@/data/lessons";
import Flashcard from "./Flashcard";
import QuizStep from "./QuizStep";

export default function Lesson({ lesson }: { lesson: TopicData }) {
  const [step, setStep] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [lives, setLives] = useState(3);
  const reduceMotion = useReducedMotion();
  const count = lesson.words.length;
  const complete = step === count * 2;
  const learning = step < count;
  const wordIndex = learning ? step : step - count;
  const word = lesson.words[wordIndex];
  const progress = (step / (count * 2)) * 100;
  const accuracy = Math.round((correct / count) * 100);
  const stars = 1 + Number(accuracy >= 60) + Number(accuracy === 100);

  useEffect(() => () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  function next() {
    setStep((value) => value + 1);
    setRevealed(false);
    setSelected(null);
    setChecked(false);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  function checkAnswer() {
    if (selected === null || checked) return;
    setChecked(true);
    if (selected === word.id) {
      setCorrect((value) => value + 1);
    } else {
      setLives((value) => Math.max(0, value - 1));
    }
  }

  const choices = complete || learning ? [] : Array.from({ length: 4 }, (_, offset) => lesson.words[(wordIndex + offset) % count]);
  if (choices.length) {
    const shift = (wordIndex + 1) % choices.length;
    choices.push(...choices.splice(0, shift));
  }

  return (
    <main className="flex min-h-dvh flex-col bg-[#faf9f6]">
      <header className="mx-auto flex w-full max-w-4xl items-center gap-4 px-5 py-5 sm:gap-6 sm:px-8 sm:py-7">
        <Link href="/" aria-label="Close lesson and return to dashboard" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[#9b97aa] transition-colors hover:bg-[#efedf5] hover:text-[#5a536d]"><X size={25} aria-hidden="true" /></Link>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-[#eae8f0]" role="progressbar" aria-label="Lesson progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <motion.div className="h-full rounded-full" style={{ backgroundColor: lesson.themeColor }} initial={false} animate={{ width: `${progress}%` }} transition={{ duration: reduceMotion ? 0 : 0.45, ease: "easeOut" }} />
        </div>
        <div className="flex min-w-14 items-center justify-center gap-1.5 text-lg font-black text-[#e86c72]" aria-label={`${lives} lives remaining`}><Heart size={23} fill="currentColor" aria-hidden="true" />{lives}</div>
      </header>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-5 py-8 sm:px-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} initial={reduceMotion ? false : { opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0, x: -30 }} transition={{ duration: 0.2 }} className="flex w-full flex-col items-center">
            {complete ? (
              <div className="text-center">
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#fff1c8] text-6xl" aria-hidden="true">🏆</div>
                <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-[#8b79d0]">Adventure complete</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">You did it, explorer!</h1>
                <p className="mt-3 font-bold text-[#858196]">You practiced all your {lesson.title.toLowerCase()} words. Amazing work!</p>
                <div className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-3">
                  <div className="rounded-3xl bg-[#fff3d4] p-4"><span className="text-2xl" aria-hidden="true">⭐</span><p className="mt-2 text-xl font-black text-[#976918]">{stars}</p><p className="text-xs font-bold text-[#a08251]">Stars</p></div>
                  <div className="rounded-3xl bg-[#eeeaff] p-4"><span className="text-2xl" aria-hidden="true">⚡</span><p className="mt-2 text-xl font-black text-[#604ac5]">{correct * 10}</p><p className="text-xs font-bold text-[#8a80b2]">XP</p></div>
                  <div className="rounded-3xl bg-[#e4f6ed] p-4"><span className="text-2xl" aria-hidden="true">🎯</span><p className="mt-2 text-xl font-black text-[#31845e]">{accuracy}%</p><p className="text-xs font-bold text-[#6b9b80]">Accuracy</p></div>
                </div>
                <p className="mt-5 text-xs font-bold text-[#9993a9]">Rewards are for this adventure and aren&apos;t saved yet.</p>
                <Link href="/" className="mt-7 inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border-b-4 border-[#5843b8] bg-[#745ce4] px-8 py-3 font-black text-white transition-transform hover:-translate-y-0.5 active:translate-y-1">Back to dashboard <ArrowRight size={19} aria-hidden="true" /></Link>
              </div>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b79d0]">{lesson.title} · {learning ? "Learn" : "Practice"}</p>
                  <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{learning ? "Meet a new word!" : "Show what you know!"}</h1>
                  <p className="mt-1 text-sm font-bold text-[#9993a9]">{wordIndex + 1} of {count}</p>
                </div>
                {learning ? (
                  <Flashcard word={word} revealed={revealed} onReveal={() => setRevealed(true)} />
                ) : (
                  <QuizStep word={word} options={choices} selected={selected} checked={checked} onSelect={setSelected} />
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {!complete && (
        <footer className={`border-t transition-colors ${checked ? selected === word.id ? "border-[#c9ead8] bg-[#e4f7eb]" : "border-[#f3d0cd] bg-[#fff0ee]" : "border-[#eeedf2] bg-white"}`}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={checked ? "feedback" : "actions"} initial={reduceMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0 }} transition={{ duration: 0.2 }} className="mx-auto flex max-w-4xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              {checked ? (
                <div role="status">
                  <p className={`flex items-center gap-2 text-xl font-black ${selected === word.id ? "text-[#278352]" : "text-[#b64c4c]"}`}>{selected === word.id ? <>Awesome! <span aria-hidden="true">🌟</span></> : <>Keep going! <span aria-hidden="true">💪</span></>}</p>
                  <p className={`mt-1 text-sm font-bold ${selected === word.id ? "text-[#52866a]" : "text-[#a36868]"}`}>{selected === word.id ? "You got it!" : <>The answer is <span lang="ru">{word.russian}</span>. {lives === 0 && "You can still finish!"}</>}</p>
                </div>
              ) : (
                <p className="flex items-center gap-2 text-sm font-bold text-[#9993a9]"><Sparkles size={17} className="text-[#aa9ae5]" aria-hidden="true" />{learning ? "Tap the card to discover the meaning." : "Choose an answer, then check it."}</p>
              )}
              <motion.button type="button" whileTap={reduceMotion ? undefined : { scale: 0.96 }} onClick={learning || checked ? next : checkAnswer} disabled={learning ? !revealed : !checked && selected === null} className="min-h-14 min-w-44 rounded-2xl border-b-4 border-[#5843b8] bg-[#745ce4] px-8 py-3 font-black text-white transition-colors hover:bg-[#654dce] disabled:cursor-not-allowed disabled:border-[#dfdde6] disabled:bg-[#ecebf0] disabled:text-[#a7a3b2]">
                {learning || checked ? "Continue" : "Check"} <Star size={16} className="ml-1 inline" aria-hidden="true" />
              </motion.button>
            </motion.div>
          </AnimatePresence>
        </footer>
      )}
    </main>
  );
}
