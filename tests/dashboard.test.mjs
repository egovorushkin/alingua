import assert from "node:assert/strict";
import { test } from "node:test";

test("dashboard topics lead to their lesson stubs", async () => {
  const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";
  const home = await fetch(base);
  assert.equal(home.status, 200);
  const html = await home.text();

  for (const topic of ["animals", "food", "space", "colors"]) {
    assert.ok(html.includes(`/lesson/${topic}`));
    const lesson = await fetch(`${base}/lesson/${topic}`);
    assert.equal(lesson.status, 200);
    assert.match(await lesson.text(), /coming soon/i);
  }

  const unknown = await fetch(`${base}/lesson/not-a-topic`);
  assert.match(await unknown.text(), /NEXT_HTTP_ERROR_FALLBACK;404/);
});
