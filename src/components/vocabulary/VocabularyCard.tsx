import Link from "next/link";
import { ArrowRight, LockKeyhole, Star, Volume2 } from "lucide-react";
import Icon3D from "@/components/ui/Icon3D";
import type { VocabularyEntry } from "@/utils/vocabulary";

export default function VocabularyCard({
  entry: { topic, word }, mastered, muted, onListen,
}: {
  entry: VocabularyEntry;
  mastered: boolean;
  muted: boolean;
  onListen: (word: string) => void;
}) {
  return (
    <article className={`flex h-full flex-col rounded-[28px] border p-5 shadow-[0_8px_30px_rgba(47,39,89,0.06)] ${mastered ? "border-[#eeeaf7] bg-white" : "border-dashed border-[#dad5e8] bg-[#f3f1f7]"}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-[#eeeaff] px-3 py-1 text-xs font-extrabold text-[#604ac5]">{topic.title}</span>
        <span className={`inline-flex items-center gap-1 text-xs font-black ${mastered ? "text-emerald-700" : "text-[#777184]"}`}>
          {mastered ? <Star size={14} aria-hidden="true" /> : <LockKeyhole size={14} aria-hidden="true" />}
          {mastered ? "Изучено" : "Закрыто"}
        </span>
      </div>
      {mastered ? (
        <>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: `${topic.themeColor}20` }}>
              <Icon3D name={word.icon} size={52} fallback={word.emoji} className="drop-shadow-sm" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 lang="en" className="break-words text-2xl font-black">{word.english}</h3>
              <p lang="ru" className="mt-1 break-words text-lg font-extrabold text-[#6952bc]">{word.russian}</p>
            </div>
            <button
              type="button"
              data-sound="off"
              aria-label={`Послушать слово ${word.english}`}
              disabled={muted}
              onClick={() => onListen(word.english)}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-b-4 border-[#d6ccf5] bg-[#eeeaff] text-[#604ac5] transition-transform motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Volume2 size={22} aria-hidden="true" />
            </button>
          </div>
          <p lang="en" className="mt-4 flex-1 text-sm font-bold leading-relaxed text-[#777184]">{word.exampleSentence}</p>
        </>
      ) : (
        <>
          <div className="mt-4 flex min-h-28 items-center justify-center rounded-[22px] bg-white/70 text-[#a69bbd]">
            <LockKeyhole size={48} aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-xl font-black text-[#696077]">Слово-сюрприз</h3>
          <p className="mt-2 flex-1 text-sm font-bold leading-relaxed text-[#777184]">Пройди тему «{topic.title}», чтобы открыть это слово.</p>
          <Link href={`/lesson/${topic.id}`} className="mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-b-4 border-[#d6ccf5] bg-[#eeeaff] px-3 text-sm font-black text-[#604ac5] transition-transform motion-safe:active:scale-95">
            К теме «{topic.title}» <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </>
      )}
    </article>
  );
}
