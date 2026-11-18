import assert from "node:assert/strict";
import { test } from "node:test";

test("dashboard topics lead to their lessons", async () => {
  const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";
  const home = await fetch(base);
  assert.equal(home.status, 200);
  const html = await home.text();
  assert.ok(html.includes('href="/profile"'));
  assert.ok(html.includes('href="/vocabulary"'));
  assert.ok(html.includes('href="/games/listen"'));
  const listeningGame = await fetch(`${base}/games/listen`);
  assert.equal(listeningGame.status, 200);
  const listeningHtml = await listeningGame.text();
  assert.match(listeningHtml, /Listen &amp; Guess/);
  assert.match(listeningHtml, /Start listening/);
  const profile = await fetch(`${base}/profile`);
  assert.equal(profile.status, 200);
  const profileHtml = await profile.text();
  assert.match(profileHtml, /Alingua Explorer/);
  assert.match(profileHtml, /Your badge collection/);
  assert.ok(profileHtml.includes('href="/vocabulary"'));
  const vocabulary = await fetch(`${base}/vocabulary`);
  assert.equal(vocabulary.status, 200);
  const vocabularyHtml = await vocabulary.text();
  assert.match(vocabularyHtml, /Word Treasury/);
  assert.match(vocabularyHtml, /Search your learned words/);

  for (const [topic, firstWord, lastTranslation] of [
    ["animals", "Cat", "Слон"],
    ["food", "Apple", "Морковь"],
    ["space", "Star", "Ракета"],
    ["colors", "Red", "Фиолетовый"],
  ]) {
    assert.ok(html.includes(`/lesson/${topic}`));
    const lesson = await fetch(`${base}/lesson/${topic}`);
    assert.equal(lesson.status, 200);
    const content = await lesson.text();
    assert.match(content, /Meet a new word!/);
    assert.ok(content.includes(firstWord));
    assert.ok(content.includes(lastTranslation));
  }

  const unknown = await fetch(`${base}/lesson/not-a-topic`);
  assert.match(await unknown.text(), /NEXT_HTTP_ERROR_FALLBACK;404/);
});
