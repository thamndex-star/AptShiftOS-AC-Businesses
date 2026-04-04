import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Supabase PKCE auth callback – handles email confirmation, magic links, and OAuth.
 * Supabase redirects here after the user clicks the email confirmation link.
 * Set your Supabase project's "Site URL" to your app root and
 * "Redirect URLs" to include <origin>/auth/callback.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (errorParam) {
    const msg = encodeURIComponent(errorDescription ?? errorParam);
    return NextResponse.redirect(`${origin}/login?error=${msg}`);
  }

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const msg = encodeURIComponent(error.message);
      return NextResponse.redirect(`${origin}/login?error=${msg}`);
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email",
    });
    if (error) {
      const msg = encodeURIComponent(error.message);
      return NextResponse.redirect(`${origin}/login?error=${msg}`);
    }
  }

  // User may already be authenticated via existing cookies/session.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(`${origin}/login`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("active_workspace_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.active_workspace_id) {
    return NextResponse.redirect(`${origin}/onboarding?confirmed=1`);
  }

  return NextResponse.redirect(`${origin}/dashboard?confirmed=1`);
}
