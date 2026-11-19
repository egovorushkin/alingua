import { emptyCurriculum, parseCurriculum, type CurriculumEdits } from "../data/curriculum.ts";

export interface CurriculumCache {
  edits: CurriculumEdits;
  revision: number | null;
  dirty: boolean;
}

const eventName = "alingua-curriculum";
export const serverCurriculumSnapshot = JSON.stringify({ raw: null, error: null });
const errors = new Map<string, string>();

export function parseCurriculumCache(raw: string | null): CurriculumCache | null {
  if (raw === null) return null;
  if (raw.length > 2_000_000) throw new Error("Каталог слишком большой.");
  const value: unknown = JSON.parse(raw);
  if (
    !value || typeof value !== "object" || !("edits" in value) || !("revision" in value) || !("dirty" in value) ||
    (value.revision !== null && (typeof value.revision !== "number" || !Number.isSafeInteger(value.revision) || value.revision < 1)) ||
    typeof value.dirty !== "boolean"
  ) throw new Error("Повреждены данные каталога. Сохранённая копия не изменена.");
  return { edits: parseCurriculum(value.edits), revision: value.revision, dirty: value.dirty };
}

export function getCurriculumSnapshot(key: string) {
  if (typeof window === "undefined") return serverCurriculumSnapshot;
  try { return JSON.stringify({ raw: window.localStorage.getItem(key), error: errors.get(key) ?? null, hydrated: true }); }
  catch { return JSON.stringify({ raw: null, error: "Хранилище браузера недоступно. Каталог нельзя сохранить." }); }
}

export function readCurriculumCache(key: string) {
  const snapshot: { raw: string | null; error: string | null } = JSON.parse(getCurriculumSnapshot(key));
  if (snapshot.error) throw new Error(snapshot.error);
  return parseCurriculumCache(snapshot.raw);
}

export function subscribeCurriculum(key: string, notify: () => void) {
  const onStorage = (event: StorageEvent) => { if (event.key === key || event.key === null) { errors.delete(key); notify(); } };
  window.addEventListener("storage", onStorage);
  window.addEventListener(eventName, notify);
  return () => { window.removeEventListener("storage", onStorage); window.removeEventListener(eventName, notify); };
}

export function writeCurriculumCache(key: string, cache: CurriculumCache) {
  const raw = JSON.stringify(cache);
  parseCurriculumCache(raw);
  if (new TextEncoder().encode(raw).length > 2_000_000) throw new Error("Каталог слишком большой: максимум 2 МБ.");
  try {
    if (window.localStorage.getItem(key) !== raw) window.localStorage.setItem(key, raw);
    errors.delete(key);
    window.dispatchEvent(new Event(eventName));
  } catch (error) {
    errors.set(key, "Не удалось записать каталог. Предыдущая копия сохранена. Проверь свободное место и настройки браузера.");
    window.dispatchEvent(new Event(eventName));
    throw error;
  }
}

export function changeCurriculum(key: string, update: (edits: CurriculumEdits) => CurriculumEdits) {
  // A fresh read keeps edits to other topics made in another tab.
  const previous = parseCurriculumCache(window.localStorage.getItem(key));
  const edits = parseCurriculum(update(previous?.edits ?? emptyCurriculum()));
  writeCurriculumCache(key, { edits, revision: previous?.revision ?? null, dirty: true });
}
