export function speakWord(word: string, onError: () => void): boolean {
  if (
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
    utterance.rate = 0.85;
    utterance.onerror = (event) => {
      if (event.error !== "interrupted" && event.error !== "canceled") onError();
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}
