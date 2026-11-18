import assert from "node:assert/strict";
import { test } from "node:test";
import { lessons } from "../src/data/lessons.ts";
import { createChoices, createListeningRounds } from "../src/components/lesson/lesson-state.ts";
import { initialListenGame, listenGameReducer } from "../src/components/lesson/listen-game-state.ts";

const pool = lessons.flatMap((topic) => topic.words);

test("five listening rounds have unique targets and four distinct choices from the vocabulary pool", () => {
  const rounds = createListeningRounds([...pool, ...pool], () => 0.99);
  assert.equal(rounds.length, 5);
  assert.equal(new Set(rounds.map(({ word }) => word.id)).size, 5);
  for (const { word, options } of rounds) {
    assert.equal(options.length, 4);
    assert.equal(new Set(options.map((option) => option.id)).size, 4);
    assert.equal(options.filter((option) => option.id === word.id).length, 1);
    assert.ok(options.every((option) => pool.includes(option)));
  }
  assert.notDeepEqual(rounds, createListeningRounds(pool, () => 0));
  assert.throws(() => createListeningRounds(pool.slice(0, 4), Math.random));
  assert.throws(() => createChoices(pool[0], pool.slice(0, 3), Math.random));
});

test("the challenge scores each answer once, continues after mistakes, and finishes after five rounds", () => {
  let state = listenGameReducer(initialListenGame, { type: "start", rounds: createListeningRounds(pool, () => 0.5) });
  assert.equal(listenGameReducer(state, { type: "check" }), state);
  assert.equal(listenGameReducer(state, { type: "next" }), state);
  assert.equal(listenGameReducer(state, { type: "answer", answer: "not-an-option" }), state);
  for (let index = 0; index < 5; index++) {
    const round = state.rounds[index];
    const answer = index === 1 ? round.options.find((option) => option.id !== round.word.id).id : round.word.id;
    state = listenGameReducer(state, { type: "answer", answer });
    state = listenGameReducer(state, { type: "check" });
    assert.equal(state.wasCorrect, index !== 1);
    assert.equal(listenGameReducer(state, { type: "check" }), state);
    assert.equal(listenGameReducer(state, { type: "answer", answer: round.word.id }), state);
    state = listenGameReducer(state, { type: "next" });
  }
  assert.equal(state.phase, "complete");
  assert.equal(state.correct * 2, 8);
  assert.equal(state.roundIndex, 5);
  assert.equal(listenGameReducer(state, { type: "next" }), state);
  assert.equal(listenGameReducer(state, { type: "check" }), state);
  assert.deepEqual(listenGameReducer(state, { type: "restart" }), initialListenGame);
});
