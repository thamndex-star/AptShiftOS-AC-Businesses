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
  const next = searchParams.get("next") ?? "/onboarding";
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (errorParam) {
    const msg = encodeURIComponent(errorDescription ?? errorParam);
    return NextResponse.redirect(`${origin}/login?error=${msg}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    const msg = encodeURIComponent(error.message);
    return NextResponse.redirect(`${origin}/login?error=${msg}`);
  }

  return NextResponse.redirect(`${origin}/login`);
}
