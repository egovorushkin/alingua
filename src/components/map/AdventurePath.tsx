"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { Check, LockKeyhole, X } from "lucide-react";
import Icon3D from "@/components/ui/Icon3D";
import MascotGuide from "@/components/map/MascotGuide";
import { useCurriculum } from "@/context/CurriculumContext";
import { useProgress } from "@/context/ProgressContext";
import useReducedMotion from "@/hooks/useReducedMotion";
import {
  adventureChestReward, getAdventureChapterHeight,
  getAdventureNodes, getAdventurePosition, type AdventureNode,
} from "@/data/adventure";
import { soundFX } from "@/utils/sound";
import { formatCount } from "@/utils/russian";

function PathNode({ node, chapterTitle, ready, reducedMotion, onInteract, topic }: {
  node: AdventureNode; chapterTitle: string; ready: boolean; reducedMotion: boolean;
  onInteract: (node: AdventureNode) => void;
  topic?: { name: string; icon: string; emoji: string };
}) {
  const controls = useAnimationControls();
  if (node.kind === "lesson" && !topic) throw new Error("Adventure lesson is missing its topic.");
  const locked = node.state === "locked";
  const completed = node.state === "completed";
  const active = node.state === "active";
  const boss = node.kind === "boss";
  const name = boss ? "Босс главы" : topic?.name ?? "Сундук";
  const label = boss ? `Босс: ${chapterTitle}` : node.kind === "chest" ? `Сундук: ${chapterTitle}` : name;
  const status = locked ? "Закрыто" : completed ? node.kind === "chest" ? "Награда получена" : "Повторить" : boss ? "Принять вызов" : node.kind === "chest" ? `+${adventureChestReward} звёзд` : "Начать урок";
  const color = locked ? "border-slate-300 bg-slate-200 text-slate-500"
    : boss ? "border-amber-500 bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-950 text-amber-100 shadow-violet-400/50"
      : completed ? "border-emerald-700 bg-emerald-400 text-white"
      : node.kind === "chest" ? "border-amber-600 bg-amber-300 text-amber-950" : "border-violet-800 bg-violet-500 text-white";
  const faceClass = `relative z-10 flex ${boss ? "size-28" : "size-24"} items-center justify-center rounded-full border-b-[9px] shadow-lg outline-offset-8 focus-visible:outline-4 focus-visible:outline-violet-600 ${color}`;
  const face = (
    <>
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-4 top-2 h-6 rounded-full bg-white/20" />
      {locked ? <LockKeyhole size={34} aria-hidden="true" />
        : boss ? <Icon3D name="crown" fallback="👑" size={80} />
          : node.kind === "chest" ? <span aria-hidden="true" className="text-5xl">{completed ? "🎊" : "🎁"}</span>
          : topic && <Icon3D name={topic.icon} fallback={topic.emoji} size={76} />}
      {completed && <span className="absolute -right-1 -top-1 grid size-8 place-items-center rounded-full border-4 border-white bg-emerald-600"><Check size={17} strokeWidth={3} aria-hidden="true" /></span>}
    </>
  );
  function interact() {
    if (locked && !reducedMotion) void controls.start({ x: [0, -8, 8, -5, 5, 0], transition: { duration: 0.35 } });
    onInteract(node);
  }
  return (
    <motion.div animate={controls} whileHover={reducedMotion || locked ? undefined : { scale: 1.05 }} whileTap={reducedMotion ? undefined : { scale: 0.96, y: 4 }} className="relative">
      {active && <motion.span aria-hidden="true" className={`pointer-events-none absolute -inset-3 rounded-full border-4 ${boss || node.kind === "chest" ? "border-amber-300" : "border-violet-300"}`} animate={reducedMotion ? { opacity: 0.5 } : { scale: [1, 1.1, 1], opacity: [0.65, 0.2, 0.65] }} transition={{ duration: 2, repeat: reducedMotion ? 0 : Infinity }} />}
      {boss && <span aria-hidden="true" className="pointer-events-none absolute -top-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-amber-200 px-3 py-1 text-[10px] font-black tracking-widest text-amber-950 shadow">БОСС</span>}
      {node.kind !== "chest" && !locked ? (
        <Link href={`/lesson/${node.topicId}`} aria-label={`${label}: ${status}`} aria-current={active ? "step" : undefined} className={faceClass}>{face}</Link>
      ) : (
        <button type="button" data-sound="off" aria-label={`${label}: ${status}`} aria-disabled={locked || completed} disabled={active && !ready} onClick={interact} className={`${faceClass} disabled:cursor-wait disabled:opacity-60`}>{face}</button>
      )}
      <div className={`pointer-events-none absolute left-1/2 ${boss ? "top-32" : "top-28"} w-32 -translate-x-1/2 rounded-xl bg-white p-1 text-center`}>
        <p className="text-base font-black text-slate-700">{name}</p>
        <p className={`mt-1 text-xs font-extrabold ${active ? "text-violet-700" : "text-slate-500"}`}>{status}</p>
      </div>
    </motion.div>
  );
}

export default function AdventurePath() {
  const { completedTopics, completedBosses, claimedMapChests, claimAdventureChest, isHydrated } = useProgress();
  const { topics, chapters } = useCurriculum();
  const reducedMotion = useReducedMotion();
  const [notice, setNotice] = useState<{ message: string; error: boolean; sequence: number } | null>(null);
  const currentLessonRef = useRef<HTMLLIElement>(null);
  const nodes = getAdventureNodes(completedTopics, claimedMapChests, completedBosses, chapters);
  const groups = chapters.map((chapter) => ({ chapter, nodes: nodes.filter((node) => node.chapterId === chapter.id) }));
  const sizes = groups.map((group) => group.nodes.length);
  const currentIndex = nodes.findIndex((node) => node.kind !== "chest" && node.state === "active");
  const currentLesson = nodes[currentIndex];
  const currentPosition = currentIndex >= 0 ? getAdventurePosition(currentIndex, sizes) : null;
  const height = sizes.reduce((sum, size) => sum + getAdventureChapterHeight(size), 0);
  function announce(message: string, error = false) {
    setNotice((previous) => ({ message, error, sequence: (previous?.sequence ?? 0) + 1 }));
  }
  function interact(node: AdventureNode) {
    if (node.state === "locked") {
      soundFX.playError();
      announce("Сначала заверши предыдущие уроки и испытания. Всё получится!");
    } else if (node.kind === "chest") {
      try {
        const stars = claimAdventureChest(node.chapterId);
        if (stars) {
          soundFX.playSuccess();
          announce(`Сокровище найдено! +${formatCount(stars, "звезда", "звезды", "звёзд")} в твою копилку!`);
        } else announce("Этот сундук уже открыт. Впереди ещё много открытий!");
      } catch {
        announce("Не удалось сохранить награду. Проверь прогресс и попробуй снова.", true);
      }
    }
  }
  return (
    <section aria-labelledby="adventure-heading" className="mx-auto max-w-3xl">
      <div className="mb-6 text-center">
        <h2 id="adventure-heading" className="text-2xl font-black sm:text-3xl">Карта приключений</h2>
        <p className="mt-2 text-sm font-bold text-slate-500">Шаг за шагом к новым словам. В каждом сундуке — {adventureChestReward} звёзд!</p>
        {currentLesson && (
          <button type="button" disabled={!isHydrated} onClick={() => {
            currentLessonRef.current?.querySelector("a")?.focus({ preventScroll: true });
            currentLessonRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
          }} className="mt-3 min-h-11 rounded-xl bg-violet-100 px-4 py-2 text-sm font-black text-violet-800 disabled:opacity-50">
            К текущему уроку
          </button>
        )}
      </div>
      {!groups.length && <p className="rounded-3xl bg-white p-8 text-center font-bold">Новые приключения готовятся. Скоро здесь появятся темы!</p>}
      {groups.length > 0 && <div className="relative rounded-[32px] border border-violet-100 bg-gradient-to-b from-emerald-50/60 via-violet-50/50 to-orange-50/60 py-4 sm:px-8">
        <svg aria-hidden="true" focusable="false" width={260} height={height} viewBox={`0 0 260 ${height}`} className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2">
          {nodes.slice(0, -1).map((node, index) => {
            const from = getAdventurePosition(index, sizes);
            const to = getAdventurePosition(index + 1, sizes);
            const middle = (from.y + to.y) / 2;
            return <path key={node.id} d={`M ${130 + from.x} ${from.y} C ${130 + from.x} ${middle}, ${130 + to.x} ${middle}, ${130 + to.x} ${to.y}`} fill="none" stroke={node.state === "completed" ? "#34d399" : "#cbd5e1"} strokeWidth={10} strokeDasharray="2 17" strokeLinecap="round" />;
          })}
        </svg>
        {isHydrated && currentLesson && currentPosition && (
          <div className="pointer-events-none absolute inset-x-0 top-4 z-20">
            <MascotGuide nodeId={currentLesson.id} position={{ x: currentPosition.x, y: currentPosition.y - (currentLesson.kind === "boss" ? 20 : 0) }} completedCount={completedTopics.length + completedBosses.length} />
          </div>
        )}
        {groups.map(({ chapter, nodes: chapterNodes }, chapterIndex) => (
          <section key={chapter.id} aria-labelledby={`chapter-${chapter.id}`} className="relative" style={{ height: getAdventureChapterHeight(chapterNodes.length) }}>
            <header style={{ backgroundImage: `linear-gradient(135deg, ${chapter.themeColor}, ${chapter.themeColor}cc)` }} className={`relative z-10 mx-3 flex h-28 items-center justify-between gap-3 overflow-hidden rounded-3xl bg-gradient-to-br ${chapter.banner} px-5 py-4 text-white shadow-md sm:mx-0`}>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-white/85">Глава {chapterIndex + 1}</p>
                <h3 id={`chapter-${chapter.id}`} className="mt-1 text-lg font-black sm:text-2xl">{chapter.title}</h3>
                <p className="mt-1 text-sm font-bold text-white/90">{chapter.subtitle}</p>
              </div>
              <span className="hidden shrink-0 sm:block"><Icon3D name={chapter.icon} size={76} /></span>
            </header>
            <motion.div aria-hidden="true" className="pointer-events-none absolute left-1 top-44 opacity-40 sm:left-4" animate={reducedMotion ? undefined : { y: [0, -7, 0], rotate: [-6, 6, -6] }} transition={{ duration: 5, repeat: Infinity }}><Icon3D name="star" size={36} /></motion.div>
            <motion.div aria-hidden="true" className="pointer-events-none absolute right-1 top-72 opacity-30 sm:right-4" animate={reducedMotion ? undefined : { y: [0, 8, 0] }} transition={{ duration: 6, repeat: Infinity }}><Icon3D name={chapter.icon} size={40} /></motion.div>
            <ol aria-label={`Уроки главы ${chapterIndex + 1}`}>
              {chapterNodes.map((node, localIndex) => {
                const chapterStart = sizes.slice(0, chapterIndex).reduce((sum, size) => sum + size, 0);
                const chapterTop = sizes.slice(0, chapterIndex).reduce((sum, size) => sum + getAdventureChapterHeight(size), 0);
                const position = getAdventurePosition(chapterStart + localIndex, sizes);
                const radius = node.kind === "boss" ? 56 : 48;
                return (
                  <li key={node.id} ref={node.id === currentLesson?.id ? currentLessonRef : undefined} data-map-state={node.state} className={`absolute z-10 ${node.kind === "boss" ? "size-28" : "size-24"} -translate-x-1/2`} style={{ left: `calc(50% + ${position.x}px)`, top: position.y - chapterTop - radius }}>
                    <PathNode node={node} chapterTitle={chapter.title} ready={isHydrated} reducedMotion={reducedMotion} onInteract={interact} topic={node.kind === "lesson" ? topics.find((topic) => topic.id === node.topicId) : undefined} />
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>}
      {nodes.length > 0 && nodes.filter((node) => node.kind !== "chest").every((node) => node.state === "completed") && <p className="mt-6 rounded-2xl bg-emerald-100 p-5 text-center font-black text-emerald-800">Все главы пройдены! Короны твои — собери сокровища и повторяй любимые темы.</p>}
      <AnimatePresence>
        {notice && (
          <motion.div key={notice.sequence} initial={reducedMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`fixed inset-x-4 bottom-5 z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl border-2 p-4 shadow-xl ${notice.error ? "border-rose-200 bg-rose-50 text-rose-900" : "border-violet-200 bg-white text-violet-900"}`}>
            <p role={notice.error ? "alert" : "status"} aria-atomic="true" className="flex-1 text-sm font-extrabold">{notice.message}</p>
            <button type="button" onClick={() => setNotice(null)} aria-label="Закрыть подсказку" className="grid min-h-11 min-w-11 place-items-center rounded-xl bg-violet-100 text-violet-800"><X size={20} aria-hidden="true" /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
