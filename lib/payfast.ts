import { createHash } from "crypto";

const PAYFAST_LIVE_URL = "https://www.payfast.co.za/eng/process";
const PAYFAST_SANDBOX_URL = "https://sandbox.payfast.co.za/eng/process";

const PAYFAST_OUTGOING_FIELDS = [
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
  "payment_method",
  "subscription_type",
  "billing_date",
  "recurring_amount",
  "frequency",
  "cycles",
  "email_confirmation",
  "confirmation_address",
] as const;

const PAYFAST_ITN_FIELDS = [
  "m_payment_id",
  "pf_payment_id",
  "payment_status",
  "item_name",
  "item_description",
  "amount_gross",
  "amount_fee",
  "amount_net",
  "custom_str1",
  "custom_str2",
  "custom_str3",
  "custom_str4",
  "custom_str5",
  "custom_int1",
  "custom_int2",
  "custom_int3",
  "custom_int4",
  "custom_int5",
  "name_first",
  "name_last",
  "email_address",
  "merchant_id",
] as const;

type PayFastConfig = {
  merchantId: string;
  merchantKey: string;
  passphrase: string;
  usePassphrase: boolean;
  sandbox: boolean;
};

type PayFastFieldValue = string | number | null | undefined;
type PayFastFieldMap = Record<string, PayFastFieldValue>;

type BuildPayloadParams = {
  amount: number;
  itemName: string;
  workspaceId: string;
  returnUrl: string;
  notifyUrl: string;
  cancelUrl?: string;
  userEmail?: string;
  firstName?: string;
  lastName?: string;
  paymentId?: string;
  customStr2?: string;
};

export function pfEncode(value: string): string {
  return encodeURIComponent(value.trim()).replace(/%20/g, "+").replace(/~/g, "%7E");
}

function isTruthyEnv(value: string | undefined): boolean {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return normalized !== "false" && normalized !== "0" && normalized !== "no";
}

function cleanValue(value: PayFastFieldValue): string | null {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).trim();
  return cleaned === "" ? null : cleaned;
}

function orderedPairs(data: PayFastFieldMap, fieldOrder: readonly string[]): string[] {
  const pairs: string[] = [];
  for (const field of fieldOrder) {
    const cleaned = cleanValue(data[field]);
    if (!cleaned) continue;
    pairs.push(`${field}=${pfEncode(cleaned)}`);
  }
  return pairs;
}

export function resolvePayFastConfigFromEnv(): PayFastConfig {
  const merchantId = process.env.PAYFAST_MERCHANT_ID?.trim() ?? "";
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY?.trim() ?? "";
  if (!merchantId || !merchantKey) {
    throw new Error("PayFast merchant env vars are missing");
  }

  return {
    merchantId,
    merchantKey,
    passphrase: process.env.PAYFAST_PASSPHRASE?.trim() ?? "",
    usePassphrase: isTruthyEnv(process.env.PAYFAST_USE_PASSPHRASE),
    sandbox: process.env.PAYFAST_SANDBOX === "true",
  };
}

function buildSignatureString(data: PayFastFieldMap, fieldOrder: readonly string[], config: Pick<PayFastConfig, "passphrase" | "usePassphrase">): string {
  const pairs = orderedPairs(data, fieldOrder);
  if (config.usePassphrase && config.passphrase) {
    pairs.push(`passphrase=${pfEncode(config.passphrase)}`);
  }
  return pairs.join("&");
}

export function generatePayFastSignature(
  data: PayFastFieldMap,
  fieldOrder: readonly string[],
  config: Pick<PayFastConfig, "passphrase" | "usePassphrase">,
): string {
  const baseString = buildSignatureString(data, fieldOrder, config);
  return createHash("md5").update(baseString).digest("hex");
}

export function verifyPayFastItnSignature(data: PayFastFieldMap, config: Pick<PayFastConfig, "passphrase" | "usePassphrase">): boolean {
  const provided = cleanValue(data.signature)?.toLowerCase() ?? "";
  if (!provided) return false;
  const expected = generatePayFastSignature(data, PAYFAST_ITN_FIELDS, config);
  return expected === provided;
}

export function getPayFastProcessUrl(sandbox: boolean): string {
  return sandbox ? PAYFAST_SANDBOX_URL : PAYFAST_LIVE_URL;
}

export function buildPayFastFormPayload(params: BuildPayloadParams) {
  const config = resolvePayFastConfigFromEnv();
  const paymentId = cleanValue(params.paymentId) ?? `WS-${Date.now()}-${params.workspaceId.slice(0, 8)}`;
  const amount = Number.isFinite(params.amount) ? params.amount.toFixed(2) : "0.00";

  const formData: Record<string, string> = {
    merchant_id: config.merchantId,
    merchant_key: config.merchantKey,
    return_url: params.returnUrl,
    cancel_url: params.cancelUrl ?? params.returnUrl,
    notify_url: params.notifyUrl,
    m_payment_id: paymentId,
    amount,
    item_name: params.itemName,
    custom_str1: params.workspaceId,
  };

  const maybeEmail = cleanValue(params.userEmail);
  if (maybeEmail) formData.email_address = maybeEmail;
  const maybeFirst = cleanValue(params.firstName);
  if (maybeFirst) formData.name_first = maybeFirst;
  const maybeLast = cleanValue(params.lastName);
  if (maybeLast) formData.name_last = maybeLast;
  const maybeToken = cleanValue(params.customStr2);
  if (maybeToken) formData.custom_str2 = maybeToken;

  formData.signature = generatePayFastSignature(formData, PAYFAST_OUTGOING_FIELDS, config);

  return {
    paymentUrl: getPayFastProcessUrl(config.sandbox),
    paymentId,
    formData,
    sandbox: config.sandbox,
  };
}

function buildQuery(data: Record<string, string>): string {
  const entries = orderedPairs(data, [...PAYFAST_OUTGOING_FIELDS, "signature"]);
  return entries.join("&");
}

/** Compatibility helper for legacy redirect-style flows. */
export function buildPayFastPaymentUrl(params: BuildPayloadParams): string {
  const payload = buildPayFastFormPayload(params);
  return `${payload.paymentUrl}?${buildQuery(payload.formData)}`;
}

export function getPayFastDiagnostics() {
  const config = resolvePayFastConfigFromEnv();
  return {
    merchantIdConfigured: !!config.merchantId,
    merchantIdPreview: `${config.merchantId.slice(0, 3)}...${config.merchantId.slice(-2)}`,
    usePassphrase: config.usePassphrase,
    hasPassphrase: !!config.passphrase,
    sandbox: config.sandbox,
    paymentUrl: getPayFastProcessUrl(config.sandbox),
  };
}

export { PAYFAST_ITN_FIELDS, PAYFAST_OUTGOING_FIELDS };