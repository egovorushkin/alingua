import { notFound } from "next/navigation";
import { Suspense } from "react";
import { chapters, lessons } from "@/data/lessons";
import { validId } from "@/data/curriculum";
import CurriculumLesson from "@/components/lesson/CurriculumLesson";
import Loading from "./loading";

export function generateStaticParams() {
  return [...lessons.map((lesson) => ({ topicId: lesson.id })), ...chapters.map((chapter) => ({ topicId: chapter.boss.id }))];
}

async function LessonRoute({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await params;
  if (!validId(topicId.startsWith("boss-") ? topicId.slice(5) : topicId)) notFound();
  return <CurriculumLesson topicId={topicId} />;
}

export default function LessonPage({ params }: { params: Promise<{ topicId: string }> }) {
  return <Suspense fallback={<Loading />}><LessonRoute params={params} /></Suspense>;
}
