import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        const response = NextResponse.redirect(new URL("/", request.url));
        response.headers.set("Cache-Control", "private, no-store");
        return response;
      }
    } catch {
      console.warn("Alingua authentication callback could not be completed.");
    }
  }
  const response = NextResponse.redirect(new URL("/login?error=callback", request.url));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
