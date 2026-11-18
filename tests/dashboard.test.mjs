import assert from "node:assert/strict";
import { test } from "node:test";

test("Russian screens keep existing navigation and English learning content", async () => {
  const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";
  const home = await fetch(base);
  assert.equal(home.status, 200);
  const html = await home.text();
  assert.match(html, /<html[^>]*lang="ru"/);
  assert.match(html, /Alingua \| Английский с радостью/);
  assert.match(html, /Привет, исследователь!/);
  assert.match(html, /Начать урок/);
  assert.ok(html.includes('href="/profile"'));
  assert.ok(html.includes('href="/vocabulary"'));
  assert.ok(html.includes('href="/games/listen"'));
  const listeningGame = await fetch(`${base}/games/listen`);
  assert.equal(listeningGame.status, 200);
  const listeningHtml = await listeningGame.text();
  assert.match(listeningHtml, /Слушай и угадывай/);
  assert.match(listeningHtml, /Начать игру/);
  const profile = await fetch(`${base}/profile`);
  assert.equal(profile.status, 200);
  const profileHtml = await profile.text();
  assert.match(profileHtml, /Исследователь Alingua/);
  assert.match(profileHtml, /Твоя коллекция значков/);
  assert.ok(profileHtml.includes('href="/vocabulary"'));
  const vocabulary = await fetch(`${base}/vocabulary`);
  assert.equal(vocabulary.status, 200);
  const vocabularyHtml = await vocabulary.text();
  assert.match(vocabularyHtml, /Копилка слов/);
  assert.match(vocabularyHtml, /Поиск среди изученных слов/);

  assert.match(html, /<img[^>]+src="\/icons\/3dicons\/reindeer\.webp"/);
  const spaceArt = await fetch(`${base}/icons/3dicons/star.webp`);
  assert.equal(spaceArt.status, 200);
  assert.match(spaceArt.headers.get("content-type"), /^image\/webp/);

  for (const [topic, firstWord, lastTranslation] of [
    ["animals", "Cat", "Слон"],
    ["food", "Apple", "Морковь"],
    ["space", "Star", "Ракета"],
    ["colors", "Red", "Фиолетовый"],
    ["nature", "Tree", "Птица"],
    ["transport", "Car", "Лодка"],
  ]) {
    assert.ok(html.includes(`/lesson/${topic}`));
    const lesson = await fetch(`${base}/lesson/${topic}`);
    assert.equal(lesson.status, 200);
    const content = await lesson.text();
    assert.match(content, /Познакомься с новым словом!/);
    assert.match(content, new RegExp(`<span lang="en"[^>]*>${firstWord}</span>`));
    assert.ok(content.includes(lastTranslation));
    if (topic === "space") assert.match(content, /<img[^>]+src="\/icons\/3dicons\/star\.webp"/);
  }

  const unknown = await fetch(`${base}/lesson/not-a-topic`);
  const unknownHtml = await unknown.text();
  assert.match(unknownHtml, /NEXT_HTTP_ERROR_FALLBACK;404/);
  assert.match(unknownHtml, /Ой, эта страница потерялась!/);
});
