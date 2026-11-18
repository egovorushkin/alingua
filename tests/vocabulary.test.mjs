import assert from "node:assert/strict";
import { test } from "node:test";
import { lessons } from "../src/data/lessons.ts";
import { filterVocabulary } from "../src/utils/vocabulary.ts";

const entries = lessons.flatMap((topic) => topic.words.map((word) => ({ topic, word })));

test("the collection includes locked words, but searching never exposes them", () => {
  assert.equal(filterVocabulary(entries, [], "", "all").length, 20);
  assert.equal(filterVocabulary(entries, [], "cat", "all").length, 0);
  assert.equal(filterVocabulary(entries, ["animals"], "apple", "all").length, 0);
  assert.equal(filterVocabulary(entries, [], "  ", "food").length, 5);
});

test("learned words can be searched in English or Russian regardless of case and surrounding spaces", () => {
  for (const query of [" cAt ", " КОШ ", "Кошка"]) {
    assert.deepEqual(filterVocabulary(entries, ["animals"], query, "all").map(({ word }) => word.id), ["cat"]);
  }
  assert.deepEqual(
    filterVocabulary(entries, ["colors"], " ЗЕЛЁНЫЙ ", "all").map(({ word }) => word.id),
    ["green"],
  );
});

test("search and topic filters combine without altering the vocabulary or saved completion list", () => {
  const completedTopics = ["animals", "food"];
  assert.equal(filterVocabulary(entries, completedTopics, "cat", "food").length, 0);
  assert.deepEqual(filterVocabulary(entries, completedTopics, " ХЛЕБ ", "food").map(({ word }) => word.id), ["bread"]);
  assert.deepEqual(completedTopics, ["animals", "food"]);
  assert.equal(entries.length, 20);
});
