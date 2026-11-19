import type { topics } from "../app/topics.ts";
import { chapters } from "./lessons.ts";

type TopicId = (typeof topics)[number]["id"];

export const adventureChapters = chapters;

export const adventureChestReward = 20;
export const adventureChapterHeight = 1128;
export const adventureNodesPerChapter = 4;

export type AdventureNode = {
  id: string;
  chapterId: string;
  state: "completed" | "active" | "locked";
} & ({ kind: "lesson"; topicId: TopicId } | { kind: "boss"; topicId: string } | { kind: "chest" });

export function getAdventureNodes(completedTopics: readonly string[], claimedChests: readonly string[], completedBosses: readonly string[] = []): AdventureNode[] {
  const completed = new Set(completedTopics);
  let hasCurrentLesson = false;
  let previousLessonsComplete = true;
  let previousBossesComplete = true;
  return adventureChapters.flatMap((chapter) => {
    const lessons: AdventureNode[] = chapter.topicIds.map((topicId) => {
      const done = completed.has(topicId);
      const state = done ? "completed" : hasCurrentLesson || !previousBossesComplete ? "locked" : "active";
      if (!done) hasCurrentLesson = true;
      previousLessonsComplete = previousLessonsComplete && done;
      return { id: topicId, chapterId: chapter.id, kind: "lesson", topicId, state };
    });
    const chest: AdventureNode = {
      id: `chest-${chapter.id}`, chapterId: chapter.id, kind: "chest",
      state: claimedChests.includes(chapter.id) ? "completed" : previousLessonsComplete && previousBossesComplete ? "active" : "locked",
    };
    const defeated = completedBosses.includes(chapter.id);
    const boss: AdventureNode = {
      id: chapter.boss.id, chapterId: chapter.id, topicId: chapter.boss.id, kind: "boss",
      state: defeated ? "completed" : previousLessonsComplete && previousBossesComplete ? "active" : "locked",
    };
    previousBossesComplete = previousBossesComplete && defeated;
    return [...lessons, chest, boss];
  });
}

export function getAdventurePosition(index: number) {
  return {
    x: Math.sin(index * 1.1) * 65,
    y: Math.floor(index / adventureNodesPerChapter) * adventureChapterHeight + 224 + (index % adventureNodesPerChapter) * 248,
  };
}
