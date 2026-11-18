"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { topics } from "@/app/topics";
import {
  collectDailyBonus, completeLesson, finishTopic, getDailyBonus, getProgressSnapshot, getProgressSummary, initialProgress,
  markActive, readProgressSnapshot, rewardStars,
  serverProgressSnapshot, subscribeProgress, updateStoredProgress,
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
  claimDailyBonus: () => DailyBonusClaim | null;
  addStars: (amount: number) => void;
  completeTopic: (topicId: string, wordsCount: number) => void;
  resetProgress: () => void;
  saveLessonResult: (topicId: string, wordsCount: number, result: TopicResult) => void;
}

export const ProgressContext = createContext<ProgressContextValue | null>(null);

function addStars(amount: number) {
  updateStoredProgress(topics, (state) => rewardStars(state, amount));
}

function claimDailyBonus(): DailyBonusClaim | null {
  let reward: DailyBonusClaim | null = null;
  updateStoredProgress(topics, (state, today) => {
    const next = collectDailyBonus(state, today);
    if (next !== state) {
      reward = { stars: next.stars - state.stars, badgeUnlocked: next.dailyBonusBadge && !state.dailyBonusBadge };
    }
    return next;
  });
  return reward;
}

function completeTopic(topicId: string, wordsCount: number) {
  updateStoredProgress(topics, (state, today) => finishTopic(state, topicId, wordsCount, today));
}

function resetProgress() {
  updateStoredProgress(topics, () => initialProgress(), true);
}

function saveLessonResult(topicId: string, wordsCount: number, result: TopicResult) {
  updateStoredProgress(topics, (state, today) => completeLesson(state, topicId, wordsCount, result, today));
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const serialized = useSyncExternalStore(subscribeProgress, getProgressSnapshot, () => serverProgressSnapshot);
  const value = useMemo<ProgressContextValue>(() => {
    const snapshot: ProgressSnapshot = JSON.parse(serialized);
    let state = initialProgress();
    let error = snapshot.error;
    let dailyBonus: ProgressContextValue["dailyBonus"] = null;
    try {
      state = readProgressSnapshot(snapshot, topics);
      if (snapshot.today) dailyBonus = getDailyBonus(state, snapshot.today);
    } catch {
      error = "Не удалось прочитать прогресс. Сохранённые данные не изменены. Чтобы начать заново, нужно сбросить прогресс.";
    }
    const summary = getProgressSummary(state.topicResults, topics, snapshot.today);
    return {
      ...state,
      isHydrated: serialized !== serverProgressSnapshot,
      error,
      summary: {
        ...summary, stars: state.stars, streak: state.streak, wordsLearned: state.learnedWordsCount,
        bestStreak: state.bestStreak,
        lessonsCompleted: summary.lessonsCompleted + state.completedTopics.filter((id) => !state.topicResults[id]).length,
      },
      dailyBonus, claimDailyBonus, addStars, completeTopic, resetProgress, saveLessonResult,
    };
  }, [serialized]);

  useEffect(() => {
    try {
      updateStoredProgress(topics, (state, today) => markActive(state, today));
    } catch (error) {
      console.warn("Alingua progress could not be initialized.", error);
    }
  }, []);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const value = useContext(ProgressContext);
  if (!value) throw new Error("useProgress must be used within a ProgressProvider.");
  return value;
}
