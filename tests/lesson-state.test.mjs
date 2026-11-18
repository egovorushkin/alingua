import assert from "node:assert/strict";
import { test } from "node:test";
import { createLesson, lessonReducer, lessonResult } from "../src/components/lesson/lesson-state.ts";
import {
  completeLesson, finishTopic, getProgressSnapshot, getProgressSummary, initialProgress,
  markActive, migrateProgress, parseProgress, parseSavedProgress, progressStorageKey,
  readProgressSnapshot, rewardStars, serverProgressSnapshot, subscribeProgress, updateStoredProgress,
} from "../src/utils/progress.ts";

const words = ["Cat", "Dog", "Rabbit", "Lion", "Elephant"].map((english) => ({
  id: english.toLowerCase(), english, russian: english, emoji: "", exampleSentence: "",
}));

function practice() {
  let state = createLesson(words);
  state = lessonReducer(state, { type: "reveal" });
  return lessonReducer(state, { type: "next" });
}

function completeStep(state) {
  const step = state.steps[state.stepIndex];
  if (step.kind === "learn") {
    state = lessonReducer(state, { type: "reveal" });
  } else {
    state = lessonReducer(state, { type: "answer", answer: step.kind === "scramble" ? step.word.english : step.word.id });
    state = lessonReducer(state, { type: "check" });
  }
  return lessonReducer(state, { type: "next" });
}

test("each word follows learn, quiz, listen, scramble with shuffled choices and intact scrambled letters", () => {
  const initial = createLesson(words);
  assert.deepEqual(initial, createLesson(words), "prerendering and hydration stay deterministic");
  const randomized = createLesson(words, () => 0.99);
  const alternate = createLesson(words, () => 0);
  assert.notDeepEqual(randomized.steps, alternate.steps);
  for (const [index, word] of words.entries()) {
    const steps = randomized.steps.slice(index * 4, index * 4 + 4);
    assert.deepEqual(steps.map((step) => step.kind), ["learn", "quiz", "listen", "scramble"]);
    assert.ok(steps.every((step) => step.word.id === word.id));
    assert.equal(new Set(steps[1].options.map((option) => option.id)).size, 4);
    assert.ok(steps[1].options.includes(word));
    assert.equal(new Set(steps[2].options.map((option) => option.id)).size, 4);
    assert.ok(steps[2].options.includes(word));
    assert.deepEqual([...steps[3].letters].sort(), [...word.english.toUpperCase()].sort());
    assert.notEqual(steps[3].letters.join(""), word.english.toUpperCase());
  }
  const prepared = lessonReducer(initial, { type: "shuffle", steps: randomized.steps });
  assert.equal(prepared.steps, randomized.steps);
  const revealed = lessonReducer(prepared, { type: "reveal" });
  assert.equal(lessonReducer(revealed, { type: "shuffle", steps: alternate.steps }), revealed);
});

test("lesson guards answers, requires quiz and scramble success, and rewards listening", () => {
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
    if (step.kind === "learn") {
      state = completeStep(state);
      continue;
    }
    if (step.kind === "quiz" || step.kind === "listen") {
      assert.equal(new Set(step.options.map((word) => word.id)).size, 4);
      assert.ok(step.options.some((word) => word.id === step.word.id));
    }
    state = lessonReducer(state, {
      type: "answer",
      answer: step.kind === "scramble" ? ` ${step.word.english.toUpperCase()} ` : step.word.id,
    });
    const previousBonus = state.bonusStars;
    state = lessonReducer(state, { type: "check" });
    assert.equal(state.wasCorrect, true);
    assert.equal(state.bonusStars, previousBonus + (step.kind === "scramble" || step.kind === "listen" ? 2 : 0));
    assert.equal(lessonReducer(state, { type: "check" }), state, "a repeated check cannot award stars twice");
    state = lessonReducer(state, { type: "next" });
  }
  assert.equal(state.stepIndex, 20);
  assert.deepEqual(lessonResult(state), { accuracy: 94, xp: 150, stars: 2, bonusStars: 20 });
  assert.equal(lessonReducer(state, { type: "next" }), state);
});

test("three mistakes open retry; restarting clears the failed attempt", () => {
  let state = completeStep(completeStep(completeStep(completeStep(practice()))));
  assert.equal(state.bonusStars, 4);
  const step = state.steps[state.stepIndex];
  const wrongAnswer = step.options.find((option) => option.id !== step.word.id).id;
  for (let mistake = 0; mistake < 3; mistake++) {
    state = lessonReducer(state, { type: "answer", answer: wrongAnswer });
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
  assert.equal(state.bonusStars, 0);
  assert.equal(state.revealed, false);
});

test("wrong and empty scramble attempts cannot award stars or skip the puzzle", () => {
  let state = completeStep(completeStep(practice()));
  const stepIndex = state.stepIndex;
  assert.equal(state.steps[stepIndex].kind, "scramble");
  assert.equal(lessonReducer(state, { type: "check" }), state);
  state = lessonReducer(state, { type: "answer", answer: "wrong" });
  state = lessonReducer(state, { type: "check" });
  assert.equal(state.lives, 2);
  assert.equal(state.bonusStars, 2);
  assert.equal(state.correct, 2, "the preceding quiz and listening round have earned XP");
  assert.equal(lessonReducer(state, { type: "check" }), state);
  state = lessonReducer(state, { type: "next" });
  assert.equal(state.stepIndex, stepIndex);
  state = lessonReducer(state, { type: "answer", answer: " CAT " });
  state = lessonReducer(state, { type: "check" });
  assert.equal(state.bonusStars, 4);
  assert.equal(state.correct, 3);
  assert.equal(lessonReducer(state, { type: "next" }).stepIndex, stepIndex + 1);
});

test("a listening mistake reveals feedback and allows continuing, but zero lives still opens retry", () => {
  const initial = completeStep(practice());
  const step = initial.steps[initial.stepIndex];
  assert.equal(step.kind, "listen");
  assert.equal(lessonReducer(initial, { type: "answer", answer: "unknown" }), initial);
  const wrong = step.options.find((option) => option.id !== step.word.id).id;
  const checkWrong = (state) => lessonReducer(lessonReducer(state, { type: "answer", answer: wrong }), { type: "check" });
  const feedback = checkWrong(initial);
  assert.equal(feedback.wasCorrect, false);
  assert.equal(feedback.bonusStars, 0);
  assert.equal(lessonReducer(feedback, { type: "check" }), feedback);
  const next = lessonReducer(feedback, { type: "next" });
  assert.equal(next.stepIndex, initial.stepIndex + 1);
  assert.equal(next.lives, 2);
  assert.equal(lessonReducer(checkWrong({ ...initial, lives: 1 }), { type: "next" }).phase, "retry");
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
  const topics = [{ id: "animals", total: 5 }, { id: "food", total: 5 }];
  const save = (topicId, result) => updateStoredProgress(topics, (state, today) => completeLesson(state, topicId, 5, result, today));
  save("animals", best);
  save("animals", { accuracy: 80, xp: 100, stars: 2 });
  const state = parseSavedProgress(saved.get(progressStorageKey));
  const { animals } = state.topicResults;
  assert.equal(animals.accuracy, best.accuracy);
  assert.equal(animals.xp, best.xp);
  assert.equal(animals.stars, best.stars);
  assert.equal(animals.soundCheck, true);
  assert.equal(animals.completions, 2);
  assert.equal(animals.completedDates.length, 1, "same-day replays do not extend the streak");
  assert.equal(state.stars, 3);
  assert.equal(state.learnedWordsCount, 5);
  assert.equal(events.length, 2);
  for (const raw of ["null", "[]", '{"animals":{"accuracy":101,"xp":100,"stars":3}}', '{"animals":{"accuracy":90,"xp":-10,"stars":2}}', JSON.stringify({ animals: { ...best, completedDates: ["2026-02-30"] } }), JSON.stringify({ animals: { ...best, completions: 0 } }), ...[-1, 0.5, Number.MAX_SAFE_INTEGER].map((bonusStars) => JSON.stringify({ animals: { ...best, bonusStars } }))]) {
    assert.throws(() => parseProgress(raw));
  }
  saved.set(progressStorageKey, "broken");
  assert.throws(() => save("food", best));
  assert.equal(saved.get(progressStorageKey), "broken");
  assert.match(JSON.parse(getProgressSnapshot()).error, /Не удалось сохранить прогресс/);
  saved.clear();
  window.localStorage.setItem = () => { throw new Error("Storage blocked"); };
  assert.throws(() => save("animals", best), /Storage blocked/);
});

test("daily activity is calendar-based, idempotent, and keeps earned streak badges", () => {
  let state = markActive(initialProgress(), "2026-03-07");
  assert.equal(state.streak, 1);
  assert.equal(markActive(state, "2026-03-07"), state);
  state = markActive(state, "2026-03-08");
  state = markActive(state, "2026-03-09");
  assert.equal(state.streak, 3, "DST does not shorten or lengthen a calendar day");
  state = markActive(state, "2026-03-11");
  assert.equal(state.streak, 1, "one missed day breaks a consecutive streak");
  assert.equal(state.bestStreak, 3);
  assert.equal(markActive(state, "2026-03-10"), state, "a clock rollback does not award another day");
  assert.equal(markActive(markActive(initialProgress(), "2025-12-31"), "2026-01-01").streak, 2);
  assert.throws(() => markActive(state, "2026-02-30"));
});

test("topic completion counts words once and bonus stars accumulate alongside best lesson rewards", () => {
  let state = rewardStars(initialProgress(), 20);
  state = finishTopic(state, "animals", 5, "2026-03-09");
  assert.equal(finishTopic(state, "animals", 5, "2026-03-09"), state);
  state = completeLesson(state, "animals", 5, { accuracy: 80, xp: 100, stars: 2 }, "2026-03-09");
  state = completeLesson(state, "animals", 5, { accuracy: 100, xp: 100, stars: 3, bonusStars: 2 }, "2026-03-10");
  state = completeLesson(state, "animals", 5, { accuracy: 80, xp: 100, stars: 2, bonusStars: 10 }, "2026-03-10");
  state = completeLesson(state, "animals", 5, { accuracy: 80, xp: 100, stars: 2, bonusStars: 10 }, "2026-03-10");
  state = finishTopic(state, "food", 5, "2026-03-10");
  assert.equal(state.stars, 33, "bonus stars persist without duplicating base or replay rewards");
  assert.equal(parseSavedProgress(JSON.stringify(state)).topicResults.animals.bonusStars, 10);
  assert.equal(getProgressSummary(state.topicResults, [{ id: "animals", total: 5 }], "2026-03-10").stars, 13);
  assert.equal(state.learnedWordsCount, 10);
  assert.deepEqual(state.completedTopics, ["animals", "food"]);
  assert.equal(state.streak, 2);
  for (const amount of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER]) assert.throws(() => rewardStars(state, amount));
  assert.throws(() => finishTopic(state, "", 5, "2026-03-10"));
  assert.throws(() => finishTopic(state, "__proto__", 5, "2026-03-10"));
  assert.throws(() => finishTopic(state, "space", -1, "2026-03-10"));
  assert.throws(() => completeLesson(state, "animals", 5, { accuracy: -1, xp: 100, stars: 2 }, "2026-03-10"));
});

test("migration preserves results and reset replaces corrupt data without resurrecting legacy progress", (t) => {
  const topics = [{ id: "animals", total: 5 }];
  const legacy = JSON.stringify({
    animals: { accuracy: 100, xp: 100, stars: 3, completions: 4, completedDates: ["2026-03-07", "2026-03-08"], soundCheck: true },
  });
  const migrated = migrateProgress(legacy, topics, "2026-03-09");
  assert.equal(migrated.stars, 3);
  assert.equal(migrated.learnedWordsCount, 5);
  assert.equal(migrated.topicResults.animals.completions, 4);
  assert.equal(migrated.topicResults.animals.soundCheck, true);
  assert.equal(migrated.lastActiveDate, "2026-03-08");
  assert.equal(markActive(migrated, "2026-03-09").streak, 3);
  assert.equal(migrateProgress(legacy, topics, "2026-03-06").lastActiveDate, "", "future legacy dates do not award a streak");
  const saved = new Map([["alingua.progress.v1", legacy]]);
  const target = new EventTarget();
  globalThis.window = {
    localStorage: { getItem: (key) => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) },
    dispatchEvent: target.dispatchEvent.bind(target),
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
  };
  t.after(() => { delete globalThis.window; });
  let updates = 0;
  const unsubscribe = subscribeProgress(() => { updates++; });
  updateStoredProgress(topics, (state) => rewardStars(state, 7));
  assert.equal(parseSavedProgress(saved.get(progressStorageKey)).stars, 10);
  assert.equal(saved.get("alingua.progress.v1"), legacy, "migration leaves the old save intact");
  assert.equal(JSON.parse(getProgressSnapshot()).error, null, "successful writes clear earlier persistence errors");
  saved.set(progressStorageKey, "corrupt");
  assert.throws(() => updateStoredProgress(topics, (state, today) => markActive(state, today)));
  assert.equal(saved.get(progressStorageKey), "corrupt");
  updateStoredProgress(topics, () => initialProgress(), true);
  assert.deepEqual(readProgressSnapshot(JSON.parse(getProgressSnapshot()), topics), initialProgress());
  target.dispatchEvent(Object.assign(new Event("storage"), { key: progressStorageKey }));
  assert.equal(updates, 4, "same-tab writes, failures, reset, and cross-tab changes notify consumers");
  unsubscribe();
  target.dispatchEvent(Object.assign(new Event("storage"), { key: progressStorageKey }));
  assert.equal(updates, 4);
});

test("progress snapshots are SSR-safe and the requested five-field shape is validated", () => {
  assert.equal(getProgressSnapshot(), serverProgressSnapshot);
  const base = { stars: 10, streak: 2, lastActiveDate: "2026-03-09", completedTopics: ["animals"], learnedWordsCount: 5 };
  assert.equal(parseSavedProgress(JSON.stringify(base)).stars, 10);
  for (const patch of [
    { stars: -1 }, { streak: 0 }, { lastActiveDate: "2026-02-30" },
    { completedTopics: ["animals", "animals"] }, { completedTopics: [42] }, { learnedWordsCount: 1.5 },
  ]) assert.throws(() => parseSavedProgress(JSON.stringify({ ...base, ...patch })));
  assert.throws(() => updateStoredProgress([], () => initialProgress()), /browser/);
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
