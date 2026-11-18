import assert from "node:assert/strict";
import { test } from "node:test";
import { createLesson, lessonReducer, lessonResult } from "../src/components/lesson/lesson-state.ts";
import { getProgressSummary, parseProgress, saveProgress } from "../src/utils/progress.ts";

const words = ["Cat", "Dog", "Rabbit", "Lion", "Elephant"].map((english) => ({
  id: english.toLowerCase(), english, russian: english, emoji: "", exampleSentence: "",
}));

function practice() {
  let state = createLesson(words);
  for (const word of words) {
    assert.equal(state.steps[state.stepIndex].word, word);
    state = lessonReducer(state, { type: "reveal" });
    state = lessonReducer(state, { type: "next" });
  }
  return state;
}

test("lesson guards answers, requires success, and completes quiz plus scramble", () => {
  let state = createLesson(words);
  assert.equal(lessonReducer(state, { type: "next" }), state);
  state = practice();
  assert.equal(lessonReducer(state, { type: "check" }), state);
  assert.equal(lessonReducer(state, { type: "answer", answer: "not-an-option" }), state);
  const stepIndex = state.stepIndex;
  state = lessonReducer(state, { type: "answer", answer: "dog" });
  state = lessonReducer(state, { type: "check" });
  assert.equal(lessonReducer(state, { type: "check" }), state);
  assert.equal(state.lives, 2);
  state = lessonReducer(state, { type: "next" });
  assert.equal(state.stepIndex, stepIndex);
  while (state.phase !== "complete") {
    const step = state.steps[state.stepIndex];
    if (step.kind === "quiz") {
      assert.equal(new Set(step.options.map((word) => word.id)).size, 4);
      assert.ok(step.options.some((word) => word.id === step.word.id));
    }
    state = lessonReducer(state, {
      type: "answer",
      answer: step.kind === "quiz" ? step.word.id : ` ${step.word.english.toUpperCase()} `,
    });
    state = lessonReducer(state, { type: "check" });
    assert.equal(state.wasCorrect, true);
    state = lessonReducer(state, { type: "next" });
  }
  assert.equal(state.stepIndex, 15);
  assert.deepEqual(lessonResult(state), { accuracy: 91, xp: 100, stars: 2 });
  assert.equal(lessonReducer(state, { type: "next" }), state);
});

test("three mistakes open retry; restarting clears the failed attempt", () => {
  let state = practice();
  for (let mistake = 0; mistake < 3; mistake++) {
    state = lessonReducer(state, { type: "answer", answer: "dog" });
    state = lessonReducer(state, { type: "check" });
    state = lessonReducer(state, { type: "next" });
  }
  assert.equal(state.lives, 0);
  assert.equal(state.phase, "retry");
  assert.equal(lessonReducer(state, { type: "next" }), state);
  state = lessonReducer(state, { type: "retry" });
  assert.equal(state.lives, 3);
  assert.equal(state.stepIndex, 0);
  assert.equal(state.attempts, 0);
  assert.equal(state.correct, 0);
  assert.equal(state.revealed, false);
});

test("saved best results are idempotent and invalid/unwritable storage is not hidden", (t) => {
  const saved = new Map();
  const events = [];
  globalThis.window = {
    localStorage: {
      getItem: (key) => saved.get(key) ?? null,
      setItem: (key, value) => saved.set(key, value),
    },
    dispatchEvent: (event) => events.push(event.type),
  };
  t.after(() => { delete globalThis.window; });
  const best = { accuracy: 100, xp: 100, stars: 3, soundCheck: true };
  saveProgress("animals", best);
  saveProgress("animals", { accuracy: 80, xp: 100, stars: 2 });
  const { animals } = parseProgress(saved.get("alingua.progress.v1"));
  assert.equal(animals.accuracy, best.accuracy);
  assert.equal(animals.xp, best.xp);
  assert.equal(animals.stars, best.stars);
  assert.equal(animals.soundCheck, true);
  assert.equal(animals.completions, 2);
  assert.equal(animals.completedDates.length, 1, "same-day replays do not extend the streak");
  assert.equal(events.length, 2);
  for (const raw of ["null", "[]", '{"animals":{"accuracy":101,"xp":100,"stars":3}}', '{"animals":{"accuracy":90,"xp":-10,"stars":2}}', JSON.stringify({ animals: { ...best, completedDates: ["2026-02-30"] } }), JSON.stringify({ animals: { ...best, completions: 0 } })]) {
    assert.throws(() => parseProgress(raw));
  }
  saved.set("alingua.progress.v1", "broken");
  assert.throws(() => saveProgress("food", best));
  assert.equal(saved.get("alingua.progress.v1"), "broken");
  saved.clear();
  window.localStorage.setItem = () => { throw new Error("Storage blocked"); };
  assert.throws(() => saveProgress("animals", best), /Storage blocked/);
});

test("profile totals use known topics and streaks use distinct local calendar days", () => {
  const topics = [{ id: "animals", total: 5 }, { id: "food", total: 5 }];
  const result = { accuracy: 100, xp: 100, stars: 3 };
  const progress = {
    animals: { ...result, completions: 3, completedDates: ["2026-03-07", "2026-03-08", "2026-03-09"], soundCheck: true },
    food: { ...result, accuracy: 80, stars: 2, completedDates: ["2026-03-09"] },
    obsolete: { ...result, completedDates: ["2026-03-10"] },
  };
  const summary = getProgressSummary(progress, topics, "2026-03-09");
  assert.deepEqual(summary, {
    streak: 3, bestStreak: 3, stars: 5, xp: 200, wordsLearned: 10,
    lessonsCompleted: 4, accuracy: 90, soundCheck: true,
  });
  assert.equal(getProgressSummary(progress, topics, "2026-03-10").streak, 3);
  const expired = getProgressSummary(progress, topics, "2026-03-11");
  assert.equal(expired.streak, 0);
  assert.equal(expired.bestStreak, 3, "earned streak badges stay unlocked");
  assert.deepEqual(getProgressSummary({}, topics, "2026-03-09"), {
    streak: 0, bestStreak: 0, stars: 0, xp: 0, wordsLearned: 0,
    lessonsCompleted: 0, accuracy: 0, soundCheck: false,
  });
  const legacy = parseProgress(JSON.stringify({ animals: result }));
  assert.equal(getProgressSummary(legacy, topics, "2026-03-09").lessonsCompleted, 1);
  assert.equal(getProgressSummary(legacy, topics, "2026-03-09").streak, 0);
});
