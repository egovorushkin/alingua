import assert from "node:assert/strict";
import { test } from "node:test";

test("dashboard topics lead to their lessons", async () => {
  const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";
  const home = await fetch(base);
  assert.equal(home.status, 200);
  const html = await home.text();
  assert.ok(html.includes('href="/profile"'));
  const profile = await fetch(`${base}/profile`);
  assert.equal(profile.status, 200);
  const profileHtml = await profile.text();
  assert.match(profileHtml, /Alingua Explorer/);
  assert.match(profileHtml, /Your badge collection/);

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
