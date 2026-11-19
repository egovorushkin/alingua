"use client";

import { useSyncExternalStore } from "react";

const query = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(query).matches;
}

export default function useReducedMotion() {
  // Keep SSR and the first hydration render static, then read the browser preference.
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}
