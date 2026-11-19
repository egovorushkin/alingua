"use client";

import Link from "next/link";
import { Cloud, CloudOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useProgress } from "@/context/ProgressContext";

export default function ProgressSyncNotice() {
  const { user, isLoading, error: authError } = useAuth();
  const { syncStatus, syncError, retrySync, resolveSync, isHydrated } = useProgress();
  const problem = syncStatus === "error" || syncStatus === "conflict";
  function choose(choice: "local" | "cloud") {
    if (confirm(choice === "cloud"
      ? "Заменить местный прогресс облачной копией? Несинхронизированные местные изменения будут потеряны."
      : "Заменить облачный прогресс копией с этого устройства? Изменения на других устройствах будут потеряны.")) resolveSync(choice);
  }
  return (
    <aside aria-label="Сохранение прогресса" className={`mb-5 rounded-2xl border p-4 text-sm font-bold ${problem || authError ? "border-amber-200 bg-amber-50 text-amber-950" : "border-violet-100 bg-white text-slate-600"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role={problem || authError ? "alert" : "status"} className="flex min-w-0 items-center gap-2">
          {problem ? <CloudOff size={20} className="shrink-0" aria-hidden="true" /> : <Cloud size={20} className="shrink-0" aria-hidden="true" />}
          <span>{authError ?? (isLoading ? "Проверяем аккаунт…" : !user ? "Гостевой режим: успехи сохраняются в этом браузере." : syncError ?? (syncStatus === "synced" ? "Прогресс сохранён в облаке." : "Синхронизируем успехи…"))}</span>
        </p>
        <Link href={user ? "/account" : "/login"} className="inline-flex min-h-11 shrink-0 items-center rounded-xl bg-violet-100 px-4 font-black text-violet-800">{user ? "Аккаунт" : "Войти и сохранить в облаке"}</Link>
      </div>
      {problem && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={retrySync} className="min-h-11 rounded-xl bg-white px-4 font-black">Повторить</button>
          <button type="button" onClick={() => choose("cloud")} className="min-h-11 rounded-xl bg-white px-4 font-black">Загрузить облачную копию</button>
          {syncStatus === "conflict" && <button type="button" disabled={!isHydrated} onClick={() => choose("local")} className="min-h-11 rounded-xl bg-white px-4 font-black disabled:opacity-50">Оставить копию с устройства</button>}
        </div>
      )}
    </aside>
  );
}
