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
  "m_payment_id",
  "amount",
  "item_name",
  "custom_str1",
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

function buildOrderedSearchParams(fields: Record<string, string>): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of PAYFAST_FORM_FIELD_ORDER) {
    const val = fields[key];
    if (val !== undefined && val !== "") {
      params.append(key, val);
    }
  }
  return params;
}

/** Document field order; passphrase appended last as &passphrase=... when set. */
function buildSignatureParameterString(fields: Record<string, string>, passphrase?: string): string {
  const params = buildOrderedSearchParams(fields);
  let paramString = params.toString();
  const p = passphrase?.trim();
  if (p) {
    const encodedPassphrase = new URLSearchParams({ passphrase: p }).toString().slice("passphrase=".length);
    paramString += `&passphrase=${encodedPassphrase}`;
  }
  return paramString;
}

function buildPayFastSignature(fields: Record<string, string>, passphrase?: string): string {
  return createHash("md5").update(buildSignatureParameterString(fields, passphrase)).digest("hex");
}

/** Same key order and encoding as the string used for signing, then signature. */
function buildPayFastQueryString(fields: Record<string, string>, signature: string): string {
  const params = buildOrderedSearchParams(fields);
  params.append("signature", signature);
  return params.toString();
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
