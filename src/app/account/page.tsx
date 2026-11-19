"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth, authErrorMessage } from "@/context/AuthContext";
import ProgressSyncNotice from "@/components/auth/ProgressSyncNotice";

export default function AccountPage() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);
  async function logout() {
    setPending(true);
    try {
      await signOut();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setError(authErrorMessage(error));
      setPending(false);
    }
  }
  if (!user || isLoading) return <p role="status" className="p-8 text-center font-bold">Проверяем аккаунт…</p>;
  return (
    <main className="mx-auto max-w-lg px-5 py-12">
      <Link href="/" className="inline-flex min-h-12 items-center font-black text-violet-700">На главную</Link>
      <ProgressSyncNotice />
      <section className="mt-5 rounded-[32px] bg-white p-7 shadow-lg">
        <h1 className="text-3xl font-black">Облачный аккаунт</h1>
        <p className="mt-4 break-all font-bold text-slate-600">{user.email}</p>
        <p className="mt-3 text-sm font-bold text-slate-500">Успехи связаны с этим аккаунтом. Выход на этом устройстве не завершит сеансы на других устройствах.</p>
        {error && <p role="alert" className="mt-4 rounded-2xl bg-rose-50 p-3 font-bold text-rose-800">{error}</p>}
        <button type="button" disabled={pending} onClick={logout} className="mt-6 min-h-14 w-full rounded-2xl border-b-4 border-violet-700 bg-violet-500 px-4 font-black text-white disabled:opacity-50">{pending ? "Выходим…" : "Выйти из аккаунта"}</button>
      </section>
    </main>
  );
}
