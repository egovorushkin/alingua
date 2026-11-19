import assert from "node:assert/strict";
import { setImmediate } from "node:timers/promises";
import { test } from "node:test";
import { getSupabaseConfig } from "../src/lib/supabase/config.ts";
import { progressFromRow, progressToRow, startProgressSync } from "../src/lib/supabase/sync.ts";
import {
  accountProgressKey, cacheCloudProgress, completeLesson, initialProgress, parseCloudCache,
  progressStorageKey, rewardStars, updateStoredProgress,
} from "../src/utils/progress.ts";

const topics = [{ id: "animals", total: 5 }];
const userId = "account-a";
const key = accountProgressKey(userId);
const row = (progress, revision = 1, id = userId) => ({
  user_id: id, ...progressToRow(progress), revision, updated_at: "2026-03-01T00:00:00Z",
});
const jsonb = (value) => JSON.parse(JSON.stringify(value, (_key, value) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => b.localeCompare(a))) : value));
async function until(predicate) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (predicate()) return;
    await setImmediate();
  }
  assert.fail("Synchronization did not reach its expected state.");
}

function harness(t, { remote = null, guest = initialProgress() } = {}) {
  const previousWindow = global.window;
  const storage = new Map([[progressStorageKey, JSON.stringify(guest)]]);
  const target = new EventTarget();
  target.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
  global.window = target;
  const controllers = [];
  t.after(() => {
    controllers.forEach((controller) => controller.stop());
    if (previousWindow === undefined) delete global.window;
    else global.window = previousWindow;
  });
  const db = { remote, offline: false, before: null, after: null, calls: [] };
  const client = {
    from(table) {
      assert.equal(table, "user_progress");
      let action = "select";
      let payload;
      const filters = {};
      const query = {
        select() { return query; },
        eq(field, value) { filters[field] = value; return query; },
        upsert(value, options) {
          assert.equal(options.ignoreDuplicates, true);
          action = "insert"; payload = structuredClone(value); return query;
        },
        update(value) { action = "update"; payload = structuredClone(value); return query; },
        async maybeSingle() {
          db.calls.push({ action, filters: { ...filters }, payload });
          assert.ok(db.calls.length < 50, "A save must not cause an endless synchronization loop.");
          if (db.before) await db.before({ action, payload });
          if (db.offline) return { data: null, error: new Error("Offline") };
          if (action === "insert") {
            if (db.remote) return { data: null, error: null };
            db.remote = { ...payload, revision: 1, updated_at: "2026-03-01T00:00:00Z" };
          } else {
            assert.ok(filters.user_id, "Reads and writes must be account-scoped.");
            if (!db.remote || db.remote.user_id !== filters.user_id) return { data: null, error: null };
            if (action === "update") {
              assert.ok(Number.isSafeInteger(filters.revision));
              if (filters.revision !== db.remote.revision) return { data: null, error: null };
              db.remote = { ...db.remote, ...payload, revision: db.remote.revision + 1 };
            }
          }
          const error = db.after?.({ action });
          return error ? { data: null, error } : { data: jsonb(db.remote), error: null };
        },
      };
      return query;
    },
  };
  const states = [];
  return {
    db, storage, states,
    cached: () => parseCloudCache(storage.get(key) ?? null),
    start(id = userId) {
      const controller = startProgressSync(client, id, topics, (state) => states.push(state));
      controllers.push(controller);
      return controller;
    },
  };
}

test("Supabase config permits guest mode and public keys, but rejects unsafe or partial configuration", (t) => {
  const names = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  const saved = names.map((name) => process.env[name]);
  t.after(() => names.forEach((name, i) => saved[i] === undefined ? delete process.env[name] : process.env[name] = saved[i]));
  names.forEach((name) => delete process.env[name]);
  assert.equal(getSupabaseConfig(), null);
  process.env[names[0]] = "https://example.supabase.co";
  assert.throws(getSupabaseConfig);
  process.env[names[1]] = "sb_publishable_test";
  assert.equal(getSupabaseConfig().url, "https://example.supabase.co");
  for (const unsafe of ["http://example.com", "https://user:password@example.com", "https://example.com/path", "not a URL"]) {
    process.env[names[0]] = unsafe;
    assert.throws(getSupabaseConfig);
  }
  process.env[names[0]] = "http://localhost:54321";
  assert.equal(getSupabaseConfig().url, "http://localhost:54321");
  for (const unsafe of ["sb_secret_test", `x.${btoa(JSON.stringify({ role: "service_role" }))}.x`, "invalid"]) {
    process.env[names[1]] = unsafe;
    assert.throws(getSupabaseConfig);
  }
  process.env[names[1]] = `x.${btoa(JSON.stringify({ role: "anon" }))}.x`;
  assert.ok(getSupabaseConfig());
});

test("new accounts import all guest rewards once; JSONB object ordering does not cause repeated saves", async (t) => {
  const guest = {
    ...initialProgress(), stars: 72, streak: 7, bestStreak: 7, lastActiveDate: "2026-03-01",
    completedTopics: ["animals", "nature"], learnedWordsCount: 10, dailyBonusBadge: true, claimedMapChests: ["forest"],
    lastClaimedDate: "2026-03-01", consecutiveDays: 7,
    topicResults: { animals: { accuracy: 80, xp: 50, stars: 3, bonusStars: 2, completions: 1, soundCheck: true } },
  };
  const h = harness(t, { guest });
  const originalGuest = h.storage.get(progressStorageKey);
  h.start();
  await until(() => h.states.at(-1)?.status === "synced");
  assert.deepEqual(progressFromRow(h.db.remote, userId), guest);
  assert.equal(h.cached().dirty, false);
  assert.deepEqual(h.db.calls.map((call) => call.action), ["select", "insert"]);
  assert.equal(h.storage.get(progressStorageKey), originalGuest);
  updateStoredProgress(topics, (state, today) => completeLesson(state, "animals", 5, { accuracy: 100, xp: 70, stars: 3, bonusStars: 4 }, today), false, key);
  await until(() => !h.cached().dirty);
  assert.equal(h.db.remote.stars, 74);
  assert.equal(h.db.remote.revision, 2);
  assert.equal(h.db.calls.filter((call) => call.action === "update").length, 1);
  updateStoredProgress(topics, () => initialProgress(), true, key);
  await until(() => !h.cached().dirty);
  assert.equal(h.db.remote.stars, 0);
  assert.equal(h.db.remote.revision, 3);
});

test("existing cloud progress wins over guest data and account caches stay isolated", async (t) => {
  const h = harness(t, { guest: { ...initialProgress(), stars: 999 }, remote: row({ ...initialProgress(), stars: 25 }, 4) });
  h.storage.set(accountProgressKey("account-b"), "unrelated account data");
  h.start();
  await until(() => h.states.at(-1)?.status === "synced");
  assert.equal(h.cached().progress.stars, 25);
  assert.equal(h.storage.get(accountProgressKey("account-b")), "unrelated account data");
  assert.deepEqual(h.db.calls.map((call) => call.action), ["select"]);
  assert.throws(() => progressFromRow(h.db.remote, "account-b"), /owner/);
});

test("an account waits for its first read; a competing first insert never overwrites the winner", async (t) => {
  const h = harness(t, { guest: { ...initialProgress(), stars: 90 } });
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  h.db.before = async ({ action }) => {
    if (action === "select" && !h.db.remote) await pending;
    if (action === "insert") h.db.remote = row({ ...initialProgress(), stars: 10 });
  };
  h.start();
  await until(() => h.db.calls.length === 1);
  assert.equal(h.cached(), null);
  assert.deepEqual(h.db.calls.map((call) => call.action), ["select"]);
  release();
  await until(() => h.states.at(-1)?.status === "conflict");
  assert.equal(h.db.remote.stars, 10);
  assert.equal(h.cached().progress.stars, 90);
});

test("offline saves remain dirty and retry without adding rewards a second time", async (t) => {
  const h = harness(t, { remote: row(initialProgress()) });
  const controller = h.start();
  await until(() => h.states.at(-1)?.status === "synced");
  h.db.offline = true;
  updateStoredProgress(topics, (state) => rewardStars(state, 10), false, key);
  await until(() => h.states.at(-1)?.status === "error");
  assert.equal(h.cached().progress.stars, 10);
  assert.equal(h.cached().dirty, true);
  assert.equal(h.db.remote.stars, 0);
  h.db.offline = false;
  controller.retry();
  await until(() => !h.cached().dirty);
  assert.equal(h.db.remote.stars, 10);
  controller.retry();
  await until(() => h.states.at(-1)?.status === "synced");
  assert.equal(h.db.remote.stars, 10);
  h.db.after = ({ action }) => {
    if (action !== "update") return null;
    h.db.after = null;
    return new Error("Response lost after commit");
  };
  updateStoredProgress(topics, (state) => rewardStars(state, 5), false, key);
  await until(() => h.states.at(-1)?.status === "error");
  assert.equal(h.db.remote.stars, 15);
  assert.equal(h.cached().dirty, true);
  controller.retry();
  await until(() => !h.cached().dirty);
  assert.equal(h.db.remote.stars, 15);
  assert.equal(h.db.remote.revision, 3);
});

test("changes arriving during a save are retained and sent with the new revision", async (t) => {
  const h = harness(t, { remote: row(initialProgress()) });
  h.start();
  await until(() => h.states.at(-1)?.status === "synced");
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  h.db.before = async ({ action }) => { if (action === "update") { h.db.before = null; await pending; } };
  updateStoredProgress(topics, (state) => rewardStars(state, 10), false, key);
  await until(() => h.db.calls.some((call) => call.action === "update"));
  updateStoredProgress(topics, (state) => rewardStars(state, 5), false, key);
  release();
  await until(() => !h.cached().dirty);
  assert.equal(h.db.remote.stars, 15);
  assert.equal(h.cached().progress.stars, 15);
  assert.deepEqual(h.db.calls.filter((call) => call.action === "update").map((call) => call.filters.revision), [1, 2]);
});

test("concurrent revisions require an explicit local/cloud choice; damaged caches can recover from cloud", async (t) => {
  const h = harness(t, { remote: row({ ...initialProgress(), stars: 30 }, 2) });
  cacheCloudProgress(key, { ...initialProgress(), stars: 10 }, 1, true);
  const controller = h.start();
  await until(() => h.states.at(-1)?.status === "conflict");
  assert.equal(h.db.remote.stars, 30);
  controller.resolve("local");
  await until(() => !h.cached().dirty);
  assert.equal(h.db.remote.stars, 10);
  assert.equal(h.db.remote.revision, 3);
  h.storage.set(key, "{broken");
  controller.retry();
  await until(() => h.states.at(-1)?.status === "error");
  controller.resolve("cloud");
  await until(() => h.states.at(-1)?.status === "synced");
  assert.equal(h.cached().progress.stars, 10);
  assert.equal(h.cached().revision, 3);
});

test("a stopped account ignores late responses and does not populate any other account cache", async (t) => {
  const h = harness(t, { remote: row({ ...initialProgress(), stars: 50 }) });
  let release;
  h.db.before = () => new Promise((resolve) => { release = resolve; });
  const controller = h.start();
  await until(() => release);
  controller.stop();
  release();
  await setImmediate();
  assert.equal(h.cached(), null);
  assert.equal(h.storage.has(accountProgressKey("account-b")), false);
  assert.equal(h.states.some((state) => state.status === "synced"), false);
});
