import { topics as builtInTopics } from "../app/topics.ts";
import { aggregateWords, chapters as builtInChapters, lessons as builtInLessons, type TopicData, type WordItem } from "./lessons.ts";

export interface CurriculumChapter {
  id: string;
  title: string;
  description: string;
  themeColor: string;
}

export interface CurriculumTopic {
  id: string;
  chapterId: string;
  title: string;
  description: string;
  icon: string;
  emoji: string;
  words: WordItem[];
}

export interface CurriculumEdits {
  chapters: CurriculumChapter[];
  topics: CurriculumTopic[];
  hiddenChapters: string[];
  hiddenTopics: string[];
}

export const emptyCurriculum = (): CurriculumEdits => ({ chapters: [], topics: [], hiddenChapters: [], hiddenTopics: [] });
export const curriculumKey = (userId: string | null) => `alingua_curriculum_v1:${userId ?? "guest"}`;
export const validId = (value: string) => /^[a-z0-9][a-z0-9-]{0,63}$/.test(value) && !["constructor", "prototype"].includes(value);

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Ожидается JSON-объект.");
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string, limit = 160, optional = false): string {
  if (typeof value !== "string" || (!optional && !value.trim()) || value.length > limit || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) {
    throw new Error(`${label}: нужно ${optional ? "не более" : "от 1 до"} ${limit} символов.`);
  }
  return value.trim();
}

function id(value: unknown): string {
  const result = text(value, "ID", 64);
  if (!validId(result)) throw new Error("ID: только строчные латинские буквы, цифры и дефис; максимум 64 символа.");
  return result;
}

function isIcon(value: string): value is WordItem["icon"] {
  return value === "" || /^[a-z0-9-]+\.(png|webp)$/.test(value);
}

function icon(value: unknown): WordItem["icon"] {
  const result = text(value, "3D-иконка", 100, true);
  if (!isIcon(result)) throw new Error("Иконка: имя файла .png или .webp без пути и URL.");
  return result;
}

function array(value: unknown, limit: number): unknown[] {
  if (!Array.isArray(value) || value.length > limit) throw new Error(`Ожидается массив: максимум ${limit} элементов.`);
  return value;
}

function unique<T>(items: T[], key: (item: T) => string, label: string): T[] {
  if (new Set(items.map(key)).size !== items.length) throw new Error(`Повторяется ${label}. Импорт отменён целиком.`);
  return items;
}

export function parseWords(value: unknown): WordItem[] {
  const words = array(value, 200).map((value, index): WordItem => {
    try {
      const word = object(value);
      const english = text(word.english, "English", 60);
      if (!/^[a-zA-Z]+(?:[ '-][a-zA-Z]+)*$/.test(english)) throw new Error("English: используйте английские буквы, пробел, апостроф или дефис.");
      return {
        id: id(word.id), english, russian: text(word.russian, "Перевод", 100),
        emoji: text(word.emoji, "Эмодзи", 24),
        icon: icon(word.icon3d ?? word.icon ?? ""),
        exampleSentence: text(word.exampleSentence, "Пример", 240),
      };
    } catch (error) {
      throw new Error(`Слово ${index + 1}: ${error instanceof Error ? error.message : "неверный формат"}`);
    }
  });
  unique(words, (word) => word.id, "ID слова");
  unique(words, (word) => word.english.normalize("NFC").toLowerCase(), "английское слово");
  return unique(words, (word) => word.russian.normalize("NFC").toLowerCase(), "перевод");
}

export function importWords(raw: string, existing: WordItem[]): WordItem[] {
  if (raw.length > 200_000) throw new Error("JSON слишком большой: максимум 200 000 символов.");
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error("Неверный JSON. Проверь кавычки, запятые и квадратные скобки."); }
  const imported = parseWords(value);
  if (!imported.length) throw new Error("Массив пуст. Добавь хотя бы одно слово.");
  return parseWords([...existing, ...imported]);
}

export function parseChapter(value: unknown): CurriculumChapter {
  const chapter = object(value);
  const themeColor = text(chapter.themeColor, "Цвет", 7);
  if (!/^#[a-fA-F0-9]{6}$/.test(themeColor)) throw new Error("Цвет должен иметь формат #7c3aed.");
  return { id: id(chapter.id), title: text(chapter.title, "Название", 80), description: text(chapter.description, "Описание", 240, true), themeColor };
}

export function parseTopic(value: unknown): CurriculumTopic {
  const topic = object(value);
  const topicId = id(topic.id);
  if (topicId === "all" || /^(boss|chest)-/.test(topicId)) throw new Error("ID темы all и префиксы boss- и chest- зарезервированы.");
  return {
    id: topicId, chapterId: id(topic.chapterId), title: text(topic.title, "Название", 80),
    description: text(topic.description, "Описание", 240, true), icon: icon(topic.icon3d ?? topic.icon ?? ""),
    emoji: text(topic.emoji, "Эмодзи", 24), words: parseWords(topic.words),
  };
}

export const defaultChapters: CurriculumChapter[] = builtInChapters.map((chapter, index) => ({
  id: chapter.id, title: chapter.title, description: chapter.subtitle, themeColor: ["#059669", "#7c3aed", "#f97316"][index],
}));
export const defaultTopics: CurriculumTopic[] = builtInLessons.map((lesson) => {
  const display = builtInTopics.find((topic) => topic.id === lesson.id)!;
  return {
    id: lesson.id, chapterId: builtInChapters.find((chapter) => chapter.topicIds.some((id) => id === lesson.id))!.id,
    title: lesson.title, description: display.description, icon: display.icon, emoji: display.emoji, words: lesson.words,
  };
});

function overlay<T extends { id: string }>(base: readonly T[], edits: readonly T[]): T[] {
  return [...new Map([...base, ...edits].map((item) => [item.id, item])).values()];
}

export function mergeCurriculum(edits: CurriculumEdits) {
  const chapters = overlay(defaultChapters, edits.chapters).filter((chapter) => !edits.hiddenChapters.includes(chapter.id));
  const topics = overlay(defaultTopics, edits.topics).filter((topic) => !edits.hiddenTopics.includes(topic.id) && chapters.some((chapter) => chapter.id === topic.chapterId));
  return { chapters, topics };
}

export function parseCurriculum(value: unknown): CurriculumEdits {
  const data = object(value);
  const edits = {
    chapters: unique(array(data.chapters, 40).map(parseChapter), (item) => item.id, "ID главы"),
    topics: unique(array(data.topics, 200).map(parseTopic), (item) => item.id, "ID темы"),
    hiddenChapters: unique(array(data.hiddenChapters, 80).map(id), (item) => item, "ID скрытой главы"),
    hiddenTopics: unique(array(data.hiddenTopics, 240).map(id), (item) => item, "ID скрытой темы"),
  };
  const chapters = overlay(defaultChapters, edits.chapters);
  if (edits.topics.some((topic) => !chapters.some((chapter) => chapter.id === topic.chapterId))) throw new Error("Для темы не найдена глава.");
  if (edits.topics.reduce((sum, topic) => sum + topic.words.length, 0) > 5000) throw new Error("В каталоге может быть не более 5000 пользовательских слов.");
  return edits;
}

export function buildCatalog(edits: CurriculumEdits) {
  const curriculum = mergeCurriculum(edits);
  const lessons: TopicData[] = curriculum.topics.filter((topic) => topic.words.length >= 4).map((topic) => ({
    ...topic, themeColor: builtInLessons.find((item) => item.id === topic.id)?.themeColor ?? curriculum.chapters.find((chapter) => chapter.id === topic.chapterId)!.themeColor,
  }));
  const topics = lessons.map((lesson) => {
    const topic = curriculum.topics.find((topic) => topic.id === lesson.id)!;
    const original = builtInTopics.find((item) => item.id === topic.id);
    return { ...topic, name: topic.title, total: topic.words.length, color: original?.color ?? "bg-violet-100", bar: original?.bar ?? "bg-violet-500" };
  });
  const chapters = curriculum.chapters.flatMap((chapter) => {
    const chapterTopics = lessons.filter((lesson) => curriculum.topics.find((topic) => topic.id === lesson.id)!.chapterId === chapter.id);
    if (!chapterTopics.length) return [];
    const original = builtInChapters.find((item) => item.id === chapter.id);
    const words = aggregateWords(chapterTopics);
    return [{
      ...chapter, subtitle: chapter.description, topicIds: chapterTopics.map((topic) => topic.id),
      banner: original?.banner ?? "from-violet-500 to-indigo-600", icon: original?.icon ?? "notebook",
      boss: original?.boss ?? { id: `boss-${chapter.id}`, title: `Хранитель: ${chapter.title}`, trophy: `Корона: ${chapter.title}` },
      bossEnabled: words.length >= 8 && new Set(words.map((word) => word.russian.toLowerCase())).size >= 4,
    }];
  });
  return { curriculum, chapters, topics, lessons };
}
