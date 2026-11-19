import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ProgressRow } from "./database.types";
import {
  accountProgressKey, cacheCloudProgress, getProgressSnapshot, parseCloudCache, parseSavedProgress,
  readProgressSnapshot, subscribeProgress, type CloudCache, type ProgressSnapshot, type SavedProgress,
} from "../../utils/progress.ts";

export type SyncState = {
  status: "local" | "loading" | "saving" | "synced" | "error" | "conflict";
  error: string | null;
};

export function progressToRow(progress: SavedProgress): Omit<ProgressRow, "user_id" | "revision" | "updated_at"> {
  return {
    stars: progress.stars, streak: progress.streak, last_active_date: progress.lastActiveDate || null,
    completed_topics: progress.completedTopics, learned_words_count: progress.learnedWordsCount,
    topic_results: progress.topicResults, best_streak: progress.bestStreak,
    last_claimed_date: progress.lastClaimedDate || null, consecutive_days: progress.consecutiveDays,
    daily_bonus_badge: progress.dailyBonusBadge,
  };
}

export function progressFromRow(row: ProgressRow, userId: string) {
  if (row.user_id !== userId || !Number.isSafeInteger(row.revision) || row.revision < 1) throw new Error("Invalid cloud progress owner or revision.");
  return parseSavedProgress(JSON.stringify({
    stars: row.stars, streak: row.streak, lastActiveDate: row.last_active_date ?? "",
    completedTopics: row.completed_topics, learnedWordsCount: row.learned_words_count,
    topicResults: row.topic_results, bestStreak: row.best_streak,
    lastClaimedDate: row.last_claimed_date ?? "", consecutiveDays: row.consecutive_days,
    dailyBonusBadge: row.daily_bonus_badge,
  }));
}

function canonical(progress: SavedProgress) {
  return JSON.stringify(progress, (_key, value: unknown) =>
    value && typeof value === "object" && !Array.isArray(value)
      ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)))
      : value);
}
const same = (left: SavedProgress, right: SavedProgress) => canonical(left) === canonical(right);

export function startProgressSync(
  client: SupabaseClient<Database>, userId: string,
  topics: readonly { id: string; total: number }[], notify: (state: SyncState) => void,
) {
  const key = accountProgressKey(userId);
  let active = true;
  let running = false;
  let requested = false;
  let pull = true;
  let conflicted = false;
  let resolution: "local" | "cloud" | null = null;

  function snapshot() {
    const value: ProgressSnapshot = JSON.parse(getProgressSnapshot(key));
    if (!value.today) throw new Error("Local storage is unavailable.");
    return value;
  }
  async function fetchRemote() {
    const { data, error } = await client.from("user_progress").select("*").eq("user_id", userId).maybeSingle();
    if (error) throw error;
    if (data) progressFromRow(data, userId);
    return data;
  }
  function conflict() {
    conflicted = true;
    notify({ status: "conflict", error: "На другом устройстве тоже изменился прогресс. Обе копии сохранены отдельно. Выбери, какую оставить; звёзды автоматически не складываются." });
  }
  function acknowledge(sent: CloudCache, row: ProgressRow) {
    const saved = progressFromRow(row, userId);
    const latest = parseCloudCache(snapshot().raw);
    if (!latest || latest.revision !== sent.revision) {
      pull = true;
      requested = true;
      return;
    }
    cacheCloudProgress(key, latest.progress, row.revision, !same(latest.progress, saved));
  }

  async function drain() {
    if (!active || running || conflicted) return;
    running = true;
    try {
      while (active && requested && !conflicted) {
        requested = false;
        const choice = resolution;
        resolution = null;
        const before = snapshot().raw;
        let cache = choice === "cloud" ? null : parseCloudCache(before);
        if (pull || choice || !cache) {
          pull = false;
          notify({ status: "loading", error: null });
          const remote = await fetchRemote();
          if (!active) return;
          const after = snapshot().raw;
          if (choice === "cloud") {
            if (!remote) throw new Error("There is no cloud copy to restore.");
            if (before !== after) { conflict(); return; }
            cacheCloudProgress(key, progressFromRow(remote, userId), remote.revision, false);
          } else {
            cache = parseCloudCache(after);
            if (remote) {
              const cloud = progressFromRow(remote, userId);
              if (choice === "local") {
                if (!cache) throw new Error("There is no valid local copy.");
                cacheCloudProgress(key, cache.progress, remote.revision, true);
              } else if (cache?.dirty && same(cache.progress, cloud)) {
                cacheCloudProgress(key, cloud, remote.revision, false);
              } else if (
                (cache?.dirty && cache.revision !== remote.revision) ||
                (cache && cache.revision !== null && cache.revision > remote.revision)
              ) { conflict(); return; }
              else if (!cache?.dirty) cacheCloudProgress(key, cloud, remote.revision, false);
            } else {
              if (!cache) {
                const guest: ProgressSnapshot = JSON.parse(getProgressSnapshot());
                if (!guest.today) throw new Error("Guest storage is unavailable.");
                cacheCloudProgress(key, readProgressSnapshot(guest, topics), null, true);
                cache = parseCloudCache(snapshot().raw);
              }
              if (!cache) throw new Error("Cloud import could not be cached.");
              notify({ status: "saving", error: null });
              const { data, error } = await client.from("user_progress")
                .upsert({ user_id: userId, ...progressToRow(cache.progress) }, { onConflict: "user_id", ignoreDuplicates: true })
                .select("*").maybeSingle();
              if (error) throw error;
              if (!active) return;
              if (data) acknowledge(cache, data);
              else { pull = true; requested = true; }
            }
          }
        }
        cache = parseCloudCache(snapshot().raw);
        if (cache?.dirty) {
          if (cache.revision === null) { pull = true; requested = true; continue; }
          notify({ status: "saving", error: null });
          const { data, error } = await client.from("user_progress").update(progressToRow(cache.progress))
            .eq("user_id", userId).eq("revision", cache.revision).select("*").maybeSingle();
          if (error) throw error;
          if (!active) return;
          if (data) acknowledge(cache, data);
          else { pull = true; requested = true; continue; }
        }
        if (active && !parseCloudCache(snapshot().raw)?.dirty) notify({ status: "synced", error: null });
      }
    } catch (error) {
      pull = true;
      requested = false;
      if (active) {
        console.warn("Alingua cloud synchronization failed.", error instanceof Error ? error.name : "DatabaseError");
        notify({ status: "error", error: "Не удалось синхронизировать прогресс. Локальные данные не удалены. Проверь интернет и настройки Supabase, затем повтори." });
      }
    } finally {
      running = false;
    }
  }
  function request() {
    if (!active) return;
    requested = true;
    void drain();
  }
  function refresh() { pull = true; request(); }
  const unsubscribe = subscribeProgress(request, key);
  window.addEventListener("online", refresh);
  window.addEventListener("focus", refresh);
  queueMicrotask(request);
  return {
    retry() { conflicted = false; refresh(); },
    resolve(choice: "local" | "cloud") { resolution = choice; conflicted = false; refresh(); },
    stop() {
      active = false;
      unsubscribe();
      window.removeEventListener("online", refresh);
      window.removeEventListener("focus", refresh);
    },
  };
}
