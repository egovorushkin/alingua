"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Sparkles, Trophy } from "lucide-react";
import BentoCard from "@/components/BentoCard";
import AchievementBadge from "@/components/profile/AchievementBadge";
import { SoundToggle } from "@/components/SoundControls";
import { useProgress } from "@/context/ProgressContext";
import { topics } from "../topics";

export default function ProfilePage() {
  const { completedTopics, error, summary: stats } = useProgress();
  const totalWords = topics.reduce((sum, topic) => sum + topic.total, 0);
  const rank = stats.wordsLearned >= totalWords ? "Word Wizard" : stats.wordsLearned >= 5 ? "Word Explorer" : "New Explorer";
  const achievements = [
    { title: "First Lesson", emoji: "🎒", description: "Finish your first learning adventure.", unlocked: stats.lessonsCompleted >= 1 },
    { title: "3-Day Streak", emoji: "🔥", description: "Visit Alingua on 3 days in a row.", unlocked: stats.bestStreak >= 3 },
    { title: "Word Master", emoji: "👑", description: `Learn all ${totalWords} words across your topics.`, unlocked: stats.wordsLearned >= totalWords },
    { title: "Sound Check", emoji: "🎧", description: "Finish a lesson with audio turned on.", unlocked: stats.soundCheck },
  ];

  return (
    <main className="mx-auto max-w-6xl px-5 pb-14 pt-5 sm:px-8 sm:pt-8">
      <nav aria-label="Profile navigation" className="mb-7 flex items-center justify-between gap-4">
        <Link href="/" className="inline-flex min-h-12 items-center gap-2 rounded-xl px-2 text-sm font-extrabold text-[#6952bc] transition-transform hover:-translate-x-1"><ArrowLeft size={18} aria-hidden="true" /> Back to Home</Link>
        <SoundToggle />
      </nav>
      {error && <p role="alert" className="mb-5 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-800">{error}</p>}

      <BentoCard className="relative overflow-hidden border border-[#e8e1f7] bg-gradient-to-br from-[#f0eaff] via-white to-[#fff6dd] p-6 sm:p-9">
        <div aria-hidden="true" className="absolute -right-10 -top-20 h-56 w-56 rounded-full border-[30px] border-[#e8ddff]/50" />
        <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <div className="relative shrink-0">
            <div className="flex h-28 w-28 items-center justify-center rounded-[36px] border-4 border-white bg-[#e1f1e7] text-6xl shadow-[0_0_0_4px_#c8b9f4,0_12px_30px_#b8a5e644]" role="img" aria-label="Your explorer avatar">🧒</div>
            <span className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl border-4 border-white bg-[#ffdf7b] text-xl" aria-hidden="true">⭐</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7961bf]">Your explorer passport</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Alingua Explorer</h1>
            <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#eee6ff] px-4 py-2 text-sm font-extrabold text-[#604ac5]"><Sparkles size={16} aria-hidden="true" />{rank}</p>
            <p className="mt-3 text-sm font-bold text-[#777184]">Little steps. New words. Big adventures.</p>
          </div>
        </div>
        <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Daily streak", value: `${stats.streak} ${stats.streak === 1 ? "day" : "days"}`, emoji: "🔥", color: "bg-[#fff0df] text-[#9c5824]" },
            { label: "Total stars", value: stats.stars, emoji: "⭐", color: "bg-[#fff6d8] text-[#946a18]" },
            { label: "Words learned", value: stats.wordsLearned, emoji: "📚", color: "bg-[#e4f6ed] text-[#2e7d59]" },
          ].map((stat) => (
            <div key={stat.label} className={`flex items-center gap-4 rounded-3xl border-2 border-white p-5 shadow-[0_0_24px_#ffffff99] ${stat.color}`}>
              <span className="text-3xl" aria-hidden="true">{stat.emoji}</span>
              <div><p className="text-2xl font-black">{stat.value}</p><p className="text-xs font-extrabold">{stat.label}</p></div>
            </div>
          ))}
        </div>
      </BentoCard>

      <section aria-labelledby="progress-heading" className="mt-9">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-black uppercase tracking-widest text-[#7961bf]">Look how far you&apos;ve come</p><h2 id="progress-heading" className="mt-1 text-2xl font-black">Your learning journey</h2></div>
          <span className="text-sm font-extrabold text-[#777184]">{stats.xp} XP earned</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <BentoCard className="border border-[#eeeaf7] bg-white p-5 sm:p-7 lg:col-span-2">
            <div className="mb-5 flex items-center gap-2"><BookOpen size={20} className="text-[#7961bf]" aria-hidden="true" /><h3 className="text-lg font-black">Worlds you&apos;re discovering</h3></div>
            <div className="space-y-5">
              {topics.map((topic) => {
                const learned = completedTopics.includes(topic.id) ? topic.total : 0;
                const percent = Math.round((learned / topic.total) * 100);
                return (
                  <Link key={topic.id} href={`/lesson/${topic.id}`} className="block rounded-xl p-1 transition-colors hover:bg-[#faf8ff]">
                    <div className="mb-2 flex items-center justify-between gap-2 text-sm font-extrabold"><span className="flex items-center gap-2"><span aria-hidden="true">{topic.emoji}</span>{topic.name}</span><span className="text-[#777184]">{percent}% · {learned}/{topic.total}</span></div>
                    <div className="h-3 overflow-hidden rounded-full bg-[#f0eef5]" role="progressbar" aria-label={`${topic.name} completion`} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><div className={`h-full rounded-full transition-[width] motion-reduce:transition-none ${topic.bar}`} style={{ width: `${percent}%` }} /></div>
                  </Link>
                );
              })}
            </div>
          </BentoCard>
          <BentoCard className="flex flex-col justify-center border border-[#eeeaf7] bg-white p-6 text-center sm:p-7">
            <span className="text-4xl" aria-hidden="true">🎯</span>
            <p className="mt-3 text-4xl font-black text-[#604ac5]">{stats.accuracy}%</p>
            <h3 className="mt-1 text-sm font-extrabold text-[#777184]">Average best accuracy</h3>
            <div className="my-5 h-px bg-[#eeedf3]" />
            <p className="text-3xl font-black">{stats.lessonsCompleted}</p>
            <p className="mt-1 text-sm font-extrabold text-[#777184]">Lessons completed</p>
            {stats.lessonsCompleted === 0 && <p className="mt-4 text-sm font-bold text-[#777184]">Your story starts with one little lesson.</p>}
          </BentoCard>
        </div>
      </section>

      <section aria-labelledby="badges-heading" className="mt-9">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-black uppercase tracking-widest text-[#7961bf]">Little wins worth celebrating</p><h2 id="badges-heading" className="mt-1 text-2xl font-black">Your badge collection</h2></div>
          <span className="flex items-center gap-2 text-sm font-extrabold text-[#777184]"><Trophy size={17} className="text-[#bd8a27]" aria-hidden="true" />{achievements.filter((badge) => badge.unlocked).length} of {achievements.length} unlocked</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {achievements.map((badge) => <AchievementBadge key={badge.title} {...badge} />)}
        </div>
      </section>
      <div className="mt-8 text-center">
        <Link href="/" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border-b-4 border-[#5843b8] bg-[#745ce4] px-7 py-3 font-black text-white transition-transform hover:-translate-y-0.5 active:translate-y-1">Keep exploring <ArrowRight size={18} aria-hidden="true" /></Link>
        <p className="mt-4 text-xs font-bold text-[#777184]">Your progress is saved on this browser and device.</p>
      </div>
    </main>
  );
}
