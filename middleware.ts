import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = ["/", "/login", "/signup"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Allow local UI boot without crashing when env vars are not set yet.
  // Auth-gated behavior is skipped until Supabase is configured.
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const pathname = request.nextUrl.pathname;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth/callback") ||
    pathname.includes(".")
  )
    return response;

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user && !PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!user) return response;

  const { data: profile } = await supabase
    .from("profiles")
    .select("active_workspace_id")
    .eq("id", user.id)
    .maybeSingle();

  const hasWorkspace = !!profile?.active_workspace_id;
  if (!hasWorkspace && pathname.startsWith("/dashboard")) return NextResponse.redirect(new URL("/onboarding", request.url));
  if (!hasWorkspace && pathname.startsWith("/leads")) return NextResponse.redirect(new URL("/onboarding", request.url));
  if (!hasWorkspace && pathname.startsWith("/jobs")) return NextResponse.redirect(new URL("/onboarding", request.url));
  if (!hasWorkspace && pathname.startsWith("/invoices")) return NextResponse.redirect(new URL("/onboarding", request.url));
  if (!hasWorkspace && pathname.startsWith("/billing")) return NextResponse.redirect(new URL("/onboarding", request.url));

  if (hasWorkspace) {
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("subscription_status, subscription_expires_at")
      .eq("id", profile.active_workspace_id)
      .maybeSingle();

    const expiresAt = workspace?.subscription_expires_at ? new Date(workspace.subscription_expires_at) : null;
    const trialExpired = !expiresAt || expiresAt.getTime() < Date.now();
    const subscriptionRestricted = workspace?.subscription_status !== "active" && trialExpired;
    const isAppRoute =
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/leads") ||
      pathname.startsWith("/jobs") ||
      pathname.startsWith("/invoices") ||
      pathname.startsWith("/billing");

    if (subscriptionRestricted && isAppRoute && !pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/dashboard?billing=required", request.url));
    }
  }

  if (hasWorkspace && (pathname === "/login" || pathname === "/signup" || pathname === "/onboarding")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
