import { soundFX } from "./sound";

interface SpeechOptions {
  rate?: number;
  onStart?: () => void;
  onEnd?: () => void;
}

export function cancelSpeech() {
  if (typeof window !== "undefined" && typeof window.speechSynthesis?.cancel === "function") {
    window.speechSynthesis.cancel();
  }
}

export function speakWord(word: string, onError: () => void, options: SpeechOptions = {}): boolean {
  if (
    soundFX.isMuted() ||
    typeof window === "undefined" ||
    !("speechSynthesis" in window) ||
    typeof SpeechSynthesisUtterance === "undefined"
  ) {
    return false;
  }

  try {
    const utterance = new SpeechSynthesisUtterance(word);
    const voices = window.speechSynthesis.getVoices();
    utterance.voice =
      voices.find((voice) => /^en-(US|GB)$/i.test(voice.lang)) ?? null;
    utterance.lang = utterance.voice?.lang ?? "en-US";
    utterance.rate = options.rate ?? 0.85;
    utterance.onstart = () => options.onStart?.();
    utterance.onend = () => options.onEnd?.();
    utterance.onerror = (event) => {
      options.onEnd?.();
      if (event.error !== "interrupted" && event.error !== "canceled") onError();
    };
    cancelSpeech();
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}
