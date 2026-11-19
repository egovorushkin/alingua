import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  let authenticated = false;
  let sessionError = false;
  try {
    const config = getSupabaseConfig();
    if (config) {
      const supabase = createServerClient(config.url, config.key, {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll(values, headers) {
            values.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
            Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
          },
        },
      });
      const { data, error } = await supabase.auth.getClaims();
      authenticated = Boolean(data?.claims);
      sessionError = Boolean(error && error.name !== "AuthSessionMissingError");
    }
  } catch {
    console.warn("Alingua account authentication could not be verified.");
    sessionError = true;
  }
  if (!authenticated) {
    const url = new URL("/login", request.url);
    if (sessionError) url.searchParams.set("error", "session");
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    response = redirect;
  }
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export const config = { matcher: ["/account/:path*"] };
