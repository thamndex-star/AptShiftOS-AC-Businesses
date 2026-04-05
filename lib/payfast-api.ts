import { createHmac } from "crypto";
import { NextResponse } from "next/server";
import { canManage, getActiveMembership } from "@/lib/auth";
import {
  buildPayFastFormPayload,
  getPayFastDiagnostics,
  resolvePayFastConfigFromEnv,
  verifyPayFastItnSignature,
} from "@/lib/payfast";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const FALLBACK_WINDOW_MS = 60 * 60 * 1000;
const BILLING_CYCLE_MS = 30 * 24 * 60 * 60 * 1000;

type JsonRecord = Record<string, unknown>;

type FallbackTokenPayload = {
  workspaceId: string;
  email: string;
  paymentId: string;
  issuedAt: number;
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function toStringRecord(value: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, raw] of value.entries()) {
    out[key] = String(raw);
  }
  return out;
}

function looksLikeUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function parseAction(url: URL, body: JsonRecord | null): string {
  const queryAction = url.searchParams.get("action");
  if (queryAction) return queryAction;
  if (body && typeof body.action === "string") return body.action;
  return "";
}

function normalizeEmail(value: string | undefined | null): string {
  return (value ?? "").trim().toLowerCase();
}

function fallbackSecret(): string {
  const configured = process.env.PAYFAST_FALLBACK_SECRET?.trim();
  if (configured) return configured;
  const config = resolvePayFastConfigFromEnv();
  return `${config.merchantKey}:${config.passphrase || "no-passphrase"}`;
}

function b64urlEncode(raw: string): string {
  return Buffer.from(raw, "utf8").toString("base64url");
}

function b64urlDecode(raw: string): string {
  return Buffer.from(raw, "base64url").toString("utf8");
}

function signFallbackPayload(payloadEncoded: string): string {
  return createHmac("sha256", fallbackSecret()).update(payloadEncoded).digest("base64url");
}

function createFallbackToken(payload: FallbackTokenPayload): string {
  const encoded = b64urlEncode(JSON.stringify(payload));
  const signature = signFallbackPayload(encoded);
  return `${encoded}.${signature}`;
}

function parseFallbackToken(token: string): FallbackTokenPayload | null {
  const [encoded, providedSig] = token.split(".");
  if (!encoded || !providedSig) return null;
  const expectedSig = signFallbackPayload(encoded);
  if (expectedSig !== providedSig) return null;

  try {
    const payload = JSON.parse(b64urlDecode(encoded)) as Partial<FallbackTokenPayload>;
    if (
      !payload ||
      typeof payload.workspaceId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.paymentId !== "string" ||
      typeof payload.issuedAt !== "number"
    ) {
      return null;
    }
    return {
      workspaceId: payload.workspaceId,
      email: payload.email,
      paymentId: payload.paymentId,
      issuedAt: payload.issuedAt,
    };
  } catch {
    return null;
  }
}

async function activateWorkspaceSubscription(workspaceId: string): Promise<{ success: boolean; alreadyUnlocked: boolean }> {
  const admin = createAdminClient();
  const { data: workspace, error: workspaceError } = await admin
    .from("workspaces")
    .select("id, subscription_status, subscription_expires_at")
    .eq("id", workspaceId)
    .maybeSingle();

  if (workspaceError || !workspace) {
    return { success: false, alreadyUnlocked: false };
  }

  const expiresAt = workspace.subscription_expires_at ? new Date(workspace.subscription_expires_at) : null;
  const currentlyUnlocked =
    workspace.subscription_status === "active" && (!expiresAt || expiresAt.getTime() > Date.now());
  if (currentlyUnlocked) {
    return { success: true, alreadyUnlocked: true };
  }

  const nextRenewal = new Date(Date.now() + BILLING_CYCLE_MS).toISOString();
  const { error } = await admin
    .from("workspaces")
    .update({
      subscription_status: "active",
      subscription_plan: "basic",
      subscription_expires_at: nextRenewal,
    })
    .eq("id", workspaceId);

  return { success: !error, alreadyUnlocked: false };
}

async function ensureWorkspaceMembership(userId: string, workspaceId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

async function handleInitiate(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return json({ success: false, error: "Unauthorized" }, 401);

  const member = await getActiveMembership();
  if (!member || !canManage(member.role)) {
    return json({ success: false, error: "Forbidden" }, 403);
  }

  const now = Date.now();
  const userEmail = user.email ?? "";
  const profileName = String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? "").trim();
  const firstName = profileName.split(" ").filter(Boolean)[0];
  const lastName = profileName.split(" ").slice(1).join(" ");
  const paymentId = `SUB-${now}-${member.workspace_id.slice(0, 8)}`;
  const fallbackToken = createFallbackToken({
    workspaceId: member.workspace_id,
    email: userEmail,
    paymentId,
    issuedAt: now,
  });

  const origin = new URL(request.url).origin;
  const payload = buildPayFastFormPayload({
    amount: 49,
    itemName: "AptShift OS Subscription",
    workspaceId: member.workspace_id,
    returnUrl: `${origin}/billing/payfast-complete`,
    cancelUrl: `${origin}/billing/payfast-cancel`,
    notifyUrl: `${origin}/api/payfast?action=notify`,
    userEmail,
    firstName,
    lastName,
    paymentId,
    customStr2: fallbackToken,
  });

  return json({
    success: true,
    paymentUrl: payload.paymentUrl,
    formData: payload.formData,
    pendingPayment: {
      workspaceId: member.workspace_id,
      userEmail,
      paymentId: payload.paymentId,
      token: fallbackToken,
      initiatedAt: now,
    },
  });
}

async function handleVerify(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return json({ success: false, error: "Unauthorized" }, 401);

  const url = new URL(request.url);
  const workspaceId = String(url.searchParams.get("workspaceId") ?? "");
  if (!looksLikeUuid(workspaceId)) {
    return json({ success: false, error: "Invalid workspace id" }, 400);
  }

  const canAccess = await ensureWorkspaceMembership(user.id, workspaceId);
  if (!canAccess) return json({ success: false, error: "Forbidden" }, 403);

  const admin = createAdminClient();
  const { data: workspace } = await admin
    .from("workspaces")
    .select("subscription_status, subscription_expires_at")
    .eq("id", workspaceId)
    .maybeSingle();
  if (!workspace) return json({ success: false, error: "Workspace not found" }, 404);

  const expiresAt = workspace.subscription_expires_at ? new Date(workspace.subscription_expires_at) : null;
  const unlocked = workspace.subscription_status === "active" && (!expiresAt || expiresAt.getTime() > Date.now());

  return json({ success: true, unlocked });
}

async function handleFallbackUnlock(body: JsonRecord) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return json({ success: false, error: "Unauthorized" }, 401);

  const workspaceId = String(body.workspaceId ?? "");
  const email = String(body.email ?? "");
  const token = String(body.token ?? "");

  if (!looksLikeUuid(workspaceId) || !token) {
    return json({ success: false, error: "Invalid payload" }, 400);
  }
  if (normalizeEmail(email) !== normalizeEmail(user.email)) {
    return json({ success: false, error: "Email mismatch" }, 403);
  }

  const parsedToken = parseFallbackToken(token);
  if (!parsedToken) {
    return json({ success: false, error: "Invalid token" }, 403);
  }
  if (parsedToken.workspaceId !== workspaceId || normalizeEmail(parsedToken.email) !== normalizeEmail(email)) {
    return json({ success: false, error: "Token mismatch" }, 403);
  }
  if (Date.now() - parsedToken.issuedAt > FALLBACK_WINDOW_MS) {
    return json({ success: false, error: "Fallback window expired" }, 403);
  }

  const canAccess = await ensureWorkspaceMembership(user.id, workspaceId);
  if (!canAccess) {
    return json({ success: false, error: "Forbidden" }, 403);
  }

  const updated = await activateWorkspaceSubscription(workspaceId);
  if (!updated.success) {
    return json({ success: false, error: "Unable to unlock subscription" }, 500);
  }

  return json({
    success: true,
    unlocked: true,
    alreadyUnlocked: updated.alreadyUnlocked,
    provider: "payfast-fallback",
  });
}

export async function handleNotify(request: Request) {
  try {
    const formData = await request.formData();
    const data = toStringRecord(formData);
    const config = resolvePayFastConfigFromEnv();

    if (String(data.merchant_id ?? "") !== config.merchantId) {
      return new NextResponse("IGNORED", { status: 200 });
    }
    if (!verifyPayFastItnSignature(data, config)) {
      return new NextResponse("IGNORED", { status: 200 });
    }

    const paymentStatus = String(data.payment_status ?? "");
    if (paymentStatus !== "COMPLETE") {
      return new NextResponse("IGNORED", { status: 200 });
    }

    const workspaceId = String(data.custom_str1 ?? "");
    if (!looksLikeUuid(workspaceId)) {
      return new NextResponse("IGNORED", { status: 200 });
    }

    await activateWorkspaceSubscription(workspaceId);
    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("[PayFast notify] error", error);
    return new NextResponse("IGNORED", { status: 200 });
  }
}

export async function handlePayFastGet(request: Request) {
  const url = new URL(request.url);
  const action = parseAction(url, null);

  if (action === "verify") return handleVerify(request);
  if (action === "config" || action === "") return json({ success: true, config: getPayFastDiagnostics() });
  return json({ success: false, error: "Unsupported action" }, 400);
}

export async function handlePayFastPost(request: Request) {
  const url = new URL(request.url);
  const queryAction = url.searchParams.get("action");

  if (queryAction === "notify") {
    return handleNotify(request);
  }

  let body: JsonRecord | null = null;
  try {
    body = (await request.json()) as JsonRecord;
  } catch {
    body = null;
  }

  const action = parseAction(url, body);
  if (action === "initiate") return handleInitiate(request);
  if (action === "fallback-unlock") return handleFallbackUnlock(body ?? {});
  if (action === "notify") return handleNotify(request);

  return json({ success: false, error: "Unsupported action" }, 400);
}
