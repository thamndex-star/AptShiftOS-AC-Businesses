import { createHash } from "crypto";

const PAYFAST_LIVE_URL = "https://www.payfast.co.za/eng/process";
const PAYFAST_SANDBOX_URL = "https://sandbox.payfast.co.za/eng/process";

/**
 * PayFast custom form integration: signature uses the same parameter order as in their
 * documentation / PHP examples (foreach insertion order), not alphabetical.
 * @see https://developers.payfast.co.za/docs#step_2_signature
 */
const PAYFAST_FORM_FIELD_ORDER = [
  "merchant_id",
  "merchant_key",
  "return_url",
  "cancel_url",
  "notify_url",
  "name_first",
  "name_last",
  "email_address",
  "cell_number",
  "m_payment_id",
  "amount",
  "item_name",
  "item_description",
  "custom_int1",
  "custom_int2",
  "custom_int3",
  "custom_int4",
  "custom_int5",
  "custom_str1",
  "custom_str2",
  "custom_str3",
  "custom_str4",
  "custom_str5",
  "email_confirmation",
  "confirmation_address",
  "payment_method",
  "subscription_type",
  "billing_date",
  "recurring_amount",
  "frequency",
  "cycles",
] as const;

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

function buildOrderedRawPairs(fields: Record<string, string>): string[] {
  const pairs: string[] = [];
  for (const key of PAYFAST_FORM_FIELD_ORDER) {
    const val = fields[key];
    if (val !== undefined && val !== "") {
      pairs.push(`${key}=${val}`);
    }
  }
  return pairs;
}

function buildOrderedEncodedPairs(fields: Record<string, string>): string[] {
  const pairs: string[] = [];
  for (const key of PAYFAST_FORM_FIELD_ORDER) {
    const val = fields[key];
    if (val !== undefined && val !== "") {
      pairs.push(`${key}=${payFastUrlEncode(val)}`);
    }
  }
  return pairs;
}

/** Document field order; passphrase appended last as &passphrase=... when set. */
function buildSignatureParameterString(fields: Record<string, string>, passphrase?: string): string {
  let paramString = buildOrderedRawPairs(fields).join("&");
  const p = passphrase?.trim();
  if (p) {
    paramString += `&passphrase=${p}`;
  }
  return paramString;
}

function buildPayFastSignature(fields: Record<string, string>, passphrase?: string): string {
  const string = buildSignatureParameterString(fields, passphrase);
  console.log("[PayFast] signature base string:", string);
  return createHash("md5").update(string).digest("hex");
}

/** Same key order and encoding as the string used for signing, then signature. */
function buildPayFastQueryString(fields: Record<string, string>, signature: string): string {
  const pairs = buildOrderedEncodedPairs(fields);
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
  const passphrase = process.env.PAYFAST_PASSPHRASE;
  const sandbox = process.env.PAYFAST_SANDBOX === "true";

  if (!merchantId || !merchantKey) {
    throw new Error("PayFast merchant env vars are missing");
  }

  const fields = collectNonEmptyFields({
    merchant_id: merchantId,
    merchant_key: merchantKey,
    amount: params.amount.toFixed(2),
    item_name: params.itemName,
    return_url: params.returnUrl,
    cancel_url: params.cancelUrl ?? params.returnUrl,
    notify_url: params.notifyUrl,
    m_payment_id: params.workspaceId,
    custom_str1: params.workspaceId,
  });

  const signature = buildPayFastSignature(fields, passphrase);
  const query = buildPayFastQueryString(fields, signature);
  const baseUrl = sandbox ? PAYFAST_SANDBOX_URL : PAYFAST_LIVE_URL;

  if (process.env.PAYFAST_DEBUG_SIGNATURE === "true") {
    console.log("[PayFast] signature hash:", signature);
    console.log("[PayFast] redirect query:", query);
  }

  return `${baseUrl}?${query}`;
}
