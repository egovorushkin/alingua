"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { soundFX } from "@/utils/sound";

export function SoundToggle() {
  const muted = useSyncExternalStore(soundFX.subscribe, soundFX.isMuted, () => false);
  return (
    <button
      type="button"
      data-sound="off"
      aria-label="Выключить звук"
      aria-pressed={muted}
      title={muted ? "Включить звук" : "Выключить звук"}
      onClick={() => soundFX.setMuted(!muted)}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eeeaff] text-[#604ac5] transition-transform active:scale-95"
    >
      {muted ? <VolumeX size={21} aria-hidden="true" /> : <Volume2 size={21} aria-hidden="true" />}
    </button>
  );
}

export default function SoundControls() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const control = event.target.closest("button, a, input[type='radio']");
      if (!control || control.closest("[data-sound='off']") || control.matches(":disabled, [aria-disabled='true']")) return;
      soundFX.playClick();
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
