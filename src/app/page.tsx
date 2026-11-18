"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Check, ChevronRight, Sparkles, Star, Trophy } from "lucide-react";
import ActionButton from "@/components/ActionButton";
import BentoCard from "@/components/BentoCard";
import FloatingMascot from "@/components/FloatingMascot";
import ThreeDIcon from "@/components/ThreeDIcon";
import Icon3D from "@/components/ui/Icon3D";
import DailyBonusModal from "@/components/gamification/DailyBonusModal";
import { topics } from "./topics";
import { useProgress } from "@/context/ProgressContext";
import { SoundToggle } from "@/components/SoundControls";
import { formatCount } from "@/utils/russian";

export default function Home() {
  const { completedTopics, error, summary } = useProgress();
  const { stars, xp, streak, bestStreak } = summary;
  return (
    <div className="min-h-screen">
      <header className="border-b border-[#eeedf2] bg-white/80">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8 lg:px-12">
          <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-tight sm:text-2xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eeeaff] shadow-[0_4px_0_#c8b9f4]" aria-hidden="true"><ThreeDIcon name="rocket" size={36} /></span>
            Alingua<span className="text-[#745ce4]">.</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <SoundToggle />
            <div className="flex min-h-11 items-center gap-1.5 rounded-2xl bg-[#fff4e6] px-3 text-sm font-extrabold text-[#a75a1e] sm:px-4">
              <ThreeDIcon name="fire" size={24} /><span>{formatCount(streak, "день", "дня", "дней")}</span>
              <span className="sr-only"> подряд</span>
            </div>
            <div className="flex min-h-11 items-center gap-1.5 rounded-2xl bg-[#fff8df] px-3 text-sm font-extrabold text-[#926a10] sm:px-4">
              <ThreeDIcon name="star" size={24} /><span aria-hidden="true">{stars}</span><span className="sr-only">{formatCount(stars, "звезда", "звезды", "звёзд")}</span>
            </div>
            <Link href="/profile" aria-label="Открыть профиль и достижения" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-white bg-[#dcefe5] shadow-sm transition-transform hover:-translate-y-0.5 active:scale-95"><ThreeDIcon name="boy" size={36} /></Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-16 pt-9 sm:px-8 sm:pt-12 lg:px-12">
        {error && <p role="alert" className="mb-5 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-800">{error}</p>}
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-1 text-sm font-extrabold text-[#7b68d3]">ТВОЁ ПРИКЛЮЧЕНИЕ В МИРЕ СЛОВ <span aria-hidden="true">✨</span></p>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Привет, исследователь! <span aria-hidden="true">👋</span></h1>
            <p className="mt-2 text-base font-semibold text-[#77758b]">Что удивительного узнаем сегодня?</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[#77758b] shadow-sm sm:flex">
              <Sparkles size={15} className="text-[#e7b43f]" aria-hidden="true" /> Опыт: {xp} · Маленькие шаги каждый день!
            </div>
            <Link href="/vocabulary" className="inline-flex min-h-12 items-center gap-2 rounded-2xl border-b-4 border-[#d6ccf5] bg-[#eeeaff] px-4 text-sm font-black text-[#604ac5] transition-transform motion-safe:active:scale-95"><BookOpen size={19} aria-hidden="true" /> Копилка слов <ChevronRight size={16} aria-hidden="true" /></Link>
            <DailyBonusModal />
          </div>
        </div>

        <section aria-label="Твоё приключение на сегодня" className="grid gap-4 lg:grid-cols-3">
          <BentoCard className="relative overflow-hidden bg-gradient-to-br from-[#8069e9] via-[#7158dc] to-[#5945bb] p-6 text-white sm:p-8 lg:col-span-2">
            <div aria-hidden="true" className="absolute -right-16 -top-32 h-72 w-72 rounded-full border-[40px] border-white/5" />
            <div className="relative flex h-full flex-col-reverse justify-between gap-6 min-[460px]:flex-row min-[460px]:items-center">
              <div className="max-w-md">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider"><Sparkles size={14} aria-hidden="true" /> Новое приключение</span>
                <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-4xl">Маленькие слова.<br />Большие открытия.</h2>
                <p className="mt-3 max-w-xs text-sm font-bold leading-relaxed text-white/85 sm:text-base">Вперёд! Тебя ждёт целый мир новых английских слов.</p>
                <div className="mt-6"><ActionButton href="/lesson/animals">Начать урок <ArrowRight size={18} aria-hidden="true" /></ActionButton></div>
              </div>
              <div className="self-center min-[460px]:mr-2"><FloatingMascot /></div>
            </div>
          </BentoCard>

          <BentoCard className="flex flex-col justify-between bg-[#fff5d8] p-6 sm:p-8">
            <div>
              <div className="flex items-start justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/75" aria-hidden="true"><ThreeDIcon name="fire" size={44} /></span>
                <span className="rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-[#9a6d25]">Так держать!</span>
              </div>
              <p className="mt-5 text-xs font-black uppercase tracking-wider text-[#a37b39]">Дни подряд</p>
              <h2 className="mt-1 text-3xl font-black text-[#57401f]">{streak ? `${formatCount(streak, "день", "дня", "дней")} подряд!` : "Начни свою серию!"}</h2>
              <p className="mt-2 text-sm font-bold leading-relaxed text-[#8b714c]">{streak ? "Отличный темп! Возвращайся завтра за новыми открытиями." : "Заглядывай каждый день. Большое приключение начинается с маленького шага!"}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2" aria-label={`${formatCount(streak, "день", "дня", "дней")} подряд`}>
              {[1, 2, 3, 4, 5, 6].map((day) => <span key={day} className={`flex h-9 w-9 items-center justify-center rounded-full ${day <= streak ? "bg-[#f5bd4f] text-white" : "border-2 border-dashed border-[#e7c77f] text-[#b48c49]"}`}>{day <= streak ? <Check size={18} strokeWidth={3} aria-hidden="true" /> : <Star size={16} aria-hidden="true" />}</span>)}
            </div>
          </BentoCard>
        </section>

        <section aria-labelledby="play-heading" className="mt-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div><p className="text-xs font-black uppercase tracking-widest text-[#9b91bd]">Играем и учимся</p><h2 id="play-heading" className="mt-1 text-2xl font-black tracking-tight">Поиграем!</h2></div>
            <span className="text-xs font-extrabold text-[#9c98aa]">Скоро новые приключения</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/games/listen" className="rounded-[28px] transition-transform motion-safe:hover:-translate-y-1 motion-safe:active:scale-[0.98]">
              <BentoCard className="flex h-full items-center gap-4 border border-[#eeeaf7] bg-white p-5 sm:p-6">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-[#eeeaff]"><ThreeDIcon name="headphone" size={60} /></div>
                <div className="min-w-0 flex-1"><h3 className="text-lg font-black">Слушай и угадывай</h3><p className="mt-1 text-sm font-bold text-[#8a879a]">Узнай слово на слух!</p><span className="mt-2 inline-flex items-center gap-1 text-xs font-black text-[#7864d2]">Играть <ArrowRight size={14} aria-hidden="true" /></span></div>
              </BentoCard>
            </Link>
            <BentoCard className="flex items-center gap-4 border border-[#eeeaf7] bg-white p-5 sm:p-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-[#e5f7ef]"><ThreeDIcon name="puzzle" size={60} /></div>
              <div className="min-w-0 flex-1"><h3 className="text-lg font-black">Найди пару</h3><p className="mt-1 text-sm font-bold text-[#8a879a]">Подбери пары к словам!</p><span className="mt-2 inline-block text-xs font-black text-[#3d9872]">Скоро</span></div>
            </BentoCard>
            <BentoCard className="flex items-center gap-4 border border-[#eeeaf7] bg-white p-5 sm:col-span-2 sm:p-6 lg:col-span-1">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-[#fff4d8]"><ThreeDIcon name="trophy" size={60} /></div>
              <div className="min-w-0 flex-1"><h3 className="text-lg font-black">Звезда упорства</h3><p className="mt-1 text-sm font-bold text-[#8a879a]">Загляни в Alingua 3 дня подряд.</p><Link href="/profile" className="mt-2 inline-flex min-h-11 items-center text-xs font-black text-[#a47720]">{bestStreak >= 3 ? "Достижение открыто" : "Мои значки"}</Link></div>
            </BentoCard>
          </div>
        </section>

        <section aria-labelledby="topics-heading" className="mt-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div><p className="text-xs font-black uppercase tracking-widest text-[#9b91bd]">Выбери свой мир</p><h2 id="topics-heading" className="mt-1 text-2xl font-black tracking-tight">Твои темы <span aria-hidden="true">🌈</span></h2></div>
            <span className="flex items-center gap-1.5 text-xs font-extrabold text-[#9c98aa]"><BookOpen size={15} aria-hidden="true" /> {topics.length} тем для открытий</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {topics.map((topic) => (
              <Link key={topic.id} href={`/lesson/${topic.id}`} className="group rounded-[28px] motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:-translate-y-1 motion-safe:active:scale-[0.98]">
                <BentoCard className="h-full border border-[#eeeaf7] bg-white p-5 transition-shadow group-hover:shadow-[0_12px_30px_rgba(80,65,150,0.12)]">
                  <div className="flex items-start justify-between">
                    <span className={`flex size-24 items-center justify-center rounded-[28px] ${topic.color}`}>
                      <Icon3D name={topic.icon} size={100} fallback={topic.emoji} className="-translate-y-2 drop-shadow-lg motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:-translate-y-3 motion-safe:group-hover:scale-110 motion-safe:group-focus-visible:scale-110" />
                    </span>
                    <span className="rounded-full bg-[#f8f7fb] p-2 text-[#aaa4bd] group-hover:text-[#745ce4]"><ChevronRight size={18} aria-hidden="true" /></span>
                  </div>
                  <h3 className="mt-5 text-lg font-black">{topic.name}</h3>
                  <p className="mt-1 min-h-10 text-sm font-bold text-[#8a879a]">{topic.description}</p>
                  <div className="mt-5 flex items-center justify-between text-xs font-extrabold text-[#8a879a]"><span>{completedTopics.includes(topic.id) ? "Готово" : "Прогресс"}</span><span>{completedTopics.includes(topic.id) ? topic.total : 0}/{topic.total} слов</span></div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#f0eef5]" role="progressbar" aria-label={`${topic.name}: изученные слова`} aria-valuenow={completedTopics.includes(topic.id) ? topic.total : 0} aria-valuemin={0} aria-valuemax={topic.total}><div className={`h-full rounded-full ${topic.bar}`} style={{ width: completedTopics.includes(topic.id) ? "100%" : "0%" }} /></div>
                </BentoCard>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-10 flex items-center justify-center gap-2 text-center text-xs font-extrabold text-[#aaa5b7]"><Trophy size={15} className="shrink-0 text-[#ddb456]" aria-hidden="true" /> Каждое новое слово — маленькая победа. У тебя всё получится!</div>
      </main>
    </div>
  );
}
