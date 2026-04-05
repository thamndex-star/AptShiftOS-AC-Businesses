import { createHash } from "crypto";

const PAYFAST_LIVE_URL = "https://www.payfast.co.za/eng/process";
const PAYFAST_SANDBOX_URL = "https://sandbox.payfast.co.za/eng/process";

/** Keep only non-empty string values (after trim). */
function collectNonEmptyFields(entries: Record<string, string | number>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(entries)) {
    const str = typeof raw === "number" ? raw.toString() : String(raw).trim();
    if (str !== "") {
      out[key] = str;
    }
  }
  return out;
}

/** Encode ONLY for query string */
function encode(value: string): string {
  return encodeURIComponent(value);
}

/** Sort alphabetically for signature */
function getSortedEntries(rawData: Record<string, string>): Array<[string, string]> {
  return Object.entries(rawData)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b));
}

/** Keep original order for query */
function getOrderedEntries(rawData: Record<string, string>): Array<[string, string]> {
  return Object.entries(rawData).filter(([, value]) => value !== undefined && value !== null && value !== "");
}

/**
 * ✅ CORRECT SIGNATURE LOGIC
 * - NO encoding for values
 * - INCLUDE passphrase (sandbox requires it)
 */
function generateSignature(entries: Array<[string, string]>, passphrase?: string): string {
  let baseString = entries
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  if (passphrase && passphrase !== "") {
    baseString += `&passphrase=${passphrase}`;
  }

  console.log("[PayFast] BASE STRING:", baseString);

  const signature = createHash("md5").update(baseString).digest("hex");

  console.log("[PayFast] SIGNATURE:", signature);

  return signature;
}

/** Build query string (ENCODED) */
function buildQuery(entries: Array<[string, string]>, signature: string): string {
  const pairs = entries.map(([key, value]) => `${key}=${encode(value)}`);
  pairs.push(`signature=${signature}`);
  return pairs.join("&");
}

export function buildPayFastPaymentUrl(params: {
  amount: number;
  itemName: string;
  workspaceId: string;
  returnUrl: string;
  notifyUrl: string;
  cancelUrl?: string;
}) {
  const merchantId = process.env.PAYFAST_MERCHANT_ID;
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY;

  // 🔥 CRITICAL: default sandbox passphrase fallback
  const passphrase =
    process.env.PAYFAST_PASSPHRASE?.trim() || "jt7NOE43FZPn";

  const sandbox = process.env.PAYFAST_SANDBOX === "true";

  if (!merchantId || !merchantKey) {
    throw new Error("PayFast merchant env vars are missing");
  }

  const rawData = collectNonEmptyFields({
    merchant_id: merchantId,
    merchant_key: merchantKey,
    return_url: params.returnUrl,
    cancel_url: params.cancelUrl ?? params.returnUrl,
    notify_url: params.notifyUrl,
    m_payment_id: params.workspaceId,
    amount: params.amount.toFixed(2),
    item_name: params.itemName,
    custom_str1: params.workspaceId,
  });

  const sorted = getSortedEntries(rawData);
  const signature = generateSignature(sorted, passphrase);
  const ordered = getOrderedEntries(rawData);
  const query = buildQuery(ordered, signature);

  console.log("[PayFast] FINAL QUERY:", query);

  const baseUrl = sandbox ? PAYFAST_SANDBOX_URL : PAYFAST_LIVE_URL;

  return `${baseUrl}?${query}`;
}