import assert from "node:assert/strict";
import { test } from "node:test";
import { lessons } from "../src/data/lessons.ts";
import { buildCatalog, emptyCurriculum, parseTopic } from "../src/data/curriculum.ts";
import { mistakeWordKey, practiceVocabulary, practiceWordId } from "../src/utils/mistakes.ts";
import { initialProgress, parseSavedProgress, progressStorageKey, recordMistake, resolveMistake, updateStoredProgress } from "../src/utils/progress.ts";
import { createMistakeReview, lessonReducer } from "../src/components/lesson/lesson-state.ts";

test("mistakes migrate safely, deduplicate, and grant three stars only when a pending word is conquered", () => {
  const legacy = initialProgress();
  delete legacy.mistakeWordIds;
  assert.deepEqual(parseSavedProgress(JSON.stringify(legacy)).mistakeWordIds, []);
  const pending = recordMistake(initialProgress(), "cat");
  assert.equal(recordMistake(pending, "cat"), pending);
  const solved = resolveMistake(pending, "cat");
  assert.equal(solved.stars, 3);
  assert.deepEqual(solved.mistakeWordIds, []);
  assert.equal(resolveMistake(solved, "cat"), solved);
  assert.throws(() => recordMistake(solved, "__proto__"));
  for (const ids of [null, ["cat", "cat"], [4], [""]]) {
    assert.throws(() => parseSavedProgress(JSON.stringify({ ...solved, mistakeWordIds: ids })), /mistake/);
  }
  assert.throws(() => resolveMistake({ ...pending, stars: Number.MAX_SAFE_INTEGER }, "cat"));
});

test("fresh storage keeps different mistakes, and failed conquest writes preserve both the word and reward for retry", (t) => {
  const previous = global.window;
  const storage = new Map();
  const target = new EventTarget();
  let blocked = false;
  target.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem(key, value) { if (blocked) throw new Error("Quota"); storage.set(key, value); },
  };
  global.window = target;
  t.after(() => { if (previous === undefined) delete global.window; else global.window = previous; });
  const change = (update) => updateStoredProgress([], update);
  change((state) => recordMistake(state, "cat"));
  change((state) => recordMistake(state, "dog"));
  const before = storage.get(progressStorageKey);
  blocked = true;
  assert.throws(() => change((state) => resolveMistake(state, "cat")), /Quota/);
  assert.equal(storage.get(progressStorageKey), before);
  blocked = false;
  change((state) => resolveMistake(state, "cat"));
  change((state) => resolveMistake(state, "cat"));
  const saved = parseSavedProgress(storage.get(progressStorageKey));
  assert.deepEqual(saved.mistakeWordIds, ["dog"]);
  assert.equal(saved.stars, 3);
});

test("custom IDs stay separate and stable, including draft words and collisions with built-in vocabulary", () => {
  const custom = { id: "sea", words: [{ ...lessons[0].words[0], english: "Crab", russian: "Краб" }] };
  const pool = practiceVocabulary([...lessons, custom]);
  assert.equal(practiceWordId(lessons[0].words[0], pool, "animals"), "cat");
  assert.equal(practiceWordId(custom.words[0], pool, "sea"), "sea:cat");
  assert.equal(practiceWordId(custom.words[0], pool), "sea:cat", "aggregated boss and listening words resolve by meaning");
  assert.equal(mistakeWordKey("sea", "cat"), practiceVocabulary([custom])[0].id);
  assert.throws(() => practiceWordId({ ...custom.words[0], english: "Gone" }, pool));
  const edits = emptyCurriculum();
  edits.topics = [{ ...custom, chapterId: "forest", title: "Море", description: "", icon: "", emoji: "🌊" }];
  const catalog = buildCatalog(edits);
  assert.ok(catalog.practiceWords.some((word) => word.id === "sea:cat"));
  assert.ok(!catalog.lessons.some((topic) => topic.id === "sea"), "drafts still cannot launch regular four-choice lessons");
  assert.throws(() => parseTopic({ ...edits.topics[0], id: "mistakes" }), /зарезервированы/);
});

test("review mixes only target words, borrows unique distractors and allows unlimited retries even for listening", () => {
  const pool = practiceVocabulary(lessons);
  const words = pool.slice(0, 3);
  let state = createMistakeReview(words, pool, () => 0);
  assert.deepEqual(new Set(state.steps.slice(0, -1).map((step) => step.kind)), new Set(["quiz", "listen", "scramble"]));
  assert.deepEqual(new Set(state.steps.slice(0, -1).map((step) => step.word.id)), new Set(words.map((word) => word.id)));
  while (state.phase !== "complete") {
    const step = state.steps[state.stepIndex];
    if (step.kind !== "scramble") {
      assert.equal(new Set(step.options.map((word) => word.russian.toLowerCase())).size, 4);
    }
    const wrong = step.kind === "scramble" ? "wrong" : step.options.find((word) => word.id !== step.word.id).id;
    for (let attempt = 0; attempt < 4; attempt++) {
      const index = state.stepIndex;
      state = lessonReducer(state, { type: "answer", answer: wrong });
      state = lessonReducer(state, { type: "check" });
      state = lessonReducer(state, { type: "next" });
      assert.equal(state.stepIndex, index);
      assert.equal(state.phase, "answering");
      assert.equal(state.lives, 3);
    }
    state = lessonReducer(state, { type: "answer", answer: step.kind === "scramble" ? step.word.english : step.word.id });
    state = lessonReducer(state, { type: "check" });
    assert.equal(state.wasCorrect, true);
    assert.equal(lessonReducer(state, { type: "check" }), state);
    state = lessonReducer(state, { type: "next" });
  }
  assert.equal(state.bonusStars, 0, "review rewards are persisted atomically, not the regular +2 bonus");
  const single = createMistakeReview([pool[0]], [pool[0]]);
  assert.equal(single.steps[0].kind, "scramble", "a tiny custom catalog can still be reviewed");
  assert.throws(() => createMistakeReview([], pool));
});
