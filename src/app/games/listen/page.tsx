"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReducer, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Headphones, X } from "lucide-react";
import { SoundToggle } from "@/components/SoundControls";
import ThreeDIcon from "@/components/ThreeDIcon";
import ListenGuessStep from "@/components/lesson/ListenGuessStep";
import { createListeningRounds } from "@/components/lesson/lesson-state";
import { initialListenGame, listenGameReducer } from "@/components/lesson/listen-game-state";
import { useProgress } from "@/context/ProgressContext";
import { lessons } from "@/data/lessons";
import { soundFX } from "@/utils/sound";

const pool = lessons.flatMap((topic) => topic.words);
const buttonClass = "inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border-b-4 border-[#5843b8] bg-[#745ce4] px-6 py-3 font-black text-white transition-colors hover:bg-[#654dce] disabled:cursor-not-allowed disabled:border-[#dfdde6] disabled:bg-[#ecebf0] disabled:text-[#a7a3b2]";

export default function ListeningGamePage() {
  const [state, dispatch] = useReducer(listenGameReducer, initialListenGame);
  const [saveError, setSaveError] = useState(false);
  const { addStars, error, isHydrated } = useProgress();
  const awarded = useRef(false);
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const checked = state.phase === "feedback";
  const round = state.rounds[state.roundIndex];
  const stars = state.correct * 2;
  const progress = state.roundIndex + Number(checked);

  function check() {
    const next = listenGameReducer(state, { type: "check" });
    if (next === state) return;
    if (next.wasCorrect) soundFX.playSuccess();
    else soundFX.playError();
    dispatch({ type: "check" });
  }

  function saveStars() {
    if (awarded.current) return true;
    try {
      addStars(stars);
      awarded.current = true;
      setSaveError(false);
      return true;
    } catch {
      setSaveError(true);
      return false;
    }
  }

  function finish() {
    if (saveStars()) router.push("/");
  }

  function playAgain() {
    if (!saveStars()) return;
    awarded.current = false;
    dispatch({ type: "restart" });
  }

  return (
    <main className="flex min-h-dvh flex-col bg-[#faf9f6]">
      <header className="mx-auto w-full max-w-4xl px-5 py-5 sm:px-8">
        <nav aria-label="Listening game navigation" className="flex items-center justify-between gap-3">
          <Link href="/" aria-label="Close listening game and return home" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[#797387] hover:bg-[#efedf5]"><X size={25} aria-hidden="true" /></Link>
          <h1 className="text-xl font-black text-[#604ac5] sm:text-2xl">Listen &amp; Guess</h1>
          <SoundToggle />
        </nav>
        {state.phase !== "ready" && (
          <div className="mt-4">
            <div className="mb-2 flex justify-between gap-3 text-sm font-extrabold">
              <p role="status">{state.phase === "complete" ? "Challenge complete!" : `Round ${state.roundIndex + 1} of 5`}</p>
              <p className="text-[#976918]"><span aria-hidden="true">⭐</span> {stars} stars earned</p>
            </div>
            <div role="progressbar" aria-label="Listening challenge progress" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={5} className="h-3 overflow-hidden rounded-full bg-[#eae8f0]">
              <motion.div initial={false} animate={{ width: `${progress * 20}%` }} transition={{ duration: reduceMotion ? 0 : 0.3 }} className="h-full rounded-full bg-[#8c78e9]" />
            </div>
          </div>
        )}
        {error && <p role="alert" className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-800">{error}</p>}
      </header>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-5 py-6 sm:px-8">
        {state.phase === "ready" ? (
          <section aria-labelledby="listening-intro" className="w-full max-w-xl rounded-[32px] border border-[#eeeaf7] bg-white p-6 text-center shadow-lg sm:p-9">
            <ThreeDIcon name="headphone" size={128} loading="eager" className="mx-auto" />
            <h2 id="listening-intro" className="mt-5 text-3xl font-black">Ready, super listener?</h2>
            <p className="mt-3 font-bold leading-relaxed text-[#777184]">Five mystery words. Listen closely, choose a picture, and earn 2 stars for every correct answer!</p>
            <p className="mt-3 text-sm font-bold text-[#777184]">Need more time? Try the turtle&apos;s slow replay.</p>
            <button type="button" disabled={!isHydrated} onClick={() => dispatch({ type: "start", rounds: createListeningRounds(pool, Math.random) })} className={`mt-7 ${buttonClass}`}><Headphones size={20} aria-hidden="true" /> Start listening</button>
          </section>
        ) : state.phase === "complete" ? (
          <section aria-labelledby="listening-complete" className="w-full max-w-xl rounded-[32px] border border-[#eeeaf7] bg-white p-6 text-center shadow-lg sm:p-9">
            <ThreeDIcon name="trophy" size={112} className="mx-auto" />
            <h2 id="listening-complete" className="mt-5 text-3xl font-black">{state.correct >= 3 ? "Amazing listening!" : "Every listen helps you learn!"}</h2>
            <p className="mt-3 font-bold text-[#777184]">You matched {state.correct} of 5 words. Keep those curious ears listening!</p>
            <dl className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-3xl bg-[#fff3d4] p-4"><dt className="text-sm font-bold text-[#80612e]">Stars earned</dt><dd className="mt-1 text-3xl font-black text-[#976918]">{stars}</dd></div>
              <div className="rounded-3xl bg-[#eeeaff] p-4"><dt className="text-sm font-bold text-[#736399]">Accuracy</dt><dd className="mt-1 text-3xl font-black text-[#604ac5]">{state.correct * 20}%</dd></div>
            </dl>
            <p className="mt-5 text-sm font-bold text-[#777184]">Finish or play again to save your stars on this device.</p>
            {saveError && <p role="alert" className="mt-3 text-sm font-bold text-rose-800">We couldn&apos;t save your stars. Check browser storage permissions and try again. Your score is still here.</p>}
            <button type="button" disabled={!isHydrated} onClick={finish} className={`mt-6 w-full ${buttonClass}`}>Finish &amp; Return Home <ArrowRight size={19} aria-hidden="true" /></button>
            <button type="button" disabled={!isHydrated} onClick={playAgain} className="mt-3 min-h-12 rounded-2xl px-5 font-extrabold text-[#6952bc] disabled:opacity-50">Save &amp; play again</button>
          </section>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={state.roundIndex} initial={reduceMotion ? false : { opacity: 0, x: 25 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0, x: -25 }} transition={{ duration: 0.2 }} className="flex w-full justify-center">
              <ListenGuessStep word={round.word} options={round.options} selected={state.answer || null} checked={checked} onSelect={(answer) => dispatch({ type: "answer", answer })} />
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {(state.phase === "answering" || checked) && (
        <footer className={`sticky bottom-0 z-10 border-t pb-[env(safe-area-inset-bottom)] ${checked ? state.wasCorrect ? "border-emerald-300 bg-emerald-100" : "border-rose-200 bg-[#fff0ee]" : "border-[#eeedf2] bg-white"}`}>
          <motion.div key={`${state.roundIndex}-${checked}`} initial={reduceMotion ? false : { opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="mx-auto flex max-w-4xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div role="status">
              <p className={`text-lg font-black ${checked ? state.wasCorrect ? "text-emerald-800" : "text-[#a53842]" : "text-[#777184]"}`}>{checked ? state.wasCorrect ? "Awesome! +2 stars! 🌟" : "A new word to remember!" : "Listen. Pick a picture. Trust your ears!"}</p>
              {checked && !state.wasCorrect && <p className="mt-1 text-sm font-bold text-[#a34850]">The correct match is <span lang="ru">{round.word.russian}</span>. Let&apos;s keep going!</p>}
            </div>
            <button type="button" data-sound={checked ? undefined : "off"} disabled={!checked && !state.answer} onClick={checked ? () => dispatch({ type: "next" }) : check} className={`shrink-0 sm:min-w-44 ${buttonClass}`}>{checked ? "Continue" : "Check Answer"}</button>
          </motion.div>
        </footer>
      )}
    </main>
  );
}
