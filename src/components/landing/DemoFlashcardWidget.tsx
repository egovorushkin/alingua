"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { LayoutGroup, motion, useAnimate } from "framer-motion";
import { ArrowRight, Check, Layers, RotateCw, Sparkles, Target, Volume2 } from "lucide-react";
import ConfettiBurst from "@/components/gamification/ConfettiBurst";
import { SoundToggle } from "@/components/SoundControls";
import Icon3D from "@/components/ui/Icon3D";
import { lessons } from "@/data/lessons";
import useReducedMotion from "@/hooks/useReducedMotion";
import { soundFX } from "@/utils/sound";
import { cancelSpeech, speakWord } from "@/utils/speech";
import EntryLink from "./EntryLink";

const deck = lessons.filter(({ id }) => id === "space").flatMap(({ words }) => words);
const spaceArt = new Set(["star.webp", "rocket.webp"]);
const modes = [
  { id: "card", label: "Карточка", icon: Layers },
  { id: "quiz", label: "Угадай перевод", icon: Target },
] as const;
type Mode = (typeof modes)[number]["id"];

function DemoRound({ index, mode, onWin }: { index: number; mode: Mode; onWin: () => void }) {
  const word = deck[index];
  const [flipped, setFlipped] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [speechError, setSpeechError] = useState(false);
  const ownsSpeech = useRef(false);
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reducedMotion = useReducedMotion();
  const muted = useSyncExternalStore(soundFX.subscribe, soundFX.isMuted, () => false);
  const correct = answer === word.id;
  const choices = [deck[(index + 1) % deck.length], deck[(index + 2) % deck.length]];
  choices.splice(index % 3, 0, word);

  useEffect(() => () => {
    if (ownsSpeech.current) cancelSpeech();
  }, []);

  function listen() {
    setSpeechError(false);
    ownsSpeech.current = speakWord(word.english, () => setSpeechError(true), {
      onEnd: () => { ownsSpeech.current = false; },
    });
    if (!ownsSpeech.current) setSpeechError(true);
  }

  const wordFace = (
    <>
      <Icon3D name={spaceArt.has(word.icon) ? word.icon : ""} fallback={word.emoji} size={76} className="drop-shadow-md" />
      <span lang="en" className="text-3xl font-black tracking-tight">{word.english}</span>
    </>
  );

  return (
    <div ref={scope} className="relative mt-3">
      {mode === "card" ? (
        <button type="button" aria-pressed={flipped} aria-label={`Перевод слова ${word.english}`} onClick={() => setFlipped(!flipped)} className="block w-full rounded-2xl [perspective:900px]">
          <motion.span
            aria-hidden="true"
            initial={false}
            animate={{ rotateY: flipped && !reducedMotion ? 180 : 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.4 }}
            className="grid min-h-44 [transform-style:preserve-3d]"
          >
            <span className={`col-start-1 row-start-1 flex flex-col items-center justify-center gap-1 rounded-2xl bg-[#eee6ff] px-3 py-4 [backface-visibility:hidden] ${flipped && reducedMotion ? "invisible" : ""}`}>
              {wordFace}
              <span className="flex items-center gap-1 text-sm font-bold text-violet-800"><RotateCw size={15} /> Нажми, чтобы перевернуть</span>
            </span>
            <span className={`col-start-1 row-start-1 flex flex-col items-center justify-center gap-2 rounded-2xl bg-[#e2f5eb] px-3 py-4 text-emerald-950 [backface-visibility:hidden] ${reducedMotion ? (flipped ? "" : "invisible") : "[transform:rotateY(180deg)]"}`}>
              <span className="text-3xl font-black">{word.russian}</span>
              <span lang="en" className="text-sm font-bold">{word.exampleSentence}</span>
            </span>
          </motion.span>
        </button>
      ) : (
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-[#eee6ff] px-3 py-3">{wordFace}</div>
      )}
      <div className="mt-2 flex justify-center">
        <button type="button" disabled={muted} onClick={listen} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-100 px-4 font-black text-violet-900 motion-safe:active:scale-95 disabled:opacity-60">
          <Volume2 size={18} aria-hidden="true" /> Послушать
        </button>
      </div>
      {speechError && !muted && <p role="status" className="mt-1 text-center text-sm font-bold text-violet-900">Озвучка сейчас недоступна. Можно прочитать слово!</p>}
      {mode === "card" ? (
        <p role="status" className="sr-only">{flipped ? word.russian : word.english}</p>
      ) : (
        <>
          <div role="group" aria-label="Выбери перевод" className="mt-3 grid gap-2 sm:grid-cols-3">
            {choices.map((choice) => {
              const picked = answer === choice.id;
              return (
                <button key={choice.id} type="button" aria-disabled={correct || undefined} onClick={(event) => {
                  if (correct) return;
                  setAnswer(choice.id);
                  if (choice.id === word.id) {
                    soundFX.playSuccess();
                    onWin();
                  } else {
                    soundFX.playError();
                    if (!reducedMotion) void animate(event.currentTarget, { x: [0, -4, 4, -2, 0] }, { duration: 0.26 });
                  }
                }} className={`flex min-h-12 items-center justify-center gap-1 rounded-xl border-b-4 px-2 py-2 font-black ${picked ? correct ? "border-emerald-800 bg-emerald-700 text-white" : "border-rose-300 bg-rose-100 text-rose-900" : "border-violet-200 bg-white text-violet-950 enabled:hover:bg-violet-50"}`}>
                  {picked && correct && <Check size={17} aria-hidden="true" />}
                  {choice.russian}
                </button>
              );
            })}
          </div>
          <p role="status" className={`mt-2 min-h-7 text-center text-sm font-black ${correct ? "rounded-full bg-emerald-100 py-1 text-emerald-900" : "text-violet-900"}`}>
            {correct ? "Здорово! Ты угадал! 🌟" : answer ? "Почти! Попробуй другой вариант." : "Как переводится это слово?"}
          </p>
          {correct && !reducedMotion && <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden"><ConfettiBurst count={12} /></div>}
        </>
      )}
    </div>
  );
}

export default function DemoFlashcardWidget() {
  const id = useId();
  const [mode, setMode] = useState<Mode>("card");
  const [index, setIndex] = useState(0);
  const [hasWon, setHasWon] = useState(false);
  const reducedMotion = useReducedMotion();

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="rounded-3xl border border-violet-100 bg-[#f7f3ff] p-3 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-black text-violet-900">Слово {index + 1} из {deck.length}</p>
          <SoundToggle />
        </div>
        <LayoutGroup id={id}>
          <div role="group" aria-label="Режим игры" className="mt-2 grid grid-cols-2 gap-1 rounded-2xl bg-violet-100 p-1">
            {modes.map(({ id, label, icon: ModeIcon }) => (
              <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)} className="relative isolate flex min-h-12 items-center justify-center gap-1.5 rounded-xl px-1 text-sm font-black text-violet-950">
                {mode === id && <motion.span aria-hidden="true" layoutId={reducedMotion ? undefined : "demo-mode"} className="absolute inset-0 -z-10 rounded-xl bg-white shadow-sm" />}
                <ModeIcon size={17} className="shrink-0" aria-hidden="true" /> {label}
              </button>
            ))}
          </div>
        </LayoutGroup>
        <DemoRound key={`${mode}-${index}`} index={index} mode={mode} onWin={() => setHasWon(true)} />
        <button type="button" onClick={() => setIndex((index + 1) % deck.length)} className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-violet-200 px-3 font-black text-violet-900 hover:bg-violet-100 motion-safe:active:scale-95">
          Следующее слово <ArrowRight size={17} aria-hidden="true" />
        </button>
      </div>
      <EntryLink href="/lesson/animals" className={`mt-4 flex min-h-14 items-center justify-center gap-2 rounded-2xl border-b-4 border-violet-900 bg-[#6741be] px-4 py-2 text-center font-black text-white hover:bg-[#5834ad] motion-safe:transition motion-safe:active:scale-95 ${hasWon ? "ring-4 ring-amber-300 ring-offset-2" : ""}`}>
        <Sparkles size={19} className={hasWon ? "shrink-0 text-amber-200" : "shrink-0"} aria-hidden="true" /> Начать большое приключение
      </EntryLink>
    </div>
  );
}
