import assert from "node:assert/strict";
import { test } from "node:test";
import { setImmediate } from "node:timers/promises";
import { curriculumKey, emptyCurriculum } from "../src/data/curriculum.ts";
import { changeCurriculum, parseCurriculumCache } from "../src/lib/curriculum-store.ts";
import { startCurriculumSync } from "../src/lib/supabase/curriculum-sync.ts";

const chapter = (id) => ({ id, title: id, description: "", themeColor: "#123456" });
const content = (id) => ({ ...emptyCurriculum(), chapters: [chapter(id)] });
async function until(predicate) {
  for (let i = 0; i < 100; i++) { if (predicate()) return; await setImmediate(); }
  assert.fail("Curriculum synchronization did not settle.");
}
function harness(t, remote = null) {
  const original = global.window, storage = new Map(), states = [], controllers = [];
  global.window = Object.assign(new EventTarget(), { localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) } });
  t.after(() => {
    controllers.forEach((value) => value.stop());
    if (original === undefined) delete global.window;
    else global.window = original;
  });
  const db = { remote, fail: false, before: null, calls: [] };
  const client = {
    from(table) {
      assert.equal(table, "user_curricula");
      let action = "select", payload;
      const filters = {};
      const query = {
        select() { return query; }, eq(key, value) { filters[key] = value; return query; },
        upsert(value, options) { assert.equal(options.ignoreDuplicates, true); action = "insert"; payload = structuredClone(value); return query; },
        update(value) { action = "update"; payload = structuredClone(value); return query; },
        async maybeSingle() {
          db.calls.push(action); assert.ok(db.calls.length < 30, "No synchronization loop.");
          if (db.before) await db.before(action);
          if (db.fail) return { data: null, error: new Error("Missing table or offline") };
          if (action === "insert") {
            if (db.remote) return { data: null, error: null };
            db.remote = { ...payload, revision: 1 };
          } else {
            assert.equal(filters.user_id, "a");
            if (action === "update") {
              assert.ok(Number.isInteger(filters.revision));
              if (!db.remote || filters.revision !== db.remote.revision) return { data: null, error: null };
              db.remote = { ...db.remote, ...payload, revision: db.remote.revision + 1 };
            }
          }
          const jsonb = JSON.parse(JSON.stringify(db.remote, (_key, value) => value && typeof value === "object" && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).reverse()) : value));
          return { data: jsonb, error: null };
        },
      };
      return query;
    },
  };
  return {
    db, storage, states,
    cache: () => parseCurriculumCache(storage.get(curriculumKey("a")) ?? null),
    start() { const controller = startCurriculumSync(client, "a", (value) => states.push(value)); controllers.push(controller); return controller; },
  };
}

test("first accounts import guest content once, normalize JSONB order and keep later edits during writes", async (t) => {
  const h = harness(t);
  changeCurriculum(curriculumKey(null), () => content("guest"));
  h.start();
  await until(() => h.states.at(-1)?.status === "synced");
  assert.equal(h.cache().edits.chapters[0].id, "guest");
  assert.deepEqual(h.db.calls, ["select", "insert"]);
  let once = false;
  h.db.before = async (action) => {
    if (action === "update" && !once) {
      once = true;
      changeCurriculum(curriculumKey("a"), (edits) => ({ ...edits, chapters: [...edits.chapters, chapter("later")] }));
    }
  };
  changeCurriculum(curriculumKey("a"), (edits) => ({ ...edits, chapters: [...edits.chapters, chapter("first")] }));
  await until(() => !h.cache().dirty);
  assert.deepEqual(h.db.remote.content.chapters.map((value) => value.id), ["guest", "first", "later"]);
  assert.equal(h.db.remote.revision, 3);
});

test("existing cloud curriculum wins over guest content without touching another account cache", async (t) => {
  const h = harness(t, { user_id: "a", content: content("cloud"), revision: 4 });
  changeCurriculum(curriculumKey(null), () => content("guest"));
  h.storage.set(curriculumKey("b"), "other account");
  h.start();
  await until(() => h.states.at(-1)?.status === "synced");
  assert.equal(h.cache().edits.chapters[0].id, "cloud");
  assert.equal(h.storage.get(curriculumKey("b")), "other account");
  assert.deepEqual(h.db.calls, ["select"]);
});

test("a missing table leaves local edits dirty and retry uploads them once", async (t) => {
  const h = harness(t);
  h.db.fail = true;
  const controller = h.start();
  await until(() => h.states.at(-1)?.status === "error");
  changeCurriculum(curriculumKey("a"), () => content("offline"));
  await until(() => h.states.at(-1)?.status === "error");
  assert.equal(h.cache().dirty, true);
  assert.equal(h.cache().edits.chapters[0].id, "offline");
  h.db.fail = false;
  controller.retry();
  await until(() => h.states.at(-1)?.status === "synced");
  assert.equal(h.cache().dirty, false);
  assert.equal(h.db.remote.content.chapters[0].id, "offline");
  assert.equal(h.db.remote.revision, 1);
});

test("stale revisions never overwrite another device without an explicit local or cloud choice", async (t) => {
  const h = harness(t, { user_id: "a", content: content("old"), revision: 1 });
  const controller = h.start();
  await until(() => h.states.at(-1)?.status === "synced");
  h.db.remote = { user_id: "a", content: content("remote"), revision: 2 };
  changeCurriculum(curriculumKey("a"), () => content("local"));
  await until(() => h.states.at(-1)?.status === "conflict");
  assert.equal(h.db.remote.content.chapters[0].id, "remote");
  controller.resolve("cloud");
  await until(() => h.states.at(-1)?.status === "synced");
  assert.equal(h.cache().edits.chapters[0].id, "remote");
  h.db.remote = { user_id: "a", content: content("remote-again"), revision: 3 };
  changeCurriculum(curriculumKey("a"), () => content("local-again"));
  await until(() => h.states.at(-1)?.status === "conflict");
  controller.resolve("local");
  await until(() => h.states.at(-1)?.status === "synced");
  assert.equal(h.db.remote.content.chapters[0].id, "local-again");
  assert.equal(h.db.remote.revision, 4);
});

test("a stopped identity ignores a late cloud response", async (t) => {
  const h = harness(t, { user_id: "a", content: content("private"), revision: 1 });
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  h.db.before = () => pending;
  const controller = h.start();
  await until(() => h.db.calls.length === 1);
  controller.stop();
  release();
  await setImmediate();
  assert.equal(h.cache(), null);
});
