import assert from "node:assert/strict";
import { test } from "node:test";

test("guest authentication routes offer local play and guard the account without open redirects", async () => {
  const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";
  const login = await fetch(`${base}/login`);
  assert.equal(login.status, 200);
  const html = await login.text();
  assert.match(html, /Почта родителя/);
  assert.match(html, /Продолжить с Google/);
  assert.match(html, /Играть без аккаунта/);
  const account = await fetch(`${base}/account`, { redirect: "manual" });
  assert.equal(account.status, 307);
  const accountDestination = new URL(account.headers.get("location"), base);
  assert.equal(accountDestination.origin, new URL(base).origin);
  assert.equal(accountDestination.pathname, "/login");
  assert.match(account.headers.get("cache-control"), /no-store/);
  const callback = await fetch(`${base}/auth/callback?next=https://example.com`, { redirect: "manual" });
  assert.equal(callback.status, 307);
  const destination = new URL(callback.headers.get("location"), base);
  assert.equal(destination.origin, new URL(base).origin);
  assert.equal(destination.pathname, "/login");
  assert.match(callback.headers.get("cache-control"), /no-store/);
});

test("Russian screens keep existing navigation and English learning content", async () => {
  const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";
  const home = await fetch(base);
  assert.equal(home.status, 200);
  const html = await home.text();
  assert.match(html, /<html[^>]*lang="ru"/);
  assert.match(html, /Alingua \| Английский с радостью/);
  assert.match(html, /Привет, исследователь!/);
  assert.match(html, /Начать урок/);
  assert.match(html, /Подарок дня/);
  assert.match(html, /aria-label="Карта приключений" aria-pressed="true"/);
  assert.match(html, /Зачарованный лес/);
  assert.match(html, /Космическая станция/);
  assert.match(html, /aria-label="Природа: Закрыто"/);
  assert.ok(html.includes('href="/lesson/animals"'));
  assert.ok(!html.includes('href="/lesson/nature"'));
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

  for (const [topic, firstWord] of [
    ["animals", "Cat"], ["food", "Apple"], ["space", "Star"],
    ["colors", "Red"], ["nature", "Tree"], ["transport", "Car"],
  ]) {
    const lesson = await fetch(`${base}/lesson/${topic}`);
    assert.equal(lesson.status, 200);
    const content = await lesson.text();
    assert.match(content, /Познакомься с новым словом!/);
    assert.match(content, new RegExp(`<span lang="en"[^>]*>${firstWord}</span>`));
    if (topic === "space") assert.match(content, /<img[^>]+src="\/icons\/3dicons\/star\.webp"/);
  }

  const unknown = await fetch(`${base}/lesson/not-a-topic`);
  const unknownHtml = await unknown.text();
  assert.equal(unknown.status, 200, "Local-only topics must receive a shell before client-side catalog resolution.");
  assert.match(unknownHtml, /Загружаем урок/);
  for (const [chapter, title] of [["forest", "Хранитель леса"], ["cosmos", "Космический хранитель"], ["journey", "Хранитель путешествий"]]) {
    const response = await fetch(`${base}/lesson/boss-${chapter}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.ok(html.includes(title));
    assert.ok(!html.includes("Познакомься с новым словом!"), "Boss routes must not expose a regular flashcard lesson.");
  }
  const missingBoss = await fetch(`${base}/lesson/boss-missing`);
  assert.match(await missingBoss.text(), /Загружаем урок/);
  const admin = await fetch(`${base}/admin`);
  assert.equal(admin.status, 200);
  assert.match(await admin.text(), /Загружаем родительскую панель/);
  assert.ok(!html.includes('href="/admin"'), "The parent studio stays out of child navigation.");
});
