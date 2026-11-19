import type { topics } from "../app/topics.ts";

type TopicId = (typeof topics)[number]["id"];

export const adventureChapters = [
  { id: "forest", title: "Зачарованный лес", subtitle: "Животные и природа", topicIds: ["animals", "nature"], banner: "from-emerald-500 to-teal-600", icon: "reindeer" },
  { id: "cosmos", title: "Космическая станция", subtitle: "Космос и цвета", topicIds: ["space", "colors"], banner: "from-violet-500 to-indigo-600", icon: "rocket" },
  { id: "journey", title: "Большое путешествие", subtitle: "Еда и транспорт", topicIds: ["food", "transport"], banner: "from-orange-400 to-rose-500", icon: "gingerbread" },
] as const satisfies readonly {
  id: string; title: string; subtitle: string; topicIds: readonly [TopicId, TopicId]; banner: string; icon: string;
}[];

export const adventureChestReward = 20;
export const adventureChapterHeight = 784;

export type AdventureNode = {
  id: string;
  chapterId: string;
  state: "completed" | "active" | "locked";
} & ({ kind: "lesson"; topicId: TopicId } | { kind: "chest" });

export function getAdventureNodes(completedTopics: readonly string[], claimedChests: readonly string[]): AdventureNode[] {
  const completed = new Set(completedTopics);
  let hasCurrentLesson = false;
  let previousLessonsComplete = true;
  return adventureChapters.flatMap((chapter) => {
    const lessons: AdventureNode[] = chapter.topicIds.map((topicId) => {
      const done = completed.has(topicId);
      const state = done ? "completed" : hasCurrentLesson ? "locked" : "active";
      if (!done) hasCurrentLesson = true;
      previousLessonsComplete = previousLessonsComplete && done;
      return { id: topicId, chapterId: chapter.id, kind: "lesson", topicId, state };
    });
    const chest: AdventureNode = {
      id: `chest-${chapter.id}`, chapterId: chapter.id, kind: "chest",
      state: claimedChests.includes(chapter.id) ? "completed" : previousLessonsComplete ? "active" : "locked",
    };
    return [...lessons, chest];
  });
}

export function getAdventurePosition(index: number) {
  return {
    x: Math.sin(index * 1.1) * 65,
    y: Math.floor(index / 3) * adventureChapterHeight + 224 + (index % 3) * 208,
  };
}
