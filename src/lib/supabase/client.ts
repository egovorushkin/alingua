"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";
import type { Database } from "./database.types";

export function createClient() {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Облачный аккаунт ещё не настроен. Можно играть в гостевом режиме.");
  return createBrowserClient<Database>(config.url, config.key);
}
