"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";
import { ArrowRight, Heart, Sparkles, X } from "lucide-react";
import { useEffect, useId, useReducer, useRef, useState, type ReactNode } from "react";
import type { TopicData } from "@/data/lessons";
import { useProgress } from "@/context/ProgressContext";
import { soundFX } from "@/utils/sound";
import { cancelSpeech } from "@/utils/speech";
import { formatCount } from "@/utils/russian";
import { SoundToggle } from "@/components/SoundControls";
import Flashcard from "./Flashcard";
import QuizStep from "./QuizStep";
import ListenGuessStep from "./ListenGuessStep";
import WordScramble from "./WordScramble";
import { createLesson, lessonReducer, lessonResult } from "./lesson-state";

const buttonClass = "min-h-14 rounded-2xl border-b-4 border-[#5843b8] bg-[#745ce4] px-6 py-3 font-black text-white hover:bg-[#654dce] disabled:cursor-not-allowed disabled:border-[#dfdde6] disabled:bg-[#ecebf0] disabled:text-[#a7a3b2]";

function LessonStage({ children, onEnter }: { children: ReactNode; onEnter: () => void }) {
  const present = useIsPresent();
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      inert={!present}
      initial={reduceMotion ? false : { opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, x: -30 }}
      transition={{ duration: 0.2 }}
      onAnimationComplete={() => { if (present) onEnter(); }}
      className="flex w-full flex-col items-center"
    >
      {children}
    </motion.div>
  );
}

export default function Lesson({ lesson }: { lesson: TopicData }) {
  const [state, dispatch] = useReducer(lessonReducer, lesson.words, createLesson);
  const [saveError, setSaveError] = useState(false);
  const { saveLessonResult, isHydrated } = useProgress();
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const scrambleFormId = useId();
  const step = state.steps[state.stepIndex];
  const complete = step.kind === "complete";
  const learning = step.kind === "learn";
  const checked = state.phase === "feedback";
  const result = lessonResult(state);
  const completedSteps = state.stepIndex + Number(learning ? state.revealed : checked && (state.wasCorrect || step.kind === "listen"));
  const progress = Math.round((completedSteps / (state.steps.length - 1)) * 100);
  const blocked = learning ? !state.revealed : !state.answer.trim();
  const correctAnswer = step.kind === "complete" || learning ? "" : step.kind === "scramble" ? step.word.english : step.word.russian;

  useEffect(() => {
    cancelSpeech();
  }, [state.stepIndex, state.phase]);

  useEffect(() => cancelSpeech, []);

  useEffect(() => {
    if (state.phase === "retry") dialog.current?.showModal();
    else dialog.current?.close();
  }, [state.phase]);

  function finish() {
    try {
      saveLessonResult(lesson.id, lesson.words.length, { ...result, soundCheck: !soundFX.isMuted() });
    } catch {
      setSaveError(true);
      return;
    }
    router.push("/");
  }

  function act() {
    if (learning || checked) {
      dispatch({ type: "next" });
      return;
    }
    const nextState = lessonReducer(state, { type: "check" });
    if (nextState === state) return;
    if (nextState.wasCorrect) soundFX.playSuccess();
    else soundFX.playError();
    dispatch({ type: "check" });
  }

  function revealWord() {
    if (state.stepIndex === 0 && !state.revealed) {
      // Randomize after a user gesture, not during prerendering or hydration.
      dispatch({ type: "shuffle", steps: createLesson(lesson.words, Math.random).steps });
    }
    dispatch({ type: "reveal" });
  }

  return (
    <main className="flex min-h-dvh flex-col overflow-x-clip bg-[#faf9f6]">
      <header className="mx-auto w-full max-w-4xl px-5 py-5 sm:px-8 sm:py-7">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" aria-label="Закрыть урок и вернуться на главную" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[#797387] transition-colors hover:bg-[#efedf5]"><X size={25} aria-hidden="true" /></Link>
          <div className="h-4 flex-1 overflow-hidden rounded-full bg-[#eae8f0]" role="progressbar" aria-label="Прогресс урока" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <motion.div className="h-full rounded-full" style={{ backgroundColor: lesson.themeColor }} initial={false} animate={{ width: `${progress}%` }} transition={{ duration: reduceMotion ? 0 : 0.45, ease: "easeOut" }} />
          </div>
          <div className="flex min-w-14 items-center justify-center gap-1.5 text-lg font-black text-[#c54858]" aria-label={formatCount(state.lives, "жизнь", "жизни", "жизней")}><Heart size={23} fill="currentColor" aria-hidden="true" />{state.lives}</div>
          <SoundToggle />
        </div>
        <div className="mt-3 flex justify-end gap-4 text-sm font-extrabold">
          <p className="text-[#976918]" aria-label={formatCount(state.bonusStars, "бонусная звезда", "бонусные звезды", "бонусных звёзд")}><span aria-hidden="true">⭐</span> Бонус: {state.bonusStars}</p>
          <p className="text-[#604ac5]" aria-label={formatCount(result.xp, "очко опыта", "очка опыта", "очков опыта")}>Опыт: {result.xp}</p>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-5 py-6 sm:px-8">
        <AnimatePresence mode="wait" initial={false}>
          <LessonStage
            key={state.stepIndex}
            onEnter={() => heading.current?.focus({ preventScroll: true })}
          >
            {complete ? (
              <div className="text-center">
                <motion.div animate={reduceMotion ? undefined : { y: [0, -12, 0] }} transition={{ duration: 0.8, repeat: 2 }} className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#fff1c8] text-6xl" aria-hidden="true">🏆</motion.div>
                <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-[#7560b7]">Приключение завершено</p>
                <h1 ref={heading} tabIndex={-1} className="mt-2 text-3xl font-black tracking-tight outline-none sm:text-4xl">Ура, получилось!</h1>
                <p className="mt-3 font-bold text-[#706a81]">Все слова по теме «{lesson.title}» теперь знакомы. Отличная работа!</p>
                <div className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-3">
                  <div className="rounded-3xl bg-[#fff3d4] p-4"><span className="text-2xl" aria-hidden="true">⭐</span><p className="mt-2 text-xl font-black text-[#976918]">{result.stars + result.bonusStars}</p><p className="text-xs font-bold text-[#80612e]">Звёзды</p></div>
                  <div className="rounded-3xl bg-[#eeeaff] p-4"><span className="text-2xl" aria-hidden="true">⚡</span><p className="mt-2 text-xl font-black text-[#604ac5]">{result.xp}</p><p className="text-xs font-bold text-[#736399]">Опыт</p></div>
                  <div className="rounded-3xl bg-[#e4f6ed] p-4"><span className="text-2xl" aria-hidden="true">🎯</span><p className="mt-2 text-xl font-black text-[#31845e]">{result.accuracy}%</p><p className="text-xs font-bold text-[#4c755d]">Точность</p></div>
                </div>
                <p className="mt-5 text-sm font-bold text-[#777184]">Заверши урок, чтобы сохранить лучший результат на этом устройстве.</p>
                {saveError && <p role="alert" className="mx-auto mt-3 max-w-md text-sm font-bold text-red-700">Не получилось сохранить прогресс. Попроси взрослого проверить настройки браузера и попробуй снова. Твой результат пока здесь.</p>}
                <motion.button type="button" disabled={!isHydrated} whileTap={reduceMotion ? undefined : { scale: 0.96 }} onClick={finish} className={`mt-7 inline-flex items-center justify-center gap-2 ${buttonClass}`}>Готово! На главную <ArrowRight size={19} aria-hidden="true" /></motion.button>
              </div>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#7560b7]">{lesson.title} · {learning ? "Знакомство" : step.kind === "quiz" ? "Практика" : step.kind === "listen" ? "Слушай и угадывай" : "Собери слово"}</p>
                  <h1 ref={heading} tabIndex={-1} className="mt-2 text-2xl font-black tracking-tight outline-none sm:text-3xl">{learning ? "Познакомься с новым словом!" : step.kind === "quiz" ? "Покажи свои знания!" : step.kind === "listen" ? "Доверься своим ушам!" : "Собери слово!"}</h1>
                  <p className="mt-1 text-sm font-bold text-[#777184]">Шаг {state.stepIndex + 1} из {state.steps.length - 1}</p>
                </div>
                {step.kind === "learn" ? (
                  <Flashcard word={step.word} revealed={state.revealed} onReveal={revealWord} />
                ) : step.kind === "quiz" ? (
                  <QuizStep word={step.word} options={step.options} selected={state.answer || null} checked={checked} onSelect={(answer) => dispatch({ type: "answer", answer })} />
                ) : step.kind === "listen" ? (
                  <ListenGuessStep word={step.word} options={step.options} selected={state.answer || null} checked={checked} onSelect={(answer) => dispatch({ type: "answer", answer })} />
                ) : (
                  <WordScramble word={step.word} letters={step.letters} formId={scrambleFormId} answer={state.answer} checked={checked} onAnswer={(answer) => dispatch({ type: "answer", answer })} onSuccess={act} onFail={act} />
                )}
              </>
            )}
          </LessonStage>
        </AnimatePresence>
      </div>

      {!complete && (
        <footer className={`sticky bottom-0 z-10 border-t pb-[env(safe-area-inset-bottom)] ${checked ? state.wasCorrect ? "border-emerald-300 bg-emerald-100" : "border-rose-200 bg-[#fff0ee]" : "border-[#eeedf2] bg-white"}`}>
          <motion.div key={`${state.stepIndex}-${checked}`} initial={state.stepIndex === 0 || reduceMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="mx-auto flex max-w-4xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            {checked ? (
              <div role="status" aria-atomic="true">
                <p className={`text-xl font-black ${state.wasCorrect ? "text-emerald-800" : "text-[#a53842]"}`}>{state.wasCorrect ? "Отлично! 🎉" : "Ошибки помогают учиться! 💪"}</p>
                <p className={`mt-1 text-sm font-bold ${state.wasCorrect ? "text-emerald-800" : "text-[#a34850]"}`}>{state.wasCorrect ? "Всё верно!" : <>Верный ответ: <span lang={step.kind === "scramble" ? "en" : "ru"}>{correctAnswer}</span>. {step.kind === "listen" ? "Продолжаем!" : "Попробуем ещё раз."}</>}</p>
                {state.wasCorrect && (step.kind === "scramble" || step.kind === "listen") && (
                  <motion.p initial={reduceMotion ? false : { scale: 0.7, y: 8 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 350, damping: 14 }} className="mt-2 inline-flex rounded-full bg-amber-100 px-4 py-2 font-black text-amber-900">⭐ +2 бонусные звезды!</motion.p>
                )}
              </div>
            ) : (
              <p className="flex items-center gap-2 text-sm font-bold text-[#777184]"><Sparkles size={17} className="shrink-0 text-[#8470c5]" aria-hidden="true" />{learning ? "Нажми на карточку, чтобы узнать перевод." : "Не торопись. У тебя всё получится!"}</p>
            )}
            <motion.button type={step.kind === "scramble" && !checked ? "submit" : "button"} form={step.kind === "scramble" && !checked ? scrambleFormId : undefined} data-sound={learning || checked ? undefined : "off"} whileTap={{ scale: reduceMotion ? 1 : 0.96 }} onClick={step.kind === "scramble" && !checked ? undefined : act} disabled={state.phase === "retry" || (!checked && blocked)} className={`shrink-0 sm:min-w-44 ${buttonClass}`}>
              {checked && !state.wasCorrect ? "Понятно" : learning || checked ? "Дальше" : "Проверить"}
            </motion.button>
          </motion.div>
        </footer>
      )}

      <dialog ref={dialog} onCancel={(event) => event.preventDefault()} aria-labelledby="retry-title" aria-describedby="retry-description" className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-md rounded-[32px] border-0 bg-white p-7 text-center shadow-2xl backdrop:bg-[#252039]/50">
        <span className="text-6xl" aria-hidden="true">🦊</span>
        <h2 id="retry-title" className="mt-5 text-2xl font-black">Каждому исследователю нужен отдых!</h2>
        <p id="retry-description" className="mt-3 font-bold text-[#777184]">Давай повторим слова ещё раз. Начни с 3 сердечками — у тебя всё получится!</p>
        <button type="button" autoFocus onClick={() => dispatch({ type: "retry" })} className={`mt-6 w-full ${buttonClass}`}>Попробовать снова</button>
        <Link href="/" className="mt-3 inline-flex min-h-12 items-center justify-center rounded-xl px-4 font-extrabold text-[#6952bc]">Сделать перерыв</Link>
      </dialog>
    </main>
  );
}
