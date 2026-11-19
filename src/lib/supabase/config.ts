export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url && !key) return null;
  if (!url || !key) throw new Error("Укажи NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  let parsed: URL;
  try { parsed = new URL(url); }
  catch { throw new Error("Проверь адрес NEXT_PUBLIC_SUPABASE_URL."); }
  if (!["https:", "http:"].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== "/") {
    throw new Error("Проверь адрес NEXT_PUBLIC_SUPABASE_URL.");
  }
  if (parsed.protocol !== "https:" && !["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname)) {
    throw new Error("Для Supabase требуется HTTPS.");
  }
  if (key.startsWith("sb_secret_")) throw new Error("В браузере разрешён только публичный ключ Supabase.");
  if (!key.startsWith("sb_publishable_")) {
    let role: unknown;
    try {
      role = JSON.parse(atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).role;
    } catch {
      throw new Error("Укажи публичный anon или publishable ключ Supabase.");
    }
    if (role !== "anon") throw new Error("В браузере разрешён только anon или publishable ключ Supabase.");
  }
  return { url: parsed.origin, key };
}
