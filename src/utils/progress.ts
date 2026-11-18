"use client";

import { useMemo, useSyncExternalStore } from "react";

export interface TopicResult {
  accuracy: number;
  xp: number;
  stars: number;
  completions?: number;
  completedDates?: string[];
  soundCheck?: boolean;
}

const storageKey = "alingua.progress.v1";
const changeEvent = "alingua-progress";
const storageUnavailable = "storage-unavailable";
type Progress = Record<string, TopicResult>;

function isDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function parseProgress(raw: string | null): Progress {
  if (raw === null) return {};
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Invalid saved progress.");
  for (const result of Object.values(data)) {
    if (
      !result || typeof result !== "object" ||
      !("accuracy" in result) || !Number.isInteger(result.accuracy) || Number(result.accuracy) < 0 || Number(result.accuracy) > 100 ||
      !("xp" in result) || !Number.isSafeInteger(result.xp) || Number(result.xp) < 0 ||
      !("stars" in result) || !Number.isInteger(result.stars) || Number(result.stars) < 1 || Number(result.stars) > 3 ||
      ("completions" in result && (!Number.isSafeInteger(result.completions) || Number(result.completions) < 1)) ||
      ("completedDates" in result && (!Array.isArray(result.completedDates) || !result.completedDates.every(isDateKey))) ||
      ("soundCheck" in result && typeof result.soundCheck !== "boolean")
    ) throw new Error("Invalid saved progress.");
  }
  return data as Progress;
}

function snapshot() {
  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return storageUnavailable;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(changeEvent, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(changeEvent, onChange);
  };
}

export function useProgress() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  const today = useSyncExternalStore(subscribe, () => localDateKey(new Date()), () => null);
  return useMemo<{ progress: Progress; error: string | null; today: string | null }>(() => {
    try {
      return { progress: parseProgress(raw), error: null, today };
    } catch {
      return { progress: {}, error: "Saved progress couldn't be read. Check your browser's storage settings before saving a lesson.", today };
    }
  }, [raw, today]);
}

export function saveProgress(topicId: string, result: TopicResult) {
  const progress = parseProgress(window.localStorage.getItem(storageKey));
  const previous = progress[topicId];
  progress[topicId] = {
    accuracy: Math.max(previous?.accuracy ?? 0, result.accuracy),
    xp: Math.max(previous?.xp ?? 0, result.xp),
    stars: Math.max(previous?.stars ?? 0, result.stars),
    completions: (previous ? previous.completions ?? 1 : 0) + 1,
    completedDates: [...new Set([...(previous?.completedDates ?? []), localDateKey(new Date())])].sort(),
    soundCheck: Boolean(previous?.soundCheck || result.soundCheck),
  };
  window.localStorage.setItem(storageKey, JSON.stringify(progress));
  window.dispatchEvent(new Event(changeEvent));
}

export function getProgressSummary(
  progress: Progress,
  topics: readonly { id: string; total: number }[],
  todayKey: string | null,
) {
  const completed = topics.filter((topic) => progress[topic.id]);
  const results = completed.map((topic) => progress[topic.id]);
  const today = todayKey ? Date.parse(`${todayKey}T00:00:00Z`) / 86_400_000 : null;
  const days = [...new Set(results.flatMap((result) => result.completedDates ?? []))]
    .map((date) => Date.parse(`${date}T00:00:00Z`) / 86_400_000)
    .filter((day) => today !== null && day <= today)
    .sort((a, b) => a - b);
  let run = 0;
  let bestStreak = 0;
  days.forEach((day, index) => {
    run = index > 0 && day === days[index - 1] + 1 ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
  });
  const lastDay = days.at(-1);
  return {
    streak: today !== null && (lastDay === today || lastDay === today - 1) ? run : 0,
    bestStreak,
    stars: results.reduce((sum, result) => sum + result.stars, 0),
    xp: results.reduce((sum, result) => sum + result.xp, 0),
    wordsLearned: completed.reduce((sum, topic) => sum + topic.total, 0),
    lessonsCompleted: results.reduce((sum, result) => sum + (result.completions ?? 1), 0),
    accuracy: results.length ? Math.round(results.reduce((sum, result) => sum + result.accuracy, 0) / results.length) : 0,
    soundCheck: results.some((result) => result.soundCheck),
  };
}
