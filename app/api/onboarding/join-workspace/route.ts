import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok } from "@/lib/helpers";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return fail("Unauthorized", 401);

  const profileId = auth.user.id;

  const { inviteCode } = (await request.json()) as { inviteCode?: string };
  const raw = inviteCode?.trim();
  if (!raw) return fail("Invite code is required");

  const normalized = raw.toUpperCase();

  // Invite lookup cannot be expressed safely in RLS without exposing other workspaces; use service role for id resolution only.
  const admin = createAdminClient();
  const { data: workspace, error: lookupError } = await admin
    .from("workspaces")
    .select("id")
    .eq("invite_code", normalized)
    .maybeSingle();

  if (lookupError) return fail(lookupError.message);
  if (!workspace) return fail("Invalid invite code", 404);

  const { data: existing } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspace.id)
    .eq("user_id", profileId)
    .maybeSingle();

  if (existing) return fail("You are already a member of this workspace.", 409);

  const { error: memberError } = await supabase.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: profileId,
    role: "technician",
  });

  if (memberError) {
    if (memberError.code === "23505") return fail("You are already a member of this workspace.", 409);
    return fail(memberError.message);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ active_workspace_id: workspace.id })
    .eq("id", profileId);

  if (profileError) {
    await supabase.from("workspace_members").delete().eq("workspace_id", workspace.id).eq("user_id", profileId);
    return fail(profileError.message);
  }

  return ok({ workspace_id: workspace.id });
}
