import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { SyncState } from "./sync";
import { curriculumKey, emptyCurriculum, parseCurriculum, type CurriculumEdits } from "../../data/curriculum.ts";
import { readCurriculumCache, subscribeCurriculum, writeCurriculumCache, type CurriculumCache } from "../curriculum-store.ts";

function canonical(value: CurriculumEdits) {
  return JSON.stringify(value);
}

export function startCurriculumSync(client: SupabaseClient<Database>, userId: string, notify: (state: SyncState) => void) {
  const key = curriculumKey(userId);
  let active = true, running = false, requested = false, pull = true, conflict = false;
  let choice: "local" | "cloud" | null = null;
  function reportConflict() {
    conflict = true;
    notify({ status: "conflict", error: "Каталог изменён на другом устройстве. Локальная копия сохранена. Выбери, какую версию оставить." });
  }
  function acknowledge(sent: CurriculumCache, revision: number) {
    const latest = readCurriculumCache(key);
    if (!latest || latest.revision !== sent.revision) { pull = true; requested = true; return; }
    writeCurriculumCache(key, { ...latest, revision, dirty: canonical(latest.edits) !== canonical(sent.edits) });
  }
  async function drain() {
    if (!active || running || conflict) return;
    running = true;
    try {
      while (active && requested && !conflict) {
        requested = false;
        const resolution = choice;
        choice = null;
        let cache = readCurriculumCache(key);
        if (pull || resolution || !cache) {
          pull = false;
          notify({ status: "loading", error: null });
          const before = canonical(cache?.edits ?? emptyCurriculum());
          const { data: remote, error } = await client.from("user_curricula").select("*").eq("user_id", userId).maybeSingle();
          if (error) throw error;
          if (!active) return;
          cache = readCurriculumCache(key);
          if (remote) {
            if (remote.user_id !== userId || !Number.isSafeInteger(remote.revision) || remote.revision < 1) throw new Error("Invalid curriculum owner or revision.");
            const edits = parseCurriculum(remote.content);
            if (resolution === "cloud") {
              if (before !== canonical(cache?.edits ?? emptyCurriculum())) { reportConflict(); return; }
              writeCurriculumCache(key, { edits, revision: remote.revision, dirty: false });
            } else if (resolution === "local") {
              if (!cache) throw new Error("There is no local curriculum.");
              writeCurriculumCache(key, { ...cache, revision: remote.revision, dirty: true });
            } else if (cache?.dirty && canonical(cache.edits) !== canonical(edits) && cache.revision !== remote.revision) {
              reportConflict(); return;
            } else if (!cache?.dirty || canonical(cache.edits) === canonical(edits)) {
              writeCurriculumCache(key, { edits, revision: remote.revision, dirty: false });
            }
          } else {
            if (resolution === "cloud") throw new Error("There is no cloud curriculum.");
            if (!cache) {
              const guest = readCurriculumCache(curriculumKey(null));
              cache = { edits: guest?.edits ?? emptyCurriculum(), revision: null, dirty: true };
              writeCurriculumCache(key, cache);
            }
            const { data, error } = await client.from("user_curricula")
              .upsert({ user_id: userId, content: cache.edits }, { onConflict: "user_id", ignoreDuplicates: true }).select("*").maybeSingle();
            if (error) throw error;
            if (!active) return;
            if (data) acknowledge(cache, data.revision);
            else { pull = true; requested = true; }
          }
        }
        cache = readCurriculumCache(key);
        if (cache?.dirty) {
          if (cache.revision === null) { pull = true; requested = true; continue; }
          notify({ status: "saving", error: null });
          const { data, error } = await client.from("user_curricula").update({ content: cache.edits })
            .eq("user_id", userId).eq("revision", cache.revision).select("*").maybeSingle();
          if (error) throw error;
          if (!active) return;
          if (data) acknowledge(cache, data.revision);
          else { pull = true; requested = true; continue; }
        }
        if (active && !readCurriculumCache(key)?.dirty) notify({ status: "synced", error: null });
      }
    } catch (error) {
      pull = true;
      requested = false;
      if (active) {
        console.warn("Alingua curriculum synchronization failed.", error instanceof Error ? error.name : "DatabaseError");
        notify({ status: "error", error: "Облачный каталог недоступен. Изменения хранятся только в этом браузере. Проверь интернет и миграцию user_curricula, затем повтори синхронизацию." });
      }
    } finally { running = false; }
  }
  function request() { if (active) { requested = true; void drain(); } }
  function refresh() { pull = true; request(); }
  const unsubscribe = subscribeCurriculum(key, request);
  window.addEventListener("online", refresh);
  window.addEventListener("focus", refresh);
  queueMicrotask(request);
  return {
    retry() { conflict = false; refresh(); },
    resolve(value: "local" | "cloud") { choice = value; conflict = false; refresh(); },
    stop() { active = false; unsubscribe(); window.removeEventListener("online", refresh); window.removeEventListener("focus", refresh); },
  };
}
