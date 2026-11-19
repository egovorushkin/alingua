"use client";

import Link from "next/link";
import { useCurriculum } from "@/context/CurriculumContext";
import { getBossLesson, lessons as defaults } from "@/data/lessons";
import Lesson from "./Lesson";
import MistakeReview from "./MistakeReview";

export default function CurriculumLesson({ topicId }: { topicId: string }) {
  const { lessons, chapters, isHydrated } = useCurriculum();
  if (topicId === "mistakes") return <MistakeReview />;
  const lesson = isHydrated
    ? topicId.startsWith("boss-") ? getBossLesson(topicId, chapters, lessons) : lessons.find((item) => item.id === topicId)
    : getBossLesson(topicId) ?? defaults.find((item) => item.id === topicId);
  if (!lesson) return (
    <main className="mx-auto max-w-xl p-8 text-center">
      <h1 className="text-2xl font-black">{isHydrated ? "Тема пока недоступна" : "Загружаем урок…"}</h1>
      {isHydrated && <p className="mt-4 font-bold">Тема скрыта, ещё готовится или сохранена в другом аккаунте или браузере.</p>}
      <Link href="/" className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-violet-100 px-5 font-bold text-violet-900">На главную</Link>
    </main>
  );
  return <div inert={!isHydrated} aria-busy={!isHydrated}><Lesson key={JSON.stringify(lesson)} lesson={lesson} /></div>;
}
