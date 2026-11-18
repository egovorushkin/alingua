import type { TopicData, WordItem } from "@/data/lessons";

export interface VocabularyEntry {
  topic: TopicData;
  word: WordItem;
}

export function filterVocabulary(
  entries: readonly VocabularyEntry[],
  completedTopics: readonly string[],
  query: string,
  topicId: string,
) {
  const search = query.trim().normalize("NFC").toLowerCase();
  return entries.filter(({ topic, word }) =>
    (topicId === "all" || topic.id === topicId) &&
    (!search || (
      completedTopics.includes(topic.id) &&
      [word.english, word.russian].some((text) =>
        text.normalize("NFC").toLowerCase().includes(search),
      )
    )),
  );
}
