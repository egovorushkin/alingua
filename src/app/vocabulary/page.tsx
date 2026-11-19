"use client";

import Link from "next/link";
import { useId, useState, useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Search, SearchX, X } from "lucide-react";
import BentoCard from "@/components/BentoCard";
import { SoundToggle } from "@/components/SoundControls";
import ThreeDIcon from "@/components/ThreeDIcon";
import VocabularyCard from "@/components/vocabulary/VocabularyCard";
import { useProgress } from "@/context/ProgressContext";
import { useCurriculum } from "@/context/CurriculumContext";
import { soundFX } from "@/utils/sound";
import { speakWord } from "@/utils/speech";
import { filterVocabulary } from "@/utils/vocabulary";
import { formatCount } from "@/utils/russian";

export default function VocabularyPage() {
  const { lessons } = useCurriculum();
  const vocabulary = lessons.flatMap((topic) => topic.words.map((word) => ({ topic, word })));
  const filters = [{ id: "all", title: "Все" }, ...lessons];
  const { completedTopics, error, isHydrated } = useProgress();
  const [query, setQuery] = useState("");
  const [topicId, setTopicId] = useState("all");
  const [speechError, setSpeechError] = useState(false);
  const muted = useSyncExternalStore(soundFX.subscribe, soundFX.isMuted, () => false);
  const reduceMotion = useReducedMotion();
  const searchId = useId();
  const masteredCount = vocabulary.filter(({ topic }) => completedTopics.includes(topic.id)).length;
  const activeTopic = filters.some((filter) => filter.id === topicId) ? topicId : "all";
  const visibleEntries = filterVocabulary(vocabulary, completedTopics, query, activeTopic);

  function listen(word: string) {
    setSpeechError(false);
    if (!speakWord(word, () => setSpeechError(true))) setSpeechError(true);
  }

  return (
    <main className="mx-auto max-w-7xl px-5 pb-16 pt-5 sm:px-8 sm:pt-8 lg:px-12">
      <nav aria-label="Навигация копилки слов" className="mb-7 flex items-center justify-between gap-4">
        <Link href="/" className="inline-flex min-h-12 items-center gap-2 rounded-xl px-2 text-sm font-extrabold text-[#6952bc] transition-transform motion-safe:hover:-translate-x-1">
          <ArrowLeft size={18} aria-hidden="true" /> На главную
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/profile" className="inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-extrabold text-[#6952bc]">Мой профиль</Link>
          <SoundToggle />
        </div>
      </nav>
      {error && <p role="alert" className="mb-5 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-800">{error}</p>}

      <BentoCard className="relative overflow-hidden bg-gradient-to-br from-[#8069e9] to-[#5945bb] p-6 text-white sm:p-8">
        <div aria-hidden="true" className="absolute -right-14 -top-20 h-64 w-64 rounded-full border-[35px] border-white/5" />
        <div className="relative flex items-center justify-between gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-widest text-white/80">Новые слова пополняют коллекцию</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Копилка слов <span aria-hidden="true">📚</span></h1>
            <p className="mt-3 max-w-lg text-sm font-bold leading-relaxed text-white/85 sm:text-base">Твои слова — маленькие сокровища. Возвращайся, чтобы читать, слушать и повторять!</p>
            <dl className="mt-6 grid max-w-md grid-cols-2 gap-3" aria-busy={!isHydrated}>
              <div className="rounded-2xl bg-white/15 p-4">
                <dt className="text-sm font-extrabold text-white/85">Изучено слов</dt>
                <dd className="mt-1 text-3xl font-black">{isHydrated ? masteredCount : "..."}</dd>
              </div>
              <div className="rounded-2xl bg-white/15 p-4">
                <dt className="text-sm font-extrabold text-white/85">Пока закрыто</dt>
                <dd className="mt-1 text-3xl font-black">{isHydrated ? vocabulary.length - masteredCount : "..."}</dd>
              </div>
            </dl>
          </div>
          <ThreeDIcon name="notebook" size={160} loading="eager" className="hidden drop-shadow-xl md:block" />
        </div>
      </BentoCard>

      <section aria-label="Найди свои слова" className="mt-6">
        <BentoCard className="border border-[#eeeaf7] bg-white p-5 sm:p-6">
          <label htmlFor={searchId} className="text-sm font-black text-[#6952bc]">Поиск среди изученных слов</label>
          <div className="relative mt-2">
            <Search size={22} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9b91bd]" />
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Например, cat или кошка..."
              className="min-h-14 w-full rounded-2xl border-2 border-[#e8e1f7] bg-[#faf8ff] pl-12 pr-14 text-base font-bold placeholder:text-[#9b91bd] [&::-webkit-search-cancel-button]:appearance-none"
            />
            {query && (
              <button type="button" aria-label="Очистить поиск" onClick={() => setQuery("")} className="absolute right-1 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-xl text-[#6952bc]">
                <X size={20} aria-hidden="true" />
              </button>
            )}
          </div>
          <div role="group" aria-label="Фильтр по темам" className="mt-4 flex gap-2 overflow-x-auto px-1 pb-2 pt-1">
            {filters.map((filter) => (
              <motion.button
                key={filter.id}
                type="button"
                aria-pressed={activeTopic === filter.id}
                onClick={() => setTopicId(filter.id)}
                whileTap={{ scale: reduceMotion ? 1 : 0.94 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className={`min-h-12 shrink-0 rounded-full border-b-4 px-5 text-sm font-black transition-colors ${topicId === filter.id ? "border-[#5843b8] bg-[#745ce4] text-white" : "border-[#e8e1f7] bg-[#f5f2fc] text-[#6952bc] hover:bg-[#eeeaff]"}`}
              >
                {filter.title}
              </motion.button>
            ))}
          </div>
        </BentoCard>
      </section>

      <section aria-labelledby="collection-heading" className="mt-8" aria-busy={!isHydrated}>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h2 id="collection-heading" className="text-2xl font-black">Твоя коллекция</h2>
          <p role="status" className="text-sm font-extrabold text-[#777184]">{isHydrated ? `В коллекции: ${formatCount(visibleEntries.length, "слово", "слова", "слов")}` : "Загружаем твою коллекцию..."}</p>
        </div>
        <p className="mb-4 text-sm font-bold text-[#777184]">Пройди тему, чтобы открыть её слова. Слушай и повторяй их когда захочешь.</p>
        {muted && <p role="status" className="mb-4 rounded-2xl bg-[#fff5d8] p-4 text-sm font-bold text-[#8b6520]">Звук выключен. Включи его кнопкой вверху, чтобы послушать.</p>}
        {speechError && <p role="status" className="mb-4 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-800">Сейчас не получается включить произношение. Ты всё равно можешь читать слова!</p>}
        {!isHydrated ? (
          <p role="status" className="rounded-3xl bg-white p-8 text-center font-extrabold text-[#6952bc]">Открываем твою копилку...</p>
        ) : visibleEntries.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleEntries.map((entry) => (
              <VocabularyCard key={`${entry.topic.id}:${entry.word.id}`} entry={entry} mastered={completedTopics.includes(entry.topic.id)} muted={muted} onListen={listen} />
            ))}
          </div>
        ) : (
          <BentoCard className="flex flex-col items-center border border-[#eeeaf7] bg-white p-8 text-center">
            <SearchX size={44} className="text-[#9b91bd]" aria-hidden="true" />
            <h3 className="mt-4 text-xl font-black">Слова не найдены</h3>
            <p className="mt-2 max-w-md text-sm font-bold leading-relaxed text-[#777184]">Попробуй другое слово на русском или английском. Пройди урок, чтобы открыть новые сокровища.</p>
            <button type="button" onClick={() => { setQuery(""); setTopicId("all"); }} className="mt-5 min-h-12 rounded-2xl border-b-4 border-[#5843b8] bg-[#745ce4] px-5 font-black text-white transition-transform motion-safe:active:scale-95">Показать все слова</button>
          </BentoCard>
        )}
      </section>
    </main>
  );
}
