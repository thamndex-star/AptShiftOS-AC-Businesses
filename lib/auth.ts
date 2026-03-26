import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Membership = Database["public"]["Tables"]["workspace_members"]["Row"];
export type ActiveWorkspace = Pick<Database["public"]["Tables"]["workspaces"]["Row"], "id" | "name" | "currency">;

/** Loads the active workspace row. Pass `membership` from `requireWorkspace()` to avoid an extra membership query. */
export async function getActiveWorkspace(membership?: Membership | null): Promise<ActiveWorkspace | null> {
  const m = membership ?? (await getActiveMembership());
  if (!m) return null;

  const supabase = await createClient();
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, currency")
    .eq("id", m.workspace_id)
    .maybeSingle();

  return workspace ?? null;
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getActiveMembership(): Promise<Membership | null> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("active_workspace_id")
    .eq("id", authData.user.id)
    .maybeSingle();
  if (!profile?.active_workspace_id) return null;

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", profile.active_workspace_id)
    .eq("user_id", authData.user.id)
    .maybeSingle();

  return membership;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireWorkspace(): Promise<Membership> {
  const membership = await getActiveMembership();
  if (!membership) redirect("/onboarding");
  return membership;
}

export function canManage(role: Membership["role"]) {
  return role === "owner" || role === "admin";
}
