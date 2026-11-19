"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { buildCatalog, curriculumKey, emptyCurriculum, type CurriculumEdits } from "@/data/curriculum";
import { changeCurriculum, getCurriculumSnapshot, parseCurriculumCache, serverCurriculumSnapshot, subscribeCurriculum } from "@/lib/curriculum-store";
import { startCurriculumSync } from "@/lib/supabase/curriculum-sync";
import type { SyncState } from "@/lib/supabase/sync";

interface CurriculumValue extends ReturnType<typeof buildCatalog> {
  storageKey: string;
  isHydrated: boolean;
  error: string | null;
  sync: SyncState;
  update: (change: (edits: CurriculumEdits) => CurriculumEdits) => void;
  retry: () => void;
  resolve: (choice: "local" | "cloud") => void;
}
const Context = createContext<CurriculumValue | null>(null);

function CurriculumSession({ children, userId, pending }: { children: ReactNode; userId: string | null; pending: boolean }) {
  const { client } = useAuth();
  const key = curriculumKey(userId);
  const store = useMemo(() => ({
    subscribe: (notify: () => void) => subscribeCurriculum(key, notify),
    getSnapshot: () => getCurriculumSnapshot(key),
  }), [key]);
  const raw = useSyncExternalStore(store.subscribe, store.getSnapshot, () => serverCurriculumSnapshot);
  const [sync, setSync] = useState<SyncState>({ status: userId ? "loading" : "local", error: null });
  const controller = useRef<ReturnType<typeof startCurriculumSync> | null>(null);
  const parsed = useMemo(() => {
    const snapshot: { raw: string | null; error: string | null } = JSON.parse(raw);
    try { return { cache: parseCurriculumCache(snapshot.raw), error: snapshot.error, valid: true }; }
    catch (error) { return { cache: null, error: error instanceof Error ? error.message : "Не удалось прочитать каталог.", valid: false }; }
  }, [raw]);
  const edits = JSON.stringify(parsed.cache?.edits ?? emptyCurriculum());
  const catalog = useMemo(() => buildCatalog(JSON.parse(edits)), [edits]);
  const isHydrated = !pending && raw !== serverCurriculumSnapshot && !(userId && !parsed.cache && sync.status === "loading");
  useEffect(() => {
    if (!userId || !client) return;
    const sync = startCurriculumSync(client, userId, setSync);
    controller.current = sync;
    return () => { sync.stop(); controller.current = null; };
  }, [client, userId]);
  return (
    <Context.Provider value={{
      ...catalog, storageKey: key,
      isHydrated,
      error: parsed.error, sync,
      update(change) {
        if (!isHydrated || !parsed.valid) throw new Error(parsed.error ?? "Каталог ещё загружается.");
        changeCurriculum(key, change);
      },
      retry: () => controller.current?.retry(),
      resolve: (choice) => controller.current?.resolve(choice),
    }}>{children}</Context.Provider>
  );
}

export function CurriculumProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  return <CurriculumSession key={isLoading ? "pending" : user?.id ?? "guest"} userId={isLoading ? null : user?.id ?? null} pending={isLoading}>{children}</CurriculumSession>;
}

export function useCurriculum() {
  const value = useContext(Context);
  if (!value) throw new Error("useCurriculum must be used within CurriculumProvider.");
  return value;
}

export function CurriculumNotice() {
  const { error, sync } = useCurriculum();
  return error || sync.error ? <p role="alert" className="mx-auto max-w-7xl rounded-xl bg-amber-50 p-4 text-sm font-bold text-amber-950">{error ?? sync.error}</p> : null;
}
