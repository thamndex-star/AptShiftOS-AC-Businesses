import { createHash } from "crypto";

const PAYFAST_LIVE_URL = "https://www.payfast.co.za/eng/process";
const PAYFAST_SANDBOX_URL = "https://sandbox.payfast.co.za/eng/process";

/**
 * Single encoding pass for PayFast: encodeURIComponent(trim(value)), then spaces as "+"
 * (aligns with PHP urlencode used in PayFast examples; avoids double-encoding).
 */
function payFastEncodeValue(value: string): string {
  return encodeURIComponent(value.trim()).replace(/%20/g, "+");
}

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

/** Alphabetically sorted keys; passphrase appended last as &passphrase=... when set. */
function buildSignatureParameterString(fields: Record<string, string>, passphrase?: string): string {
  const keys = Object.keys(fields).sort((a, b) => a.localeCompare(b, "en"));
  const pairs = keys.map((key) => `${key}=${payFastEncodeValue(fields[key])}`);
  let paramString = pairs.join("&");
  const p = passphrase?.trim();
  if (p) {
    paramString += `&passphrase=${payFastEncodeValue(p)}`;
  }
  return paramString;
}

function buildPayFastSignature(fields: Record<string, string>, passphrase?: string): string {
  return createHash("md5").update(buildSignatureParameterString(fields, passphrase)).digest("hex");
}

/** Same key order and encoding as the string used for signing (plus signature). */
function buildPayFastQueryString(fields: Record<string, string>, signature: string): string {
  const keys = Object.keys(fields).sort((a, b) => a.localeCompare(b, "en"));
  const pairs = keys.map((key) => `${key}=${payFastEncodeValue(fields[key])}`);
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
  return `${baseUrl}?${query}`;
}
