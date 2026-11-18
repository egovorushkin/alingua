import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-5 text-center">
      <span className="text-6xl" aria-hidden="true">🧭</span>
      <h1 className="text-3xl font-black">Ой, эта страница потерялась!</h1>
      <p className="font-bold text-[#777184]">Вернёмся к новым словам и приключениям?</p>
      <Link href="/" className="inline-flex min-h-14 items-center justify-center rounded-2xl border-b-4 border-[#5843b8] bg-[#745ce4] px-7 py-3 font-black text-white transition-transform motion-safe:active:scale-95">На главную</Link>
    </main>
  );
}
