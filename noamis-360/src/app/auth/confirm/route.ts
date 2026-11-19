import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/utils";

const ALLOWED: EmailOtpType[] = ["invite", "recovery", "email", "magiclink", "signup", "email_change"];

/** Vérification des liens e-mail (token_hash) : invitation, récupération. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const fallback = type === "invite" || type === "recovery" ? "/reset-password" : "/home";
  const next = safeInternalPath(searchParams.get("next"), fallback);
  if (tokenHash && type && ALLOWED.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/login?error=link_invalid`);
}
