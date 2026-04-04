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

/**
 * Strict RFC 3986 style encoding for PayFast payload/signature consistency.
 * Keeps spaces as %20 (never "+") and is used for both hash input and query string.
 */
function payFastUrlEncode(value: string): string {
  return encodeURIComponent(value);
}

/** Same keys/values as rawData, alphabetically sorted — signature only. */
function getSortedEntriesForSignature(rawData: Record<string, string>): Array<[string, string]> {
  return Object.entries(rawData)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b));
}

/** Preserve rawData insertion order — redirect query only (do not sort). */
function getOrderedEntriesForQuery(rawData: Record<string, string>): Array<[string, string]> {
  return Object.entries(rawData).filter(([, value]) => value !== undefined && value !== null && value !== "");
}

function generatePayfastSignature(sortedEntries: Array<[string, string]>): { baseString: string; signature: string } {
  const baseString = sortedEntries.map(([key, value]) => `${key}=${value}`).join("&");
  const signature = createHash("md5").update(baseString).digest("hex");
  return { baseString, signature };
}

/** Encode values in original field order; append signature last. */
function buildPayFastQueryString(orderedEntries: Array<[string, string]>, signature: string): string {
  const pairs = orderedEntries.map(([key, value]) => `${key}=${payFastUrlEncode(value)}`);
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
  const sandbox = process.env.PAYFAST_SANDBOX === "true";

  if (!merchantId || !merchantKey) {
    throw new Error("PayFast merchant env vars are missing");
  }

  // Field order matches PayFast checkout form; query string uses this order (not alphabetical).
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

  const sortedEntries = getSortedEntriesForSignature(rawData);
  const { baseString, signature } = generatePayfastSignature(sortedEntries);
  const queryEntries = getOrderedEntriesForQuery(rawData);
  const query = buildPayFastQueryString(queryEntries, signature);
  const baseUrl = sandbox ? PAYFAST_SANDBOX_URL : PAYFAST_LIVE_URL;

  console.log("RAW DATA:", rawData);
  console.log("BASE STRING:", baseString);
  console.log("FINAL QUERY:", query);

  return `${baseUrl}?${query}`;
}
