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
 * PayFast requires "+" for spaces in redirect query
 */
function payFastUrlEncode(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, "+");
}

/** Sort ONLY for signature */
function getSortedEntriesForSignature(rawData: Record<string, string>): Array<[string, string]> {
  return Object.entries(rawData)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b));
}

/** Keep original order for redirect query */
function getOrderedEntriesForQuery(rawData: Record<string, string>): Array<[string, string]> {
  return Object.entries(rawData).filter(([, value]) => value !== undefined && value !== null && value !== "");
}

/**
 * 🚨 CRITICAL FIX:
 * Signature must use URL-ENCODED values (RFC3986)
 * BUT spaces must remain %20 (NOT +)
 */
function generatePayfastSignature(sortedEntries: Array<[string, string]>): { baseString: string; signature: string } {
  const baseString = sortedEntries
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`) // encode here
    .join("&");

  console.log("[PayFast] BASE STRING:", baseString);

  const signature = createHash("md5")
    .update(baseString)
    .digest("hex");

  console.log("[PayFast] SIGNATURE:", signature);

  return { baseString, signature };
}

/** Build redirect query (original order + + encoding) */
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

  console.log("[PayFast] RAW DATA:", rawData);
  console.log("[PayFast] FINAL QUERY:", query);

  return `${baseUrl}?${query}`;
}