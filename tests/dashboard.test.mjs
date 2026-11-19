import assert from "node:assert/strict";
import { test } from "node:test";

test("the public welcome page starts the first lesson without an account", async () => {
  const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";
  const welcome = await fetch(`${base}/welcome`);
  assert.equal(welcome.status, 200);
  const html = await welcome.text();
  assert.match(html, /<h1[^>]*>Английский/);
  const start = html.match(/<a [^>]*href="([^"]+)"[^>]*>Начать бесплатно/);
  assert.ok(start);
  const lesson = await fetch(new URL(start[1], base), { redirect: "manual" });
  assert.equal(lesson.status, 200);
  assert.match(await lesson.text(), /Познакомься с новым словом!/);
  for (const [label, route] of [["Вход для родителей", "/login"], ["Копилка слов", "/vocabulary"], ["Профиль", "/profile"]]) {
    assert.match(html, new RegExp(`<a [^>]*href="${route}"[^>]*>${label}</a>`));
  }
});

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

test("the root waits for browser entry state before showing either screen", async () => {
  const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";
  const home = await fetch(base);
  assert.equal(home.status, 200);
  const html = await home.text();
  assert.match(html, /<html[^>]*lang="ru"/);
  assert.match(html, /Alingua \| Английский с радостью/);
  assert.match(html, /Готовим приключение…/);
  assert.doesNotMatch(html, /Привет, исследователь!|Английское приключение для детей|Подарок дня/);
});

test("Russian screens keep existing navigation and English learning content", async () => {
  const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";
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
});
