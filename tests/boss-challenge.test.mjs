import assert from "node:assert/strict";
import { test } from "node:test";
import { chapters, getBossLesson, lessons } from "../src/data/lessons.ts";
import { createLesson, lessonReducer } from "../src/components/lesson/lesson-state.ts";
import { completeBoss, initialProgress, parseSavedProgress, progressStorageKey, updateStoredProgress } from "../src/utils/progress.ts";
import { topics } from "../src/app/topics.ts";

test("bosses review chapter vocabulary with ten distinct, shuffled mixed exercises and no flashcards", () => {
  for (const chapter of chapters) {
    const boss = getBossLesson(chapter.boss.id);
    const expected = lessons.filter((lesson) => chapter.topicIds.includes(lesson.id)).flatMap((lesson) => lesson.words);
    assert.deepEqual(boss.words, expected);
    const state = createLesson(boss.words, () => 0.9, true);
    const exercises = state.steps.slice(0, -1);
    assert.equal(exercises.length, 10);
    assert.equal(new Set(exercises.map((step) => step.word.id)).size, 10);
    assert.deepEqual([...new Set(exercises.map((step) => step.kind))].sort(), ["listen", "quiz", "scramble"]);
    assert.notDeepEqual(state.steps, createLesson(boss.words, () => 0, true).steps);
    assert.deepEqual(createLesson(boss.words, undefined, true), createLesson(boss.words, undefined, true), "SSR must be deterministic");
    for (const step of exercises) {
      if (step.kind === "scramble") {
        assert.deepEqual([...step.letters].sort(), [...step.word.english.toUpperCase()].sort());
        assert.notEqual(step.letters.join(""), step.word.english.toUpperCase());
      } else {
        assert.equal(new Set(step.options.map((word) => word.id)).size, 4);
        assert.ok(step.options.some((word) => word.id === step.word.id));
      }
    }
  }
  assert.equal(getBossLesson("boss-missing"), undefined);
  assert.throws(() => createLesson(lessons[0].words, undefined, true), /eight distinct words/);
});

test("boss combos count each check once, reset on mistakes and retry, and allow a ten-round victory", () => {
  let state = createLesson(getBossLesson("boss-forest").words, undefined, true);
  function answer(correct) {
    const step = state.steps[state.stepIndex];
    const answer = correct ? step.kind === "scramble" ? step.word.english : step.word.id
      : step.kind === "scramble" ? "wrong" : step.options.find((word) => word.id !== step.word.id).id;
    state = lessonReducer(state, { type: "answer", answer });
    state = lessonReducer(state, { type: "check" });
    assert.equal(lessonReducer(state, { type: "check" }), state);
    assert.equal(lessonReducer(state, { type: "shuffle", steps: [] }), state);
  }
  answer(true);
  assert.equal(state.combo, 1);
  state = lessonReducer(state, { type: "next" });
  answer(false);
  assert.equal(state.combo, 0);
  assert.equal(state.bestCombo, 1);
  state = lessonReducer(state, { type: "next" });
  while (state.phase !== "complete") {
    answer(true);
    state = lessonReducer(state, { type: "next" });
  }
  assert.equal(state.stepIndex, 10);
  assert.ok(state.bestCombo >= 8);
  let failed = createLesson(getBossLesson("boss-forest").words, undefined, true);
  failed = { ...failed, phase: "retry", lives: 0, combo: 4, bestCombo: 4 };
  const retried = lessonReducer(failed, { type: "retry" });
  assert.equal(retried.combo, 0);
  assert.equal(retried.bestCombo, 0);
  assert.equal(retried.lives, 3);
  assert.equal(retried.stepIndex, 0);
});

test("boss crowns and fifty-star rewards persist once without adding learned words or bypassing prerequisites", () => {
  const today = "2026-11-19";
  assert.throws(() => completeBoss(initialProgress(), "forest", today), /preceding/);
  assert.throws(() => completeBoss(initialProgress(), "missing", today), /Unknown/);
  const eligible = { ...initialProgress(), stars: 7, completedTopics: ["animals", "nature"], learnedWordsCount: 10 };
  const won = completeBoss(eligible, "forest", today);
  assert.equal(won.stars, 57);
  assert.equal(won.learnedWordsCount, 10);
  assert.deepEqual(won.completedTopics, eligible.completedTopics);
  assert.deepEqual(won.completedBosses, ["forest"]);
  const reloaded = parseSavedProgress(JSON.stringify(won));
  assert.equal(completeBoss(reloaded, "forest", today), reloaded);
  assert.throws(() => completeBoss({ ...eligible, completedTopics: ["space", "colors"] }, "cosmos", today), /preceding/);
  const old = { ...eligible };
  delete old.completedBosses;
  assert.deepEqual(parseSavedProgress(JSON.stringify(old)).completedBosses, []);
  for (const invalid of [null, "forest", ["forest", "forest"], ["__proto__"], [42]]) {
    assert.throws(() => parseSavedProgress(JSON.stringify({ ...eligible, completedBosses: invalid })));
  }
});

test("a failed boss reward write keeps the crown and stars unclaimed, and rapid retries cannot duplicate them", (t) => {
  const previousWindow = global.window;
  let raw = JSON.stringify({ ...initialProgress(), completedTopics: ["animals", "nature"], learnedWordsCount: 10 });
  let blocked = true;
  global.window = Object.assign(new EventTarget(), {
    localStorage: {
      getItem: (key) => key === progressStorageKey ? raw : null,
      setItem: (_key, value) => { if (blocked) throw new Error("Blocked"); raw = value; },
    },
  });
  t.after(() => previousWindow === undefined ? delete global.window : global.window = previousWindow);
  const win = () => updateStoredProgress(topics, (state, today) => completeBoss(state, "forest", today));
  assert.throws(win, /Blocked/);
  assert.equal(parseSavedProgress(raw).stars, 0);
  assert.deepEqual(parseSavedProgress(raw).completedBosses, []);
  blocked = false;
  win();
  win();
  assert.equal(parseSavedProgress(raw).stars, 50);
  assert.deepEqual(parseSavedProgress(raw).completedBosses, ["forest"]);
});
