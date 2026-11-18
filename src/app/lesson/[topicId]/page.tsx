import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import BentoCard from "@/components/BentoCard";
import { topics } from "../../topics";

export function generateStaticParams() {
  return topics.map((topic) => ({ topicId: topic.id }));
}

export default async function LessonPage({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await params;
  const topic = topics.find((item) => item.id === topicId);
  if (!topic) notFound();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-5 py-8 sm:px-8">
      <Link href="/" className="inline-flex min-h-12 w-fit items-center gap-2 rounded-xl px-2 text-sm font-extrabold text-[#6e5ac5] transition-transform hover:-translate-x-1"><ArrowLeft size={18} aria-hidden="true" /> Back to adventure</Link>
      <BentoCard className="my-auto border border-[#eeeaf7] bg-white p-8 text-center sm:p-12">
        <span className={`mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] text-6xl ${topic.color}`} aria-hidden="true">{topic.emoji}</span>
        <p className="mt-6 text-xs font-black uppercase tracking-widest text-[#8c7bd0]">Your next adventure</p>
        <h1 className="mt-2 text-3xl font-black">{topic.name}</h1>
        <p className="mx-auto mt-3 max-w-sm font-bold leading-relaxed text-[#858196]">This lesson is coming soon! Head back and explore another world.</p>
        <Link href="/" className="mt-7 inline-flex min-h-14 items-center justify-center rounded-2xl border-b-4 border-[#5943b7] bg-[#745ce4] px-6 py-3 text-sm font-extrabold text-white transition-transform hover:-translate-y-0.5 active:translate-y-1 active:border-b-0">Back to topics</Link>
      </BentoCard>
    </main>
  );
}
