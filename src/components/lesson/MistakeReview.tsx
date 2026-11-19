"use client";

import Link from "next/link";
import { useState } from "react";
import { useCurriculum } from "@/context/CurriculumContext";
import { useProgress } from "@/context/ProgressContext";
import type { WordItem } from "@/data/lessons";
import Lesson from "./Lesson";

function ReviewSession({ ids, pool }: { ids: string[]; pool: WordItem[] }) {
  // Keep the queue stable while each correct answer removes an ID from global progress.
  const [session] = useState(() => ({
    words: pool.filter((word) => ids.includes(word.id)),
    unavailable: ids.filter((id) => !pool.some((word) => word.id === id)).length,
  }));
  const unavailable = session.unavailable > 0;
  const notice = "Некоторые слова сейчас скрыты или изменились в каталоге. Они останутся в списке до возвращения этих материалов.";
  if (!session.words.length) return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-5 py-10 text-center">
      <span aria-hidden="true" className="text-7xl">{unavailable ? "📚" : "🌟"}</span>
      <h1 className="mt-6 text-3xl font-black">{unavailable ? "Пока нет доступных слов для тренировки" : "Ни одного трудного слова!"}</h1>
      <p className="mt-4 font-bold text-slate-600">{unavailable ? notice : "Ты суперзвезда! Если встретится трудное слово, мы повторим его вместе."}</p>
      <Link href="/" className="mt-7 inline-flex min-h-14 items-center rounded-2xl border-b-4 border-violet-900 bg-violet-600 px-6 font-black text-white">На главную</Link>
    </main>
  );
  return <>
    {unavailable && <p role="status" className="bg-amber-50 p-4 text-center text-sm font-bold text-amber-900">{notice}</p>}
    <Lesson lesson={{ id: "mistakes", title: "Тренировка трудных слов", themeColor: "#10b981", words: session.words }} reviewPool={pool} />
  </>;
}

export default function MistakeReview() {
  const { practiceWords, isHydrated: catalogReady } = useCurriculum();
  const { mistakeWordIds, isHydrated, error, syncError, retrySync } = useProgress();
  if (!isHydrated || !catalogReady || (error && !mistakeWordIds.length)) return (
    <main className="mx-auto max-w-xl p-8 text-center">
      <p role="status" className="font-bold">{error || syncError ? "Пока не удалось открыть тренировку." : "Собираем слова для тренировки…"}</p>
      {(error || syncError) && <p role="alert" className="mt-4 text-red-800">{error ?? syncError}</p>}
      {syncError && <button type="button" onClick={retrySync} className="mt-5 min-h-12 rounded-xl bg-violet-100 px-5 font-bold text-violet-800">Повторить загрузку</button>}
      <Link href="/" className="mt-5 inline-flex min-h-12 items-center font-bold text-violet-800">На главную</Link>
    </main>
  );
  return <ReviewSession key={JSON.stringify(practiceWords)} ids={mistakeWordIds} pool={practiceWords} />;
}
