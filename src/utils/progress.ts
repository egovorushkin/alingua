"use client";

import { useMemo, useSyncExternalStore } from "react";

export interface TopicResult {
  accuracy: number;
  xp: number;
  stars: number;
}

const storageKey = "alingua.progress.v1";
const changeEvent = "alingua-progress";
const storageUnavailable = "storage-unavailable";
type Progress = Record<string, TopicResult>;

export function parseProgress(raw: string | null): Progress {
  if (raw === null) return {};
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Invalid saved progress.");
  for (const result of Object.values(data)) {
    if (
      !result || typeof result !== "object" ||
      !("accuracy" in result) || !Number.isInteger(result.accuracy) || Number(result.accuracy) < 0 || Number(result.accuracy) > 100 ||
      !("xp" in result) || !Number.isSafeInteger(result.xp) || Number(result.xp) < 0 ||
      !("stars" in result) || !Number.isInteger(result.stars) || Number(result.stars) < 1 || Number(result.stars) > 3
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
  return useMemo<{ progress: Progress; error: string | null }>(() => {
    try {
      return { progress: parseProgress(raw), error: null };
    } catch {
      return { progress: {}, error: "Saved progress couldn't be read. Check your browser's storage settings before saving a lesson." };
    }
  }, [raw]);
}

export function saveProgress(topicId: string, result: TopicResult) {
  const progress = parseProgress(window.localStorage.getItem(storageKey));
  const previous = progress[topicId];
  progress[topicId] = {
    accuracy: Math.max(previous?.accuracy ?? 0, result.accuracy),
    xp: Math.max(previous?.xp ?? 0, result.xp),
    stars: Math.max(previous?.stars ?? 0, result.stars),
  };
  window.localStorage.setItem(storageKey, JSON.stringify(progress));
  window.dispatchEvent(new Event(changeEvent));
}
