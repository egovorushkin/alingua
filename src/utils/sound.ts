interface Note {
  frequency: number;
  endFrequency?: number;
  delay?: number;
  duration: number;
  type?: OscillatorType;
}

let context: AudioContext | undefined;
let output: GainNode | undefined;
let muted = false;
let failureReported = false;
let generation = 0;
const listeners = new Set<() => void>();
const active = new Set<OscillatorNode>();

function reportFailure(error: unknown) {
  if (!failureReported) {
    console.warn("Alingua sound effects are unavailable; lessons still work.", error);
    failureReported = true;
  }
}

async function play(notes: Note[]) {
  if (typeof window === "undefined" || muted) return;
  const requestedGeneration = generation;
  try {
    if (typeof window.AudioContext !== "function") {
      reportFailure("This browser does not support Web Audio.");
      return;
    }
    if (!context || context.state === "closed") {
      context = new window.AudioContext();
      output = context.createGain();
      output.connect(context.destination);
    }
    if (context.state === "suspended") await context.resume();
    if (muted || generation !== requestedGeneration) return;
    if (context.state !== "running" || !output) {
      reportFailure("The browser could not start audio playback.");
      return;
    }

    for (const note of notes) {
      const start = context.currentTime + 0.005 + (note.delay ?? 0);
      const end = start + note.duration;
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      const filter = context.createBiquadFilter();
      oscillator.type = note.type ?? "sine";
      oscillator.frequency.setValueAtTime(note.frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(note.endFrequency ?? note.frequency, end);
      filter.type = "lowpass";
      filter.frequency.value = oscillator.type === "sawtooth" ? 450 : 4000;
      filter.Q.value = 0.5;
      envelope.gain.setValueAtTime(0, start);
      envelope.gain.linearRampToValueAtTime(0.06, start + 0.008);
      envelope.gain.exponentialRampToValueAtTime(0.0001, end);
      oscillator.connect(filter);
      filter.connect(envelope);
      envelope.connect(output);
      active.add(oscillator);
      oscillator.onended = () => {
        active.delete(oscillator);
        oscillator.disconnect();
        filter.disconnect();
        envelope.disconnect();
      };
      oscillator.start(start);
      oscillator.stop(end);
    }
  } catch (error) {
    reportFailure(error);
  }
}

export const soundFX = {
  playClick() {
    void play([{ frequency: 400, endFrequency: 200, duration: 0.05 }]);
  },
  playSuccess() {
    void play([
      { frequency: 523.25, duration: 0.22 },
      { frequency: 659.25, delay: 0.1, duration: 0.22 },
      { frequency: 783.99, delay: 0.2, duration: 0.22 },
    ]);
  },
  playError() {
    void play([{ frequency: 150, endFrequency: 80, duration: 0.16, type: "sawtooth" }]);
  },
  isMuted: () => muted,
  setMuted(value: boolean) {
    generation++;
    muted = value;
    if (output && context) output.gain.setValueAtTime(muted ? 0 : 1, context.currentTime);
    if (muted) {
      for (const oscillator of active) oscillator.stop();
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    }
    listeners.forEach((listener) => listener());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};
