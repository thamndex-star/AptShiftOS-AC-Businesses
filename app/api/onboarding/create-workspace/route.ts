import { createClient } from "@/lib/supabase/server";
import { normalizeWorkspaceCurrency } from "@/lib/currency";
import { fail, generateInviteCode, ok } from "@/lib/helpers";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return fail("Unauthorized", 401);

  const profileId = auth.user.id;

  const { name, currency } = (await request.json()) as { name?: string; currency?: string };
  if (!name?.trim()) return fail("Business name is required");

  const invite_code = generateInviteCode();
  const workspaceCurrency = normalizeWorkspaceCurrency(currency);

  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .insert({ name: name.trim(), currency: workspaceCurrency, invite_code, owner_user_id: profileId })
    .select("id")
    .single();

  if (wsError || !workspace) return fail(wsError?.message ?? "Could not create workspace");

  const { error: memberError } = await supabase.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: profileId,
    role: "owner",
  });

  if (memberError) {
    await supabase.from("workspaces").delete().eq("id", workspace.id);
    return fail(memberError.message);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ active_workspace_id: workspace.id })
    .eq("id", profileId);

  if (profileError) {
    await supabase.from("workspace_members").delete().eq("workspace_id", workspace.id).eq("user_id", profileId);
    await supabase.from("workspaces").delete().eq("id", workspace.id);
    return fail(profileError.message);
  }

  return ok({ workspace_id: workspace.id, invite_code });
}
