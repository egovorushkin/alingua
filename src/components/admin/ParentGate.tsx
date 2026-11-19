"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { useCurriculum } from "@/context/CurriculumContext";

function subscribe(notify: () => void) {
  window.addEventListener("storage", notify);
  return () => window.removeEventListener("storage", notify);
}
async function digest(pin: string, salt: string) {
  const result = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${pin}`));
  return Array.from(new Uint8Array(result), (value) => value.toString(16).padStart(2, "0")).join("");
}

export default function ParentGate({ children }: { children: (lock: () => void) => ReactNode }) {
  const { storageKey, isHydrated } = useCurriculum();
  const pinKey = `${storageKey}:parent-pin`;
  const stored = useSyncExternalStore(subscribe, () => {
    try { return localStorage.getItem(pinKey) ?? ""; } catch { return "unavailable"; }
  }, () => null);
  const [unlocked, setUnlocked] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = () => setUnlocked(null);
  useEffect(() => {
    if (!unlocked) return;
    const lock = () => setUnlocked(null);
    const timer = setTimeout(lock, 15 * 60 * 1000);
    window.addEventListener("popstate", lock);
    return () => { clearTimeout(timer); window.removeEventListener("popstate", lock); };
  }, [unlocked]);
  if (!isHydrated || stored === null) return <p role="status" className="p-8 text-center font-bold">Загружаем родительскую панель…</p>;
  if (stored === unlocked) return children(lock);
  return (
    <main className="mx-auto max-w-lg px-5 py-12">
      <Link href="/" className="inline-flex min-h-12 items-center font-bold text-violet-800">На главную</Link>
      <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <h1 className="text-2xl font-black">Родительская панель</h1>
        <p className="mt-3 text-sm text-slate-600">PIN защищает от случайного редактирования на этом устройстве. Это не полноценная авторизация. Он не передаётся в облако. Панель блокируется через 15 минут.</p>
        <form className="mt-6 space-y-4" onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          const form = event.currentTarget;
          const data = new FormData(form);
          const pin = String(data.get("pin") ?? "");
          if (!/^\d{4,8}$/.test(pin)) { setError("PIN должен содержать от 4 до 8 цифр."); return; }
          setBusy(true);
          try {
            if (stored === "") {
              if (pin !== data.get("confirm")) throw new Error("PIN-коды не совпадают.");
              const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)), (value) => value.toString(16).padStart(2, "0")).join("");
              const record = JSON.stringify({ salt, hash: await digest(pin, salt) });
              localStorage.setItem(pinKey, record);
              form.reset();
              setUnlocked(record);
            } else {
              const record: unknown = JSON.parse(stored);
              if (!record || typeof record !== "object" || !("salt" in record) || !("hash" in record) || typeof record.salt !== "string" || typeof record.hash !== "string" || !/^[a-f0-9]{32}$/.test(record.salt) || !/^[a-f0-9]{64}$/.test(record.hash)) throw new Error("Запись PIN повреждена. Проверь локальное хранилище браузера.");
              if (await digest(pin, record.salt) !== record.hash) throw new Error("Неверный PIN.");
              form.reset();
              setUnlocked(stored);
            }
          } catch (error) { setError(error instanceof Error ? error.message : "Не удалось открыть панель. Проверь доступ к хранилищу и HTTPS."); }
          finally { setBusy(false); }
        }}>
          <label className="block font-bold">{stored === "" ? "Создайте родительский PIN" : "Родительский PIN"}<input name="pin" type="password" inputMode="numeric" pattern="[0-9]{4,8}" maxLength={8} required autoComplete="off" className="mt-2 min-h-12 w-full rounded-xl border-2 border-slate-200 px-3" /></label>
          {stored === "" && <label className="block font-bold">Повторите PIN<input name="confirm" type="password" inputMode="numeric" pattern="[0-9]{4,8}" maxLength={8} required autoComplete="off" className="mt-2 min-h-12 w-full rounded-xl border-2 border-slate-200 px-3" /></label>}
          {stored === "unavailable" && <p role="alert" className="font-bold text-red-700">Хранилище браузера недоступно. Разрешите локальное сохранение.</p>}
          {error && <p role="alert" className="font-bold text-red-700">{error}</p>}
          <button type="submit" disabled={busy || stored === "unavailable"} className="min-h-12 w-full rounded-xl bg-violet-700 px-5 font-bold text-white disabled:opacity-50">{busy ? "Проверяем…" : stored === "" ? "Сохранить PIN и открыть" : "Открыть панель"}</button>
        </form>
      </section>
    </main>
  );
}
