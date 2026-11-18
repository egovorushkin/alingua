"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Check, ChevronRight, Headphones, Sparkles, Star, Trophy } from "lucide-react";
import ActionButton from "@/components/ActionButton";
import BentoCard from "@/components/BentoCard";
import FloatingMascot from "@/components/FloatingMascot";
import { topics } from "./topics";
import { useProgress } from "@/utils/progress";

export default function Home() {
  const { progress, error } = useProgress();
  const results = topics.flatMap((topic) => progress[topic.id] ? [progress[topic.id]] : []);
  const stars = results.reduce((sum, result) => sum + result.stars, 0);
  const xp = results.reduce((sum, result) => sum + result.xp, 0);
  return (
    <div className="min-h-screen">
      <header className="border-b border-[#eeedf2] bg-white/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4 sm:px-8 lg:px-12">
          <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-tight sm:text-2xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#745ce4] text-xl shadow-[0_4px_0_#5843b8]" aria-hidden="true">🚀</span>
            Alingua<span className="text-[#745ce4]">.</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex min-h-11 items-center gap-1.5 rounded-2xl bg-[#fff4e6] px-3 text-sm font-extrabold text-[#a75a1e] sm:px-4">
              <span aria-hidden="true">🔥</span><span>5 <span className="hidden sm:inline">Days</span></span>
              <span className="sr-only"> day streak</span>
            </div>
            <div className="flex min-h-11 items-center gap-1.5 rounded-2xl bg-[#fff8df] px-3 text-sm font-extrabold text-[#926a10] sm:px-4">
              <span aria-hidden="true">⭐</span><span>{stars}</span><span className="sr-only"> stars</span>
            </div>
            <div aria-label="Your profile avatar" className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-white bg-[#dcefe5] text-2xl shadow-sm">🧒</div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-16 pt-9 sm:px-8 sm:pt-12 lg:px-12">
        {error && <p role="alert" className="mb-5 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-800">{error}</p>}
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-1 text-sm font-extrabold text-[#7b68d3]">YOUR LEARNING ADVENTURE <span aria-hidden="true">✨</span></p>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Hey, explorer! <span aria-hidden="true">👋</span></h1>
            <p className="mt-2 text-base font-semibold text-[#77758b]">Ready to learn something amazing today?</p>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[#77758b] shadow-sm sm:flex">
            <Sparkles size={15} className="text-[#e7b43f]" aria-hidden="true" /> {xp} XP earned · A little progress every day!
          </div>
        </div>

        <section aria-label="Your daily adventure" className="grid gap-4 lg:grid-cols-3">
          <BentoCard className="relative overflow-hidden bg-gradient-to-br from-[#8069e9] via-[#7158dc] to-[#5945bb] p-6 text-white sm:p-8 lg:col-span-2">
            <div aria-hidden="true" className="absolute -right-16 -top-32 h-72 w-72 rounded-full border-[40px] border-white/5" />
            <div className="relative flex h-full flex-col-reverse justify-between gap-6 min-[460px]:flex-row min-[460px]:items-center">
              <div className="max-w-md">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider"><Sparkles size={14} aria-hidden="true" /> Your next adventure</span>
                <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-4xl">Little words.<br />Big adventures.</h2>
                <p className="mt-3 max-w-xs text-sm font-bold leading-relaxed text-white/85 sm:text-base">Keep going! A whole world of new words is waiting for you.</p>
                <div className="mt-6"><ActionButton href="/lesson/animals">Start Lesson <ArrowRight size={18} aria-hidden="true" /></ActionButton></div>
              </div>
              <div className="self-center min-[460px]:mr-2"><FloatingMascot /></div>
            </div>
          </BentoCard>

          <BentoCard className="flex flex-col justify-between bg-[#fff5d8] p-6 sm:p-8">
            <div>
              <div className="flex items-start justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/75 text-2xl" aria-hidden="true">🔥</span>
                <span className="rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-[#9a6d25]">Keep it up!</span>
              </div>
              <p className="mt-5 text-xs font-black uppercase tracking-wider text-[#a37b39]">Your streak</p>
              <h2 className="mt-1 text-3xl font-black text-[#57401f]">5 days in a row!</h2>
              <p className="mt-2 text-sm font-bold leading-relaxed text-[#8b714c]">You&apos;re on a roll! Keep learning to make your streak grow.</p>
            </div>
            <div className="mt-6 flex gap-2" aria-label="Five day streak">
              {[1, 2, 3, 4, 5].map((day) => <span key={day} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5bd4f] text-white"><Check size={18} strokeWidth={3} aria-hidden="true" /></span>)}
              <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-[#e7c77f] text-[#c8a05b]"><Star size={16} aria-hidden="true" /></span>
            </div>
          </BentoCard>
        </section>

        <section aria-labelledby="play-heading" className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <div><p className="text-xs font-black uppercase tracking-widest text-[#9b91bd]">A little fun, a lot of learning</p><h2 id="play-heading" className="mt-1 text-2xl font-black tracking-tight">Let&apos;s play!</h2></div>
            <span className="text-xs font-extrabold text-[#9c98aa]">More adventures soon</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <BentoCard className="flex items-center gap-4 border border-[#eeeaf7] bg-white p-5 sm:p-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-[#eeeaff] text-[#7761d6]"><Headphones size={30} strokeWidth={2.2} aria-hidden="true" /></div>
              <div className="min-w-0 flex-1"><h3 className="text-lg font-black">Audio Quiz</h3><p className="mt-1 text-sm font-bold text-[#8a879a]">Listen closely and take a guess!</p><span className="mt-2 inline-block text-xs font-black text-[#7864d2]">Coming soon</span></div>
              <span className="text-2xl" aria-hidden="true">🎧</span>
            </BentoCard>
            <BentoCard className="flex items-center gap-4 border border-[#eeeaf7] bg-white p-5 sm:p-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-[#e5f7ef] text-[#46a87f]"><Sparkles size={30} strokeWidth={2.2} aria-hidden="true" /></div>
              <div className="min-w-0 flex-1"><h3 className="text-lg font-black">Word Match</h3><p className="mt-1 text-sm font-bold text-[#8a879a]">Find the pairs and make a match!</p><span className="mt-2 inline-block text-xs font-black text-[#3d9872]">Coming soon</span></div>
              <span className="text-2xl" aria-hidden="true">🧩</span>
            </BentoCard>
            <BentoCard className="flex items-center gap-4 border border-[#eeeaf7] bg-white p-5 sm:col-span-2 sm:p-6 lg:col-span-1">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-[#fff4d8] text-[#cf9735]"><Trophy size={30} strokeWidth={2.2} aria-hidden="true" /></div>
              <div className="min-w-0 flex-1"><h3 className="text-lg font-black">Streak Star</h3><p className="mt-1 text-sm font-bold text-[#8a879a]">Five days of learning. Amazing!</p><span className="mt-2 inline-block text-xs font-black text-[#a47720]">Achievement unlocked</span></div>
              <span className="text-2xl" aria-hidden="true">🏅</span>
            </BentoCard>
          </div>
        </section>

        <section aria-labelledby="topics-heading" className="mt-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div><p className="text-xs font-black uppercase tracking-widest text-[#9b91bd]">Pick a world to explore</p><h2 id="topics-heading" className="mt-1 text-2xl font-black tracking-tight">Your topics <span aria-hidden="true">🌈</span></h2></div>
            <span className="flex items-center gap-1.5 text-xs font-extrabold text-[#9c98aa]"><BookOpen size={15} aria-hidden="true" /> 4 worlds to discover</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {topics.map((topic) => (
              <Link key={topic.id} href={`/lesson/${topic.id}`} className="group rounded-[28px] transition-transform duration-200 hover:-translate-y-1 active:scale-[0.98]">
                <BentoCard className="h-full border border-[#eeeaf7] bg-white p-5 transition-shadow group-hover:shadow-[0_12px_30px_rgba(80,65,150,0.12)]">
                  <div className="flex items-start justify-between"><span className={`flex h-16 w-16 items-center justify-center rounded-[22px] text-4xl ${topic.color}`} aria-hidden="true">{topic.emoji}</span><span className="rounded-full bg-[#f8f7fb] p-2 text-[#aaa4bd] group-hover:text-[#745ce4]"><ChevronRight size={18} aria-hidden="true" /></span></div>
                  <h3 className="mt-5 text-lg font-black">{topic.name}</h3>
                  <p className="mt-1 min-h-10 text-sm font-bold text-[#8a879a]">{topic.description}</p>
                  <div className="mt-5 flex items-center justify-between text-xs font-extrabold text-[#8a879a]"><span>{progress[topic.id] ? "Completed" : "Progress"}</span><span>{progress[topic.id] ? topic.total : 0}/{topic.total} words</span></div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#f0eef5]" role="progressbar" aria-label={`${topic.name} words learned`} aria-valuenow={progress[topic.id] ? topic.total : 0} aria-valuemin={0} aria-valuemax={topic.total}><div className={`h-full rounded-full ${topic.bar}`} style={{ width: progress[topic.id] ? "100%" : "0%" }} /></div>
                </BentoCard>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-10 flex items-center justify-center gap-2 text-center text-xs font-extrabold text-[#aaa5b7]"><Trophy size={15} className="text-[#ddb456]" aria-hidden="true" /> Every new word is a little win. You&apos;ve got this!</div>
      </main>
    </div>
  );
}
