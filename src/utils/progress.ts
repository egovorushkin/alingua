import { adventureChestReward, getAdventureNodes } from "../data/adventure.ts";
import { bossReward, type AdventureChapter } from "../data/lessons.ts";

export interface TopicResult {
  accuracy: number;
  xp: number;
  stars: number;
  bonusStars?: number;
  completions?: number;
  completedDates?: string[];
  soundCheck?: boolean;
}

export interface ProgressState {
  stars: number;
  streak: number;
  lastActiveDate: string;
  completedTopics: string[];
  learnedWordsCount: number;
  lastClaimedDate: string;
  consecutiveDays: number;
}

export interface SavedProgress extends ProgressState {
  topicResults: Progress;
  bestStreak: number;
  dailyBonusBadge: boolean;
  claimedMapChests: string[];
  completedBosses: string[];
}

export const progressStorageKey = "alingua_user_progress_v1";
export const dailyBonusRewards = [10, 20, 30, 40, 50, 60, 100] as const;
const legacyStorageKey = "alingua.progress.v1";
const changeEvent = "alingua-progress";
export type Progress = Record<string, TopicResult>;
const persistenceErrors = new Map<string, string>();

export function accountProgressKey(userId: string) {
  if (!userId) throw new Error("An account ID is required.");
  return `${progressStorageKey}:${userId}`;
}

export interface CloudCache {
  progress: SavedProgress;
  revision: number | null;
  dirty: boolean;
}

export function parseCloudCache(raw: string | null): CloudCache | null {
  if (raw === null) return null;
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== "object" || !("_sync" in data)) throw new Error("Missing cloud cache metadata.");
  const meta = data._sync;
  if (
    !meta || typeof meta !== "object" || !("revision" in meta) || !("dirty" in meta) ||
    (meta.revision !== null && (!isCount(meta.revision) || meta.revision < 1)) ||
    typeof meta.dirty !== "boolean"
  ) throw new Error("Invalid cloud cache metadata.");
  return { progress: parseSavedProgress(raw), revision: meta.revision, dirty: meta.dirty };
}

function reportStorageError(storageKey: string) {
  persistenceErrors.set(storageKey, "Не удалось сохранить прогресс. Попроси взрослого проверить настройки хранилища браузера. Если данные повреждены, нужно сбросить прогресс.");
  window.dispatchEvent(new Event(changeEvent));
}

export function cacheCloudProgress(storageKey: string, progress: SavedProgress, revision: number | null, dirty: boolean) {
  if (storageKey === progressStorageKey) throw new Error("Cloud progress requires an account-scoped cache.");
  const raw = JSON.stringify({ ...progress, _sync: { revision, dirty } });
  parseCloudCache(raw);
  try {
    if (window.localStorage.getItem(storageKey) !== raw || persistenceErrors.has(storageKey)) {
      window.localStorage.setItem(storageKey, raw);
      persistenceErrors.delete(storageKey);
      window.dispatchEvent(new Event(changeEvent));
    }
  } catch (error) {
    reportStorageError(storageKey);
    throw error;
  }
}

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
      ("bonusStars" in result && (!isCount(result.bonusStars) || !Number.isSafeInteger(Number(result.stars) + Number(result.bonusStars)))) ||
      ("completions" in result && (!Number.isSafeInteger(result.completions) || Number(result.completions) < 1)) ||
      ("completedDates" in result && (!Array.isArray(result.completedDates) || !result.completedDates.every(isDateKey))) ||
      ("soundCheck" in result && typeof result.soundCheck !== "boolean")
    ) throw new Error("Invalid saved progress.");
  }
  return data as Progress;
}

export function subscribeProgress(onChange: () => void, storageKey = progressStorageKey) {
  let midnightTimer: ReturnType<typeof setTimeout>;
  function scheduleMidnight() {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    midnightTimer = setTimeout(refreshDate, midnight.getTime() - now.getTime());
  }
  function refreshDate() {
    clearTimeout(midnightTimer);
    onChange();
    scheduleMidnight();
  }
  function onStorage(event: StorageEvent) {
    if (event.key === null || event.key === storageKey || (storageKey === progressStorageKey && event.key === legacyStorageKey)) {
      persistenceErrors.delete(storageKey);
      onChange();
    }
  }
  window.addEventListener("storage", onStorage);
  window.addEventListener(changeEvent, onChange);
  window.addEventListener("focus", refreshDate);
  scheduleMidnight();
  return () => {
    clearTimeout(midnightTimer);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(changeEvent, onChange);
    window.removeEventListener("focus", refreshDate);
  };
}

function recordLessonResult(progress: Progress, topicId: string, result: TopicResult, today: string): Progress {
  const previous = progress[topicId];
  return {
    ...progress,
    [topicId]: {
      accuracy: Math.max(previous?.accuracy ?? 0, result.accuracy),
      xp: Math.max(previous?.xp ?? 0, result.xp),
      stars: Math.max(previous?.stars ?? 0, result.stars),
      bonusStars: Math.max(previous?.bonusStars ?? 0, result.bonusStars ?? 0),
      completions: (previous ? previous.completions ?? 1 : 0) + 1,
      completedDates: [...new Set([...(previous?.completedDates ?? []), today])].sort(),
      soundCheck: Boolean(previous?.soundCheck || result.soundCheck),
    },
  };
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
    stars: results.reduce((sum, result) => sum + result.stars + (result.bonusStars ?? 0), 0),
    xp: results.reduce((sum, result) => sum + result.xp, 0),
    wordsLearned: completed.reduce((sum, topic) => sum + topic.total, 0),
    lessonsCompleted: results.reduce((sum, result) => sum + (result.completions ?? 1), 0),
    accuracy: results.length ? Math.round(results.reduce((sum, result) => sum + result.accuracy, 0) / results.length) : 0,
    soundCheck: results.some((result) => result.soundCheck),
  };
}

export function initialProgress(): SavedProgress {
  return {
    stars: 0, streak: 0, lastActiveDate: "", completedTopics: [],
    learnedWordsCount: 0, topicResults: {}, bestStreak: 0,
    lastClaimedDate: "", consecutiveDays: 0, dailyBonusBadge: false,
    claimedMapChests: [], completedBosses: [],
  };
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function assertTopic(topicId: string, wordsCount: number) {
  if (!topicId.trim() || ["__proto__", "constructor", "prototype"].includes(topicId) || !isCount(wordsCount)) {
    throw new Error("A topic ID and a non-negative whole word count are required.");
  }
}

function isIdList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((id: unknown) =>
    typeof id === "string" && id.trim() && !["__proto__", "constructor", "prototype"].includes(id))
    && new Set(value).size === value.length;
}

export function parseSavedProgress(raw: string | null): SavedProgress {
  if (raw === null) return initialProgress();
  const data: unknown = JSON.parse(raw);
  if (
    !data || typeof data !== "object" || Array.isArray(data) ||
    !("stars" in data) || !isCount(data.stars) ||
    !("streak" in data) || !isCount(data.streak) ||
    !("lastActiveDate" in data) || (data.lastActiveDate !== "" && !isDateKey(data.lastActiveDate)) ||
    !("completedTopics" in data) || !isIdList(data.completedTopics) ||
    !("learnedWordsCount" in data) || !isCount(data.learnedWordsCount) ||
    (data.lastActiveDate === "" ? data.streak !== 0 : data.streak < 1)
  ) throw new Error("Invalid saved progress.");
  const topicResults = parseProgress(JSON.stringify("topicResults" in data ? data.topicResults : {}));
  const bestStreak = "bestStreak" in data ? data.bestStreak : data.streak;
  if (!isCount(bestStreak) || bestStreak < data.streak) throw new Error("Invalid best streak.");
  const lastClaimedDate = "lastClaimedDate" in data ? data.lastClaimedDate : "";
  const consecutiveDays = "consecutiveDays" in data ? data.consecutiveDays : 0;
  const dailyBonusBadge = "dailyBonusBadge" in data ? data.dailyBonusBadge : false;
  const claimedMapChests = "claimedMapChests" in data ? data.claimedMapChests : [];
  if (!isIdList(claimedMapChests)) throw new Error("Invalid adventure chest progress.");
  const completedBosses = "completedBosses" in data ? data.completedBosses : [];
  if (!isIdList(completedBosses)) throw new Error("Invalid chapter boss progress.");
  if (
    (lastClaimedDate !== "" && !isDateKey(lastClaimedDate)) ||
    !isCount(consecutiveDays) ||
    (lastClaimedDate === "" ? consecutiveDays !== 0 : consecutiveDays < 1) ||
    typeof dailyBonusBadge !== "boolean"
  ) throw new Error("Invalid daily bonus progress.");
  return {
    stars: data.stars, streak: data.streak, lastActiveDate: data.lastActiveDate,
    completedTopics: data.completedTopics, learnedWordsCount: data.learnedWordsCount,
    topicResults, bestStreak, lastClaimedDate, consecutiveDays, dailyBonusBadge, claimedMapChests, completedBosses,
  };
}

export function migrateProgress(raw: string | null, topics: readonly { id: string; total: number }[], today: string | null): SavedProgress {
  const progress = parseProgress(raw);
  const dates = [...new Set(topics.flatMap((topic) => progress[topic.id]?.completedDates ?? []))]
    .filter((date) => today !== null && date <= today).sort();
  const lastActiveDate = dates.at(-1) ?? "";
  const summary = getProgressSummary(progress, topics, lastActiveDate || null);
  return {
    ...initialProgress(),
    stars: summary.stars,
    streak: summary.streak,
    lastActiveDate,
    completedTopics: topics.filter((topic) => progress[topic.id]).map((topic) => topic.id),
    learnedWordsCount: summary.wordsLearned,
    topicResults: progress,
    bestStreak: summary.bestStreak,
  };
}

export function markActive(state: SavedProgress, today: string): SavedProgress {
  if (!isDateKey(today)) throw new Error("A valid local activity date is required.");
  if (state.lastActiveDate && today <= state.lastActiveDate) return state;
  const daysApart = state.lastActiveDate
    ? (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${state.lastActiveDate}T00:00:00Z`)) / 86_400_000
    : Infinity;
  const streak = daysApart === 1 ? state.streak + 1 : 1;
  return {
    ...state,
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    lastActiveDate: today,
  };
}

export function getDailyBonus(state: SavedProgress, today: string) {
  if (!isDateKey(today)) throw new Error("A valid local bonus date is required.");
  const daysApart = state.lastClaimedDate
    ? (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${state.lastClaimedDate}T00:00:00Z`)) / 86_400_000
    : Infinity;
  const canClaim = !state.lastClaimedDate || today > state.lastClaimedDate;
  const consecutiveDays = canClaim ? daysApart === 1 ? state.consecutiveDays + 1 : 1 : state.consecutiveDays;
  const day = ((consecutiveDays - 1) % dailyBonusRewards.length) + 1;
  return {
    today, canClaim, consecutiveDays, day, stars: dailyBonusRewards[day - 1],
    recovering: Boolean(state.lastClaimedDate && daysApart > 1),
  };
}

export function collectDailyBonus(state: SavedProgress, today: string): SavedProgress {
  const bonus = getDailyBonus(state, today);
  if (!bonus.canClaim) return state;
  if (!Number.isSafeInteger(bonus.consecutiveDays)) throw new Error("Daily bonus streak exceeds the safe integer range.");
  return {
    ...rewardStars(markActive(state, today), bonus.stars),
    lastClaimedDate: today,
    consecutiveDays: bonus.consecutiveDays,
    dailyBonusBadge: state.dailyBonusBadge || bonus.consecutiveDays >= dailyBonusRewards.length,
  };
}

export function finishTopic(state: SavedProgress, topicId: string, wordsCount: number, today: string): SavedProgress {
  assertTopic(topicId, wordsCount);
  const active = markActive(state, today);
  if (active.completedTopics.includes(topicId)) return active;
  if (!Number.isSafeInteger(active.learnedWordsCount + wordsCount)) throw new Error("Learned word count exceeds the safe integer range.");
  return {
    ...active,
    completedTopics: [...active.completedTopics, topicId],
    learnedWordsCount: active.learnedWordsCount + wordsCount,
  };
}

export function rewardStars(state: SavedProgress, amount: number): SavedProgress {
  if (!isCount(amount) || !Number.isSafeInteger(state.stars + amount)) {
    throw new Error("Stars must be a non-negative whole number within the safe integer range.");
  }
  return { ...state, stars: state.stars + amount };
}

export function collectAdventureChest(state: SavedProgress, chapterId: string, chapters?: readonly AdventureChapter[]): SavedProgress {
  const chest = getAdventureNodes(state.completedTopics, state.claimedMapChests, state.completedBosses, chapters)
    .find((node) => node.kind === "chest" && node.chapterId === chapterId);
  if (!chest) throw new Error("Unknown adventure chapter.");
  if (chest.state === "locked") throw new Error("Complete the preceding lessons before claiming this chest.");
  if (chest.state === "completed") return state;
  return { ...rewardStars(state, adventureChestReward), claimedMapChests: [...state.claimedMapChests, chapterId] };
}

export function completeBoss(state: SavedProgress, chapterId: string, today: string, chapters?: readonly AdventureChapter[]): SavedProgress {
  const boss = getAdventureNodes(state.completedTopics, state.claimedMapChests, state.completedBosses, chapters)
    .find((node) => node.kind === "boss" && node.chapterId === chapterId);
  if (!boss) throw new Error("Unknown boss chapter.");
  if (boss.state === "locked") throw new Error("Complete the preceding chapter challenges first.");
  const active = markActive(state, today);
  if (boss.state === "completed") return active;
  return { ...rewardStars(active, bossReward), completedBosses: [...active.completedBosses, chapterId] };
}

export function completeLesson(state: SavedProgress, topicId: string, wordsCount: number, result: TopicResult, today: string): SavedProgress {
  assertTopic(topicId, wordsCount);
  parseProgress(JSON.stringify({ [topicId]: result }));
  const completed = finishTopic(state, topicId, wordsCount, today);
  return {
    ...rewardStars(completed,
      Math.max(0, result.stars - (state.topicResults[topicId]?.stars ?? 0)) +
      Math.max(0, (result.bonusStars ?? 0) - (state.topicResults[topicId]?.bonusStars ?? 0))),
    topicResults: recordLessonResult(state.topicResults, topicId, result, today),
  };
}

export interface ProgressSnapshot {
  raw: string | null;
  legacy: string | null;
  today: string | null;
  error: string | null;
}

export const serverProgressSnapshot = JSON.stringify({ raw: null, legacy: null, today: null, error: null });

export function getProgressSnapshot(storageKey = progressStorageKey): string {
  if (typeof window === "undefined") return serverProgressSnapshot;
  try {
    const raw = window.localStorage.getItem(storageKey);
    return JSON.stringify({
      raw, legacy: raw === null && storageKey === progressStorageKey ? window.localStorage.getItem(legacyStorageKey) : null,
      today: localDateKey(new Date()), error: persistenceErrors.get(storageKey) ?? null,
    });
  } catch {
    return JSON.stringify({ raw: null, legacy: null, today: null, error: "Хранилище браузера недоступно. Не удалось загрузить или сохранить прогресс." });
  }
}

export function readProgressSnapshot(snapshot: ProgressSnapshot, topics: readonly { id: string; total: number }[]) {
  return snapshot.raw === null ? migrateProgress(snapshot.legacy, topics, snapshot.today) : parseSavedProgress(snapshot.raw);
}

export function updateStoredProgress(
  topics: readonly { id: string; total: number }[],
  update: (state: SavedProgress, today: string) => SavedProgress,
  reset = false,
  storageKey = progressStorageKey,
) {
  if (typeof window === "undefined") throw new Error("Progress can only be changed in the browser.");
  try {
    const snapshot: ProgressSnapshot = JSON.parse(getProgressSnapshot(storageKey));
    if (snapshot.today === null) throw new Error("Browser storage is unavailable.");
    const cloud = storageKey !== progressStorageKey;
    const cache = cloud ? parseCloudCache(snapshot.raw) : null;
    const previous = reset ? initialProgress() : cache?.progress ?? readProgressSnapshot(snapshot, topics);
    const next = update(previous, snapshot.today);
    const serialized = JSON.stringify(cloud ? {
      ...next,
      _sync: { revision: cache?.revision ?? null, dirty: reset || !cache || cache.dirty || JSON.stringify(previous) !== JSON.stringify(next) },
    } : next);
    parseSavedProgress(serialized);
    if (serialized !== snapshot.raw) window.localStorage.setItem(storageKey, serialized);
    persistenceErrors.delete(storageKey);
    window.dispatchEvent(new Event(changeEvent));
  } catch (error) {
    reportStorageError(storageKey);
    throw error;
  }
}
