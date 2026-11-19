"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { topics } from "@/app/topics";
import { useAuth } from "@/context/AuthContext";
import { startProgressSync, type SyncState } from "@/lib/supabase/sync";
import {
  accountProgressKey, collectAdventureChest, collectDailyBonus, completeLesson, finishTopic, getDailyBonus, getProgressSnapshot,
  getProgressSummary, initialProgress, markActive, parseCloudCache, progressStorageKey, readProgressSnapshot,
  rewardStars, serverProgressSnapshot, subscribeProgress, updateStoredProgress,
  type ProgressSnapshot, type SavedProgress, type TopicResult,
} from "@/utils/progress";

export type { ProgressState } from "@/utils/progress";

export interface DailyBonusClaim {
  stars: number;
  badgeUnlocked: boolean;
}

export interface ProgressContextValue extends SavedProgress {
  isHydrated: boolean;
  error: string | null;
  summary: ReturnType<typeof getProgressSummary>;
  dailyBonus: ReturnType<typeof getDailyBonus> | null;
  syncStatus: SyncState["status"];
  syncError: string | null;
  retrySync: () => void;
  resolveSync: (choice: "local" | "cloud") => void;
  claimDailyBonus: () => DailyBonusClaim | null;
  claimAdventureChest: (chapterId: string) => number;
  addStars: (amount: number) => void;
  completeTopic: (topicId: string, wordsCount: number) => void;
  resetProgress: () => void;
  saveLessonResult: (topicId: string, wordsCount: number, result: TopicResult) => void;
}

export const ProgressContext = createContext<ProgressContextValue | null>(null);

function ProgressSession({ children, userId, authPending }: { children: ReactNode; userId: string | null; authPending: boolean }) {
  const { client } = useAuth();
  const store = useMemo(() => {
    const key = userId ? accountProgressKey(userId) : progressStorageKey;
    return {
      key,
      getSnapshot: () => getProgressSnapshot(key),
      subscribe: (onChange: () => void) => subscribeProgress(onChange, key),
    };
  }, [userId]);
  const serialized = useSyncExternalStore(store.subscribe, store.getSnapshot, () => serverProgressSnapshot);
  const sync = useRef<ReturnType<typeof startProgressSync> | null>(null);
  const [cloud, setCloud] = useState<SyncState>({ status: userId ? "loading" : "local", error: null });
  useEffect(() => {
    if (!userId || !client) return;
    const controller = startProgressSync(client, userId, topics, setCloud);
    sync.current = controller;
    return () => { controller.stop(); sync.current = null; };
  }, [client, userId]);

  const value = useMemo<ProgressContextValue>(() => {
    const snapshot: ProgressSnapshot = JSON.parse(serialized);
    let state = initialProgress();
    let error = snapshot.error;
    let available = !authPending && serialized !== serverProgressSnapshot;
    let dailyBonus: ProgressContextValue["dailyBonus"] = null;
    try {
      if (!authPending) {
        if (userId) {
          const cache = parseCloudCache(snapshot.raw);
          available = available && cache !== null;
          if (cache) state = cache.progress;
        } else state = readProgressSnapshot(snapshot, topics);
        if (available && snapshot.today) dailyBonus = getDailyBonus(state, snapshot.today);
      }
    } catch {
      if (userId) available = false;
      error = "Не удалось прочитать прогресс. Сохранённые данные не изменены. Чтобы начать заново, нужно сбросить прогресс.";
    }
    function change(update: (state: SavedProgress, today: string) => SavedProgress, reset = false) {
      if (!available) throw new Error("Сначала нужно загрузить прогресс этого аккаунта.");
      updateStoredProgress(topics, update, reset, store.key);
    }
    const summary = getProgressSummary(state.topicResults, topics, snapshot.today);
    return {
      ...state, isHydrated: available, error, dailyBonus,
      syncStatus: cloud.status, syncError: cloud.error,
      retrySync: () => sync.current?.retry(),
      resolveSync: (choice) => sync.current?.resolve(choice),
      summary: {
        ...summary, stars: state.stars, streak: state.streak, wordsLearned: state.learnedWordsCount,
        bestStreak: state.bestStreak,
        lessonsCompleted: summary.lessonsCompleted + state.completedTopics.filter((id) => !state.topicResults[id]).length,
      },
      addStars: (amount) => change((state) => rewardStars(state, amount)),
      completeTopic: (id, count) => change((state, today) => finishTopic(state, id, count, today)),
      resetProgress: () => change(() => initialProgress(), true),
      saveLessonResult: (id, count, result) => change((state, today) => completeLesson(state, id, count, result, today)),
      claimAdventureChest(chapterId) {
        let stars = 0;
        change((state) => {
          const next = collectAdventureChest(state, chapterId);
          stars = next.stars - state.stars;
          return next;
        });
        return stars;
      },
      claimDailyBonus() {
        let reward: DailyBonusClaim | null = null;
        change((state, today) => {
          const next = collectDailyBonus(state, today);
          if (next !== state) reward = { stars: next.stars - state.stars, badgeUnlocked: next.dailyBonusBadge && !state.dailyBonusBadge };
          return next;
        });
        return reward;
      },
    };
  }, [serialized, authPending, userId, store.key, cloud]);

  useEffect(() => {
    if (!value.isHydrated) return;
    try {
      updateStoredProgress(topics, (state, today) => markActive(state, today), false, store.key);
    } catch (error) {
      console.warn("Alingua progress could not be initialized.", error);
    }
  }, [store.key, value.isHydrated]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  return <ProgressSession key={isLoading ? "pending" : user?.id ?? "guest"} userId={isLoading ? null : user?.id ?? null} authPending={isLoading}>{children}</ProgressSession>;
}

export function useProgress(): ProgressContextValue {
  const value = useContext(ProgressContext);
  if (!value) throw new Error("useProgress must be used within a ProgressProvider.");
  return value;
}
