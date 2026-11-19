import assert from "node:assert/strict";
import { test } from "node:test";
import { buildCatalog, curriculumKey, defaultChapters, defaultTopics, emptyCurriculum, importWords, mergeCurriculum, parseCurriculum } from "../src/data/curriculum.ts";
import { aggregateWords, getBossLesson } from "../src/data/lessons.ts";
import { createChoices, createLesson } from "../src/components/lesson/lesson-state.ts";
import { getAdventureNodes, getAdventurePosition } from "../src/data/adventure.ts";
import { collectAdventureChest, completeBoss, initialProgress } from "../src/utils/progress.ts";
import { changeCurriculum, getCurriculumSnapshot, parseCurriculumCache, serverCurriculumSnapshot } from "../src/lib/curriculum-store.ts";

const words = defaultTopics.flatMap((topic) => topic.words);
const chapter = { id: "ocean", title: "Океан", description: "Исследуем море", themeColor: "#006699" };
const topic = (id, chapterId, count) => ({ id, chapterId, title: id, description: "", emoji: "🌊", icon: "", words: structuredClone(words.slice(0, count)) });

test("overlays edit and hide built-ins reversibly without mutating defaults or losing custom material", () => {
  const before = JSON.stringify(defaultTopics);
  const edits = parseCurriculum({
    ...emptyCurriculum(), chapters: [chapter],
    topics: [{ ...defaultTopics[0], title: "Наши животные" }, topic("sea", "ocean", 4)],
    hiddenChapters: ["cosmos"], hiddenTopics: ["nature"],
  });
  const catalog = buildCatalog(edits);
  assert.equal(catalog.lessons.find((item) => item.id === "animals").title, "Наши животные");
  assert.equal(catalog.topics.find((item) => item.id === "sea").total, 4);
  assert.ok(!catalog.lessons.some((item) => ["nature", "space", "colors"].includes(item.id)));
  assert.equal(JSON.stringify(defaultTopics), before);
  const restored = mergeCurriculum({ ...edits, hiddenChapters: [], hiddenTopics: [] });
  assert.ok(restored.topics.some((item) => item.id === "space"));
  assert.ok(restored.topics.some((item) => item.id === "sea"));
});

test("bulk import validates every item, normalizes aliases, and rejects unsafe IDs, icon paths, duplicates and oversized input atomically", () => {
  const existing = structuredClone(defaultTopics[0].words);
  const added = { id: "cloud", english: "Cloud", russian: "Облако", emoji: "☁️", icon3d: "rocket.webp", exampleSentence: "The cloud is white." };
  const imported = importWords(JSON.stringify([added]), existing);
  assert.equal(imported.at(-1).icon, "rocket.webp");
  assert.equal(imported.length, existing.length + 1);
  for (const invalid of ["{", "{}", "[]", JSON.stringify([added, { ...added, id: "other" }]), JSON.stringify([{ ...added, id: "__proto__" }]), JSON.stringify([{ ...added, icon3d: "../secret.png" }]), JSON.stringify([{ ...added, russian: "" }]), JSON.stringify([{ ...added, english: "<script>" }]), " ".repeat(200001)]) {
    assert.throws(() => importWords(invalid, existing));
    assert.equal(existing.length, 5);
  }
  assert.throws(() => importWords(JSON.stringify([existing[0]]), existing), /Повторяется/);
  assert.throws(() => importWords(JSON.stringify(Array(201).fill(added)), []), /200/);
  assert.throws(() => parseCurriculum({ ...emptyCurriculum(), topics: [{ ...topic("sea", "missing", 4) }] }), /глава/);
  for (const id of ["boss-x", "chest-x", "all", "constructor"]) assert.throws(() => parseCurriculum({ ...emptyCurriculum(), topics: [topic(id, "forest", 4)] }));
});

test("drafts cannot crash lessons, variable-length chapters stay traversable, and custom rewards use the live catalog", () => {
  const edits = {
    ...emptyCurriculum(), hiddenChapters: defaultChapters.map((chapter) => chapter.id),
    chapters: [chapter, { ...chapter, id: "island", title: "Остров" }],
    topics: [topic("draft", "ocean", 3), topic("sea", "ocean", 4), topic("island-words", "island", 8)],
  };
  const catalog = buildCatalog(parseCurriculum(edits));
  assert.ok(!catalog.lessons.some((lesson) => lesson.id === "draft"));
  assert.doesNotThrow(() => createLesson(catalog.lessons[0].words));
  assert.equal(catalog.chapters[0].bossEnabled, false);
  assert.equal(catalog.chapters[1].bossEnabled, true);
  assert.equal(getBossLesson("boss-ocean", catalog.chapters, catalog.lessons), undefined);
  const boss = getBossLesson("boss-island", catalog.chapters, catalog.lessons);
  assert.equal(createLesson(boss.words, () => 0.5, true).steps.length, 9);
  const nodes = getAdventureNodes(["sea"], [], [], catalog.chapters);
  assert.equal(nodes.find((node) => node.id === "island-words").state, "active");
  const eligible = { ...initialProgress(), completedTopics: ["sea", "island-words"] };
  assert.equal(collectAdventureChest(eligible, "ocean", catalog.chapters).stars, 20);
  const victory = completeBoss(eligible, "island", "2026-11-19", catalog.chapters);
  assert.deepEqual(victory.completedBosses, ["island"]);
  assert.equal(victory.stars, 50);
  assert.equal(completeBoss(victory, "island", "2026-11-19", catalog.chapters).stars, 50);
  const sizes = [2, 3];
  const positions = getAdventureNodes([], [], [], catalog.chapters).map((_, index) => getAdventurePosition(index, sizes));
  assert.ok(positions.every((position, index) => !index || position.y - positions[index - 1].y >= 248));
});

test("aggregation namespaces colliding word IDs and choices never contain two identical translations", () => {
  const pool = aggregateWords([
    { id: "a", words: words.slice(0, 4) },
    { id: "b", words: [{ ...words[4], id: words[0].id }, words[0]] },
  ]);
  assert.equal(pool.length, 5);
  assert.equal(new Set(pool.map((word) => word.id)).size, 5);
  const duplicateTranslation = { ...pool[0], id: "synonym", english: "Kitty" };
  const options = createChoices(pool[0], [...pool, duplicateTranslation], () => 0.5);
  assert.equal(new Set(options.map((word) => word.russian.toLowerCase())).size, 4);
});

test("scoped storage reads fresh edits, fails without deleting the old copy, and permits retry", (t) => {
  const original = global.window;
  assert.equal(getCurriculumSnapshot("unused"), serverCurriculumSnapshot);
  const storage = new Map();
  let blocked = false;
  global.window = Object.assign(new EventTarget(), { localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => { if (blocked) throw new Error("Quota"); storage.set(key, value); },
  } });
  t.after(() => original === undefined ? delete global.window : global.window = original);
  const key = curriculumKey("a"), other = curriculumKey("b");
  storage.set(other, "unrelated");
  changeCurriculum(key, (edits) => ({ ...edits, chapters: [chapter] }));
  const before = storage.get(key);
  blocked = true;
  assert.throws(() => changeCurriculum(key, (edits) => ({ ...edits, topics: [topic("sea", "ocean", 4)] })), /Quota/);
  assert.equal(storage.get(key), before);
  blocked = false;
  changeCurriculum(key, (edits) => ({ ...edits, topics: [topic("sea", "ocean", 4)] }));
  const cache = parseCurriculumCache(storage.get(key));
  assert.equal(cache.edits.chapters[0].id, "ocean");
  assert.equal(cache.edits.topics[0].id, "sea");
  assert.equal(storage.get(other), "unrelated");
  storage.set(key, "{bad");
  assert.throws(() => changeCurriculum(key, () => emptyCurriculum()));
  assert.equal(storage.get(key), "{bad");
});
