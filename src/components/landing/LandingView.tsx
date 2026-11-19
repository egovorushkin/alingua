import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, BookOpen, Cloud, Flame, Headphones, Heart, Map, PawPrint, Puzzle, ShieldCheck, Sparkles, Star } from "lucide-react";
import EntryLink from "./EntryLink";
import DemoFlashcardWidget from "./DemoFlashcardWidget";
import LandingMotion from "./LandingMotion";
import panda from "@/app/icon.png";

const primary = "inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border-b-4 border-[#43248f] bg-[#6741be] px-5 py-3 text-center font-black text-white hover:bg-[#5834ad] motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-95";
const quiet = "inline-flex min-h-12 items-center justify-center rounded-xl px-3 text-center font-extrabold hover:underline";

const badges = [
  { title: "Серия дней", href: "/", icon: Flame, className: "left-2 top-[13%] -rotate-6 bg-[#fff4df] text-[#923e1c] sm:left-4" },
  { title: "Собери слово", href: "/lesson/animals", icon: Puzzle, className: "bottom-[18%] right-2 rotate-6 bg-[#f0e9ff] text-[#542a9e] sm:right-4" },
  { title: "Слушай и угадывай", href: "/games/listen", icon: Headphones, className: "bottom-[7%] left-2 -rotate-3 bg-[#e6f7ed] text-[#185e4c] sm:left-5" },
];

const features = [
  { title: "Слова, с которыми можно играть", description: "Смотри карточки, собирай слова из букв с подсказками и узнавай их на слух. Есть медленная озвучка!", icon: Puzzle, color: "bg-[#eee6ff] text-[#532896]", link: "/lesson/animals", action: "Попробовать урок" },
  { title: "Карта с тайниками", description: "Исследуй новые главы, открывай сундуки и встречай хранителей. Испытания помогут вспомнить всё, что ты выучил.", icon: Map, color: "bg-[#e2f5eb] text-[#165b49]", link: "/", action: "Посмотреть карту" },
  { title: "Красная панда рядом", description: "Загляни на карту и нажми на панду: она подбодрит тебя перед следующим заданием.", icon: PawPrint, color: "bg-[#ffe9d9] text-[#963d27]", teaser: "В планах: своё имя, очки, корона и наушники" },
  { title: "Тренировка трудных слов", description: "Что-то не получилось? Вернись к трудным словам, потренируйся без спешки и получи звёзды.", icon: Heart, color: "bg-[#fff1c8] text-[#79500d]", link: "/lesson/mistakes", action: "Зайти на тренировку" },
];

function StartLink() {
  return <EntryLink href="/lesson/animals" className={primary}>Начать бесплатно <ArrowRight size={20} aria-hidden="true" /></EntryLink>;
}

function HeroShowcase() {
  return (
    <div className="relative isolate aspect-square w-full max-w-[31rem] justify-self-center rounded-[2rem] border border-[#f1d8ce] bg-[#fce7d9] shadow-[0_16px_55px_-30px_#a55545] sm:rounded-[2.75rem]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-3 rounded-[inherit] border border-dashed border-[#dca996]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-[14%] rounded-full bg-[#f9c9ad] blur-2xl" />
      <LandingMotion float className="absolute inset-[15%]">
        <Image src={panda} alt="Улыбающаяся красная панда" preload sizes="(max-width: 550px) 70vw, 350px" className="h-full w-full rounded-[32%] object-cover shadow-[0_15px_36px_-14px_#98533f]" />
      </LandingMotion>
      <Star aria-hidden="true" className="absolute right-[11%] top-[14%] size-7 rotate-12 fill-[#ffcf63] text-[#a76325] sm:size-10" />
      <Sparkles aria-hidden="true" className="absolute bottom-[26%] left-[7%] size-6 text-[#ae5235]" />
      {badges.map(({ title, href, icon: BadgeIcon, className }) => (
        <EntryLink key={title} href={href} className={`absolute inline-flex min-h-11 items-center gap-1.5 rounded-2xl border border-white px-2.5 text-xs font-black shadow-md motion-safe:transition-transform motion-safe:hover:rotate-0 motion-safe:hover:scale-105 motion-safe:active:scale-95 sm:px-3 sm:text-sm ${className}`}>
          <BadgeIcon size={17} aria-hidden="true" />{title}
        </EntryLink>
      ))}
    </div>
  );
}

export default function LandingView() {
  return (
    <div data-sound="off" className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eae3db] py-3 sm:py-4">
        <Link href="/welcome" aria-label="Alingua — знакомство" className="inline-flex min-h-12 items-center gap-2 rounded-xl text-xl font-black tracking-tight sm:text-2xl">
          <Image src={panda} alt="" width={40} height={40} className="rounded-xl border border-[#efe5d9]" />
          <span>Alingua<span className="text-[#6741be]">.</span></span>
        </Link>
        <nav aria-label="Верхнее меню" className="flex flex-wrap items-center gap-1 text-sm text-[#4e317d] sm:gap-3 sm:text-base">
          <EntryLink href="/" className={`${quiet} hidden sm:inline-flex`}>Карта</EntryLink>
          <Link href="/login" className={`${quiet} bg-[#eee6ff]`}>Вход для родителей</Link>
        </nav>
      </header>

      <main>
        <section aria-labelledby="welcome-title" className="relative isolate grid items-center gap-8 py-9 sm:gap-12 sm:py-14 lg:grid-cols-[1.08fr_1fr] lg:py-16">
          <div aria-hidden="true" className="pointer-events-none absolute -z-10 inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_25%_30%,#f0e7ff,transparent_64%)]" />
          <LandingMotion>
            <p className="inline-flex items-center gap-2 rounded-full bg-[#eee6ff] px-3 py-2 text-sm font-black text-[#542a9e]">
              <Sparkles size={16} aria-hidden="true" /> Английское приключение для детей
            </p>
            <h1 id="welcome-title" className="mt-4 text-[clamp(2.2rem,7.8vw,4.7rem)] leading-[1.04] font-black tracking-[-0.045em]">
              Английский <span className="text-[#6741be]">как приключение</span>
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed font-bold text-[#584f65] sm:text-lg">
              Отправляйся в путь с красной пандой! Играй со словами, читай короткие фразы и проходи испытания в своём темпе.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <StartLink />
              <Link href="/login" className={`${quiet} text-[#542a9e]`}>Уже есть аккаунт? Войти</Link>
            </div>
            <p className="mt-3 flex items-center gap-2 text-sm font-bold text-[#584f65]"><ShieldCheck size={17} className="shrink-0 text-[#24765c]" aria-hidden="true" /> Первый урок без регистрации</p>
          </LandingMotion>
          <HeroShowcase />
        </section>

        <section aria-labelledby="demo-title" className="grid items-start gap-5 border-t border-[#eae3db] py-9 sm:py-12 lg:grid-cols-[1fr_1.2fr] lg:gap-10">
          <div className="lg:pt-8">
            <p className="text-sm font-black text-[#6741be]">Мини-игра · Космос</p>
            <h2 id="demo-title" className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Попробуй прямо здесь!</h2>
            <p className="mt-2 max-w-sm font-bold text-[#584f65]">Переверни карточку, чтобы узнать слово, или попробуй угадать перевод.</p>
          </div>
          <DemoFlashcardWidget />
        </section>

        <section id="how-it-works" aria-labelledby="features-title" className="scroll-mt-6 border-t border-[#eae3db] py-10 sm:py-14">
          <p className="flex items-center gap-2 text-sm font-black text-[#6741be]"><ArrowDown size={17} aria-hidden="true" /> Как это работает</p>
          <h2 id="features-title" className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Что ждёт в приключении</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {features.map(({ title, description, icon: FeatureIcon, color, link, action, teaser }) => (
              <LandingMotion key={title}>
                <article className={`flex h-full flex-col items-start rounded-3xl p-5 shadow-sm motion-safe:transition-transform motion-safe:hover:-translate-y-1 sm:p-7 ${color}`}>
                  <span className="grid size-12 place-items-center rounded-2xl bg-white/75"><FeatureIcon size={25} aria-hidden="true" /></span>
                  <h3 className="mt-3 text-xl font-black sm:text-2xl">{title}</h3>
                  <p className="mt-1 mb-2 max-w-md leading-relaxed font-bold text-[#463b53]">{description}</p>
                  {link && <EntryLink href={link} className="mt-auto inline-flex min-h-11 items-center gap-2 rounded-lg font-black hover:underline">{action} <ArrowRight size={16} aria-hidden="true" /></EntryLink>}
                  {teaser && <p className="mt-auto pt-2 text-sm font-black">{teaser}</p>}
                </article>
              </LandingMotion>
            ))}
          </div>
        </section>

        <section aria-labelledby="parents-title" className="rounded-3xl border border-[#dce9df] bg-[#f0f7f1] p-5 sm:p-8">
          <p className="text-sm font-black text-[#24634f]">Для родителей</p>
          <h2 id="parents-title" className="mt-1 text-2xl font-black sm:text-3xl">Только игра и английский</h2>
          <ul className="mt-5 grid gap-4 font-bold text-[#36554b] md:grid-cols-3">
            <li className="flex gap-2"><ShieldCheck className="shrink-0" size={20} aria-hidden="true" /> Без рекламы и отвлекающих вставок.</li>
            <li className="flex gap-2"><BookOpen className="shrink-0" size={20} aria-hidden="true" /> Изученные слова и достижения видны в профиле.</li>
            <li className="flex gap-2"><Cloud className="shrink-0" size={20} aria-hidden="true" /> Без входа прогресс хранится на этом устройстве. С аккаунтом — в облаке.</li>
          </ul>
        </section>

        <section aria-labelledby="ready-title" className="my-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-[#eee6ff] p-5 sm:my-10 sm:p-8">
          <div>
            <h2 id="ready-title" className="text-2xl font-black tracking-tight sm:text-3xl">Готов познакомиться с пандой?</h2>
            <p className="mt-1 font-bold text-[#584f65]">Начни с животных и узнай, как они называются по-английски.</p>
          </div>
          <StartLink />
        </section>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-1 border-t border-[#eae3db] py-4">
        <p className="pr-3 font-black">Alingua<span className="text-[#6741be]">.</span></p>
        <nav aria-label="Ссылки внизу страницы" className="flex flex-wrap text-sm text-[#4e317d]">
          <Link href="/login" className={quiet}>Вход</Link>
          <Link href="/vocabulary" className={quiet}>Копилка слов</Link>
          <Link href="/profile" className={quiet}>Профиль</Link>
        </nav>
      </footer>
    </div>
  );
}
