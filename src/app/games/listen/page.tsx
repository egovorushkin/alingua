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
import { formatCount } from "@/utils/russian";

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
        <nav aria-label="Навигация аудиоигры" className="flex items-center justify-between gap-3">
          <Link href="/" aria-label="Закрыть игру и вернуться на главную" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[#797387] hover:bg-[#efedf5]"><X size={25} aria-hidden="true" /></Link>
          <h1 className="text-center text-xl font-black text-[#604ac5] sm:text-2xl">Слушай и угадывай</h1>
          <SoundToggle />
        </nav>
        {state.phase !== "ready" && (
          <div className="mt-4">
            <div className="mb-2 flex justify-between gap-3 text-sm font-extrabold">
              <p role="status">{state.phase === "complete" ? "Игра завершена!" : `Раунд ${state.roundIndex + 1} из 5`}</p>
              <p className="text-[#976918]"><span aria-hidden="true">⭐</span> {formatCount(stars, "звезда", "звезды", "звёзд")}</p>
            </div>
            <div role="progressbar" aria-label="Прогресс аудиоигры" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={5} className="h-3 overflow-hidden rounded-full bg-[#eae8f0]">
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
            <h2 id="listening-intro" className="mt-5 text-3xl font-black">Проверим твой слух?</h2>
            <p className="mt-3 font-bold leading-relaxed text-[#777184]">Пять слов-сюрпризов. Слушай, выбирай картинку и получай 2 звезды за каждый верный ответ!</p>
            <p className="mt-3 text-sm font-bold text-[#777184]">Нужно помедленнее? Нажми на кнопку с черепашкой.</p>
            <button type="button" disabled={!isHydrated} onClick={() => dispatch({ type: "start", rounds: createListeningRounds(pool, Math.random) })} className={`mt-7 ${buttonClass}`}><Headphones size={20} aria-hidden="true" /> Начать игру</button>
          </section>
        ) : state.phase === "complete" ? (
          <section aria-labelledby="listening-complete" className="w-full max-w-xl rounded-[32px] border border-[#eeeaf7] bg-white p-6 text-center shadow-lg sm:p-9">
            <ThreeDIcon name="trophy" size={112} className="mx-auto" />
            <h2 id="listening-complete" className="mt-5 text-3xl font-black">{state.correct >= 3 ? "Отличный слух!" : "С каждым разом всё лучше!"}</h2>
            <p className="mt-3 font-bold text-[#777184]">Верных ответов: {state.correct} из 5. Продолжай слушать и открывать новые слова!</p>
            <dl className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-3xl bg-[#fff3d4] p-4"><dt className="text-sm font-bold text-[#80612e]">Звёзды</dt><dd className="mt-1 text-3xl font-black text-[#976918]">{stars}</dd></div>
              <div className="rounded-3xl bg-[#eeeaff] p-4"><dt className="text-sm font-bold text-[#736399]">Точность</dt><dd className="mt-1 text-3xl font-black text-[#604ac5]">{state.correct * 20}%</dd></div>
            </dl>
            <p className="mt-5 text-sm font-bold text-[#777184]">Заверши игру или сыграй ещё, чтобы сохранить звёзды на этом устройстве.</p>
            {saveError && <p role="alert" className="mt-3 text-sm font-bold text-rose-800">Не получилось сохранить звёзды. Попроси взрослого проверить настройки браузера и попробуй снова. Твой результат пока здесь.</p>}
            <button type="button" disabled={!isHydrated} onClick={finish} className={`mt-6 w-full ${buttonClass}`}>Готово! На главную <ArrowRight size={19} aria-hidden="true" /></button>
            <button type="button" disabled={!isHydrated} onClick={playAgain} className="mt-3 min-h-12 rounded-2xl px-5 font-extrabold text-[#6952bc] disabled:opacity-50">Сохранить и сыграть ещё</button>
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
              <p className={`text-lg font-black ${checked ? state.wasCorrect ? "text-emerald-800" : "text-[#a53842]" : "text-[#777184]"}`}>{checked ? state.wasCorrect ? "Отлично! +2 звезды! 🌟" : "Ещё одно слово для твоей коллекции!" : "Послушай и выбери картинку. У тебя получится!"}</p>
              {checked && !state.wasCorrect && <p className="mt-1 text-sm font-bold text-[#a34850]">Верный ответ: {round.word.russian}. Продолжаем!</p>}
            </div>
            <button type="button" data-sound={checked ? undefined : "off"} disabled={!checked && !state.answer} onClick={checked ? () => dispatch({ type: "next" }) : check} className={`shrink-0 sm:min-w-44 ${buttonClass}`}>{checked ? "Дальше" : "Проверить"}</button>
          </motion.div>
        </footer>
      )}
    </main>
  );
}
