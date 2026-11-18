import assert from "node:assert/strict";
import { test } from "node:test";
import { soundFX } from "../src/utils/sound.ts";

test("sound calls are safe during SSR", () => {
  assert.doesNotThrow(() => {
    soundFX.playClick();
    soundFX.playSuccess();
    soundFX.playError();
  });
});

test("sounds reuse and resume one context, synthesize the requested notes, and obey mute", async (t) => {
  const oscillators = [];
  const filters = [];
  const gains = [];
  let created = 0;
  let resumed = 0;
  let cancelledSpeech = 0;
  const instances = [];
  const param = () => ({
    value: 0,
    events: [],
    setValueAtTime(value, time) { this.events.push(["set", value, time]); },
    linearRampToValueAtTime(value, time) { this.events.push(["linear", value, time]); },
    exponentialRampToValueAtTime(value, time) { this.events.push(["exponential", value, time]); },
  });
  const node = () => ({ connect() {}, disconnect() { this.disconnected = true; } });
  class MockAudioContext {
    state = "suspended";
    currentTime = 10;
    destination = {};
    constructor() { created++; instances.push(this); }
    async resume() { resumed++; this.state = "running"; }
    createGain() { const gain = { ...node(), gain: param() }; gains.push(gain); return gain; }
    createBiquadFilter() { const filter = { ...node(), frequency: param(), Q: param() }; filters.push(filter); return filter; }
    createOscillator() {
      const oscillator = { ...node(), frequency: param(), starts: [], stops: [], start(time) { this.starts.push(time); }, stop(time) { this.stops.push(time); } };
      oscillators.push(oscillator);
      return oscillator;
    }
  }
  globalThis.window = {
    AudioContext: MockAudioContext,
    speechSynthesis: { cancel() { cancelledSpeech++; } },
  };
  t.after(() => { soundFX.setMuted(false); delete globalThis.window; });
  soundFX.playClick();
  await new Promise(setImmediate);
  soundFX.playSuccess();
  soundFX.playError();
  assert.equal(created, 1);
  const [audio] = instances;
  assert.equal(resumed, 1);
  assert.equal(oscillators.length, 5);
  assert.deepEqual(oscillators.map((oscillator) => oscillator.frequency.events[0][1]), [400, 523.25, 659.25, 783.99, 150]);
  assert.equal(oscillators[0].frequency.events[1][1], 200);
  assert.ok(Math.abs(oscillators[0].stops[0] - oscillators[0].starts[0] - 0.05) < 0.00001);
  assert.ok(oscillators[1].starts[0] < oscillators[2].starts[0] && oscillators[2].starts[0] < oscillators[3].starts[0]);
  assert.equal(oscillators[4].type, "sawtooth");
  assert.equal(oscillators[4].frequency.events[1][1], 80);
  assert.equal(filters[4].frequency.value, 450);
  assert.equal(gains[1].gain.events.at(-1)[1], 0.0001);

  soundFX.setMuted(true);
  assert.equal(cancelledSpeech, 1);
  assert.equal(gains[0].gain.events.at(-1)[1], 0);
  assert.ok(oscillators.every((oscillator) => oscillator.stops.at(-1) === undefined));
  soundFX.playSuccess();
  assert.equal(oscillators.length, 5);
  oscillators.forEach((oscillator) => oscillator.onended());
  assert.ok(oscillators.every((oscillator) => oscillator.disconnected));
  assert.ok(filters.every((filter) => filter.disconnected));

  soundFX.setMuted(false);
  audio.state = "suspended";
  let resume;
  audio.resume = () => new Promise((resolve) => { resume = () => { audio.state = "running"; resolve(); }; });
  soundFX.playClick();
  soundFX.setMuted(true);
  soundFX.setMuted(false);
  resume();
  await new Promise(setImmediate);
  assert.equal(oscillators.length, 5, "muting discards audio waiting for permission");

  audio.state = "suspended";
  audio.resume = () => Promise.reject(new Error("Audio blocked"));
  const warnings = [];
  t.mock.method(console, "warn", (...args) => warnings.push(args));
  soundFX.playError();
  await new Promise(setImmediate);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0][0], /sound effects are unavailable/);
});
