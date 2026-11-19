import { notFound } from "next/navigation";
import { chapters, getBossLesson, lessons } from "@/data/lessons";
import Lesson from "@/components/lesson/Lesson";

export function generateStaticParams() {
  return [...lessons.map((lesson) => ({ topicId: lesson.id })), ...chapters.map((chapter) => ({ topicId: chapter.boss.id }))];
}

export default async function LessonPage({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await params;
  const lesson = topicId.startsWith("boss-") ? getBossLesson(topicId) : lessons.find((item) => item.id === topicId);
  if (!lesson) notFound();

  return <Lesson key={lesson.id} lesson={lesson} />;
}
