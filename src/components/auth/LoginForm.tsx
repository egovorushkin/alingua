"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Cloud, Mail } from "lucide-react";
import { useAuth, authErrorMessage } from "@/context/AuthContext";
import EntryLink from "@/components/landing/EntryLink";

const inputClass = "mt-2 min-h-14 w-full rounded-2xl border-2 border-violet-100 bg-slate-50 px-4 font-bold outline-none focus:border-violet-400";
const buttonClass = "min-h-14 w-full rounded-2xl border-b-4 px-4 py-3 font-black transition-transform motion-safe:active:scale-95 disabled:cursor-not-allowed disabled:opacity-50";

export default function LoginForm({ callbackError }: { callbackError: boolean }) {
  const { client, user, isLoading, error: authError } = useAuth();
  const router = useRouter();
  const [signup, setSignup] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    if (!isLoading && user) router.replace("/");
  }, [isLoading, user, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || pending) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      const { data, error } = signup
        ? await client.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/auth/callback` } })
        : await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.session) router.replace("/");
      else setNotice("Проверь почту: мы отправили ссылку для подтверждения. Затем вернись и войди с паролем.");
    } catch (error) {
      setError(authErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  async function google() {
    if (!client || pending) return;
    setPending(true);
    setError(null);
    try {
      const { error } = await client.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/auth/callback` } });
      if (error) throw error;
    } catch (error) {
      setError(authErrorMessage(error));
      setPending(false);
    }
  }

  const disabled = pending || isLoading || !client;
  return (
    <main className="mx-auto max-w-lg px-5 py-8 sm:py-14">
      <Link href="/" className="inline-flex min-h-12 items-center gap-2 font-extrabold text-violet-700"><ArrowLeft size={18} aria-hidden="true" />На главную</Link>
      <section className="mt-5 rounded-[32px] border border-violet-100 bg-white p-6 shadow-xl shadow-violet-100/40 sm:p-8">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-100 text-violet-600"><Cloud size={42} aria-hidden="true" /></div>
        <h1 className="mt-5 text-center text-3xl font-black">{signup ? "Начнём приключение!" : "С возвращением!"}</h1>
        <p className="mt-3 text-center text-sm font-bold text-slate-500">Попроси взрослого помочь с входом. Аккаунт сохранит твои успехи на разных устройствах.</p>
        {!client && !authError && <p role="status" className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-900">Облачный аккаунт ещё не настроен. Гостевой режим уже работает — прогресс останется в этом браузере.</p>}
        {(error || authError || callbackError) && (
          <p role="alert" className="mt-5 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-800">
            {error ?? authError ?? "Не удалось завершить вход по ссылке. Попробуй снова или войди с почтой и паролем."}
          </p>
        )}
        {notice && <p role="status" className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800">{notice}</p>}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-extrabold">Почта родителя
            <input name="email" type="email" autoComplete="email" required disabled={disabled} className={inputClass} />
          </label>
          <label className="block text-sm font-extrabold">Пароль
            <input name="password" type="password" autoComplete={signup ? "new-password" : "current-password"} minLength={signup ? 8 : 1} required disabled={disabled} className={inputClass} />
          </label>
          {signup && <p className="text-xs font-bold text-slate-500">Минимум 8 символов. Не используй имя ребёнка в пароле.</p>}
          <button type="submit" disabled={disabled} className={`${buttonClass} border-violet-700 bg-violet-500 text-white`}>
            <Mail size={18} className="mr-2 inline" aria-hidden="true" />{pending ? "Подожди немного…" : signup ? "Создать аккаунт" : "Войти"}
          </button>
        </form>
        <button type="button" disabled={disabled} onClick={google} className={`mt-4 ${buttonClass} border-slate-200 bg-slate-50 text-slate-700`}>Продолжить с Google</button>
        <button type="button" disabled={pending || isLoading} onClick={() => { setSignup(!signup); setError(null); setNotice(null); }} className="mt-3 min-h-12 w-full rounded-xl px-2 text-sm font-black text-violet-700 disabled:opacity-50">
          {signup ? "Уже есть аккаунт? Войти" : "Впервые здесь? Создать аккаунт"}
        </button>
      </section>
      <EntryLink href="/" className="mt-5 flex min-h-14 items-center justify-center rounded-2xl bg-emerald-100 px-4 font-black text-emerald-800">Играть без аккаунта</EntryLink>
      <p className="mt-3 text-center text-xs font-bold text-slate-500">В новый аккаунт перенесутся гостевые успехи. Если облачный прогресс уже есть, загрузится именно он.</p>
    </main>
  );
}
