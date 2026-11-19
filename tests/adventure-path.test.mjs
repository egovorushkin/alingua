import assert from "node:assert/strict";
import { test } from "node:test";
import { topics } from "../src/app/topics.ts";
import { adventureChapters, adventureChapterHeight, adventureNodesPerChapter, getAdventureNodes, getAdventurePosition } from "../src/data/adventure.ts";
import { collectAdventureChest, initialProgress, parseSavedProgress, progressStorageKey, updateStoredProgress } from "../src/utils/progress.ts";

test("the path covers every topic once and gates each new chapter behind its boss, not its optional chest", () => {
  const fresh = getAdventureNodes([], []);
  assert.deepEqual(fresh.filter((node) => node.kind === "lesson").map((node) => node.topicId).sort(), topics.map((topic) => topic.id).sort());
  assert.equal(fresh.filter((node) => node.state === "active").length, 1);
  assert.equal(fresh[0].topicId, "animals");
  assert.equal(fresh[0].state, "active");
  assert.ok(fresh.slice(1).every((node) => node.state === "locked"));
  const progressed = getAdventureNodes(["animals", "nature"], []);
  assert.equal(progressed[2].kind, "chest");
  assert.equal(progressed[2].state, "active");
  assert.equal(progressed[3].kind, "boss");
  assert.equal(progressed[3].state, "active");
  assert.equal(progressed[4].state, "locked", "The next chapter requires the preceding boss.");
  assert.equal(getAdventureNodes(["animals", "nature"], [], ["forest"])[4].state, "active", "Claiming a chest must not block learning.");
  assert.equal(getAdventureNodes(["space"], [])[4].state, "completed", "Bento completions remain replayable out of order.");
  assert.equal(getAdventureNodes(["space"], [])[2].state, "locked");
  const allDone = getAdventureNodes(topics.map((topic) => topic.id), adventureChapters.map((chapter) => chapter.id), adventureChapters.map((chapter) => chapter.id));
  assert.ok(allDone.every((node) => node.state === "completed"));
  for (let index = 2; index < fresh.length; index += adventureNodesPerChapter) {
    assert.equal(fresh[index].kind, "chest");
    assert.equal(fresh[index + 1].kind, "boss");
  }
});

test("sine-wave nodes, labels, and SVG coordinates fit a 320px phone without overlapping chapter banners", () => {
  const nodes = getAdventureNodes([], []);
  const positions = nodes.map((_, index) => getAdventurePosition(index));
  assert.ok(positions.some(({ x }) => x > 40) && positions.some(({ x }) => x < -40));
  for (const [index, position] of positions.entries()) {
    assert.ok(Math.abs(position.x) + 64 < (320 - 40) / 2, "128px labels must fit inside the dashboard gutters.");
    const boss = nodes[index].kind === "boss";
    const chapterTop = Math.floor(index / adventureNodesPerChapter) * adventureChapterHeight;
    assert.ok(position.y - (boss ? 112 : 104) >= chapterTop + 112, "The active mascot must clear the chapter banner.");
    assert.ok(position.y + (boss ? 124 : 116) < chapterTop + adventureChapterHeight, "Node labels must clear the next chapter.");
    if (index % adventureNodesPerChapter > 0) {
      assert.ok(position.y - (boss ? 124 : 104) >= positions[index - 1].y + 116 + 8, "The guide must clear the previous node label.");
    }
    if (index) assert.ok(position.y - positions[index - 1].y >= 208);
  }
});

test("chests require all prior lessons and award exactly once across serialization and older saves", () => {
  assert.throws(() => collectAdventureChest(initialProgress(), "forest"), /preceding lessons/);
  assert.throws(() => collectAdventureChest(initialProgress(), "missing"), /Unknown/);
  const eligible = { ...initialProgress(), stars: 7, completedTopics: ["animals", "nature"], learnedWordsCount: 10 };
  const claimed = collectAdventureChest(eligible, "forest");
  assert.equal(claimed.stars, 27);
  assert.deepEqual(claimed.claimedMapChests, ["forest"]);
  const reloaded = parseSavedProgress(JSON.stringify(claimed));
  assert.equal(collectAdventureChest(reloaded, "forest"), reloaded);
  assert.throws(() => collectAdventureChest({ ...eligible, completedTopics: ["space", "colors"] }, "cosmos"), /preceding lessons/);
  const old = { ...eligible };
  delete old.claimedMapChests;
  assert.deepEqual(parseSavedProgress(JSON.stringify(old)).claimedMapChests, []);
  for (const invalid of [null, "forest", ["forest", "forest"], [42], ["__proto__"]]) {
    assert.throws(() => parseSavedProgress(JSON.stringify({ ...eligible, claimedMapChests: invalid })));
  }
});

test("failed chest writes leave the reward unclaimed, and retries and rapid clicks cannot duplicate stars", (t) => {
  const previousWindow = global.window;
  let raw = JSON.stringify({ ...initialProgress(), stars: 7, completedTopics: ["animals", "nature"], learnedWordsCount: 10 });
  let blocked = true;
  global.window = Object.assign(new EventTarget(), {
    localStorage: {
      getItem: (key) => key === progressStorageKey ? raw : null,
      setItem: (_key, value) => { if (blocked) throw new Error("Blocked"); raw = value; },
    },
  });
  t.after(() => previousWindow === undefined ? delete global.window : global.window = previousWindow);
  const claim = () => updateStoredProgress(topics, (state) => collectAdventureChest(state, "forest"));
  assert.throws(claim, /Blocked/);
  assert.equal(parseSavedProgress(raw).stars, 7);
  assert.deepEqual(parseSavedProgress(raw).claimedMapChests, []);
  blocked = false;
  claim();
  claim();
  assert.equal(parseSavedProgress(raw).stars, 27);
  assert.deepEqual(parseSavedProgress(raw).claimedMapChests, ["forest"]);
});
