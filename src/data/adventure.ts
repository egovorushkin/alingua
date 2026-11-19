import { chapters, type AdventureChapter } from "./lessons.ts";

export const adventureChapters = chapters;

export const adventureChestReward = 20;
export const adventureChapterHeight = 1128;
export const adventureNodesPerChapter = 4;

export type AdventureNode = {
  id: string;
  chapterId: string;
  state: "completed" | "active" | "locked";
} & ({ kind: "lesson"; topicId: string } | { kind: "boss"; topicId: string } | { kind: "chest" });

export function getAdventureNodes(completedTopics: readonly string[], claimedChests: readonly string[], completedBosses: readonly string[] = [], chapterList: readonly AdventureChapter[] = adventureChapters): AdventureNode[] {
  const completed = new Set(completedTopics);
  let hasCurrentLesson = false;
  let previousLessonsComplete = true;
  let previousBossesComplete = true;
  return chapterList.filter((chapter) => chapter.topicIds.length > 0).flatMap((chapter) => {
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
    previousBossesComplete = previousBossesComplete && (chapter.bossEnabled === false ? previousLessonsComplete : defeated);
    return [...lessons, chest, ...(chapter.bossEnabled === false ? [] : [boss])];
  });
}

export function getAdventureChapterHeight(nodeCount: number) {
  return 224 + (nodeCount - 1) * 248 + 160;
}

export function getAdventurePosition(index: number, chapterSizes: readonly number[] = adventureChapters.map(() => adventureNodesPerChapter)) {
  let first = 0, top = 0;
  for (const size of chapterSizes) {
    if (index >= first && index < first + size) return { x: Math.sin(index * 1.1) * 65, y: top + 224 + (index - first) * 248 };
    first += size;
    top += getAdventureChapterHeight(size);
  }
  throw new Error("Unknown adventure node index.");
}
