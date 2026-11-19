import { lessons, type WordItem } from "../data/lessons.ts";

const originalTopics = new Map(lessons.flatMap((topic) => topic.words.map((word) => [word.id, topic.id])));

export function mistakeWordKey(topicId: string, wordId: string): string {
  return originalTopics.get(wordId) === topicId ? wordId : `${topicId}:${wordId}`;
}

export function practiceVocabulary(topics: readonly { id: string; words: WordItem[] }[]): WordItem[] {
  // Custom topics may reuse local word IDs; saved practice IDs must remain unambiguous.
  return topics.flatMap((topic) => topic.words.map((word) => ({ ...word, id: mistakeWordKey(topic.id, word.id) })));
}

export function practiceWordId(word: WordItem, pool: WordItem[], topicId?: string): string {
  const match = topicId
    ? pool.find((item) => item.id === mistakeWordKey(topicId, word.id))
    : pool.find((item) => item.english.toLowerCase() === word.english.toLowerCase() && item.russian.toLowerCase() === word.russian.toLowerCase());
  if (!match) throw new Error("Слово изменилось в каталоге. Вернись на главную и начни тренировку заново.");
  return match.id;
}
