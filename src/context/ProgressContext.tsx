"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { topics } from "@/app/topics";
import {
  completeLesson, finishTopic, getProgressSnapshot, getProgressSummary, initialProgress,
  markActive, readProgressSnapshot, rewardStars,
  serverProgressSnapshot, subscribeProgress, updateStoredProgress,
  type ProgressSnapshot, type SavedProgress, type TopicResult,
} from "@/utils/progress";

export type { ProgressState } from "@/utils/progress";

export interface ProgressContextValue extends SavedProgress {
  isHydrated: boolean;
  error: string | null;
  summary: ReturnType<typeof getProgressSummary>;
  addStars: (amount: number) => void;
  completeTopic: (topicId: string, wordsCount: number) => void;
  resetProgress: () => void;
  saveLessonResult: (topicId: string, wordsCount: number, result: TopicResult) => void;
}

export const ProgressContext = createContext<ProgressContextValue | null>(null);

function addStars(amount: number) {
  updateStoredProgress(topics, (state) => rewardStars(state, amount));
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
    try {
      state = readProgressSnapshot(snapshot, topics);
    } catch {
      error = "Saved progress couldn't be read. Reset progress to start again; the existing saved data has not been overwritten.";
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
      addStars, completeTopic, resetProgress, saveLessonResult,
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
