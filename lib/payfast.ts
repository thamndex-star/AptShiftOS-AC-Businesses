import { createHash } from "crypto";

const PAYFAST_LIVE_URL = "https://www.payfast.co.za/eng/process";
const PAYFAST_SANDBOX_URL = "https://sandbox.payfast.co.za/eng/process";

type PayFastPayload = Record<string, string | number>;

function encode(value: string) {
  return encodeURIComponent(value.trim()).replace(/%20/g, "+");
}

function buildSignature(payload: PayFastPayload, passphrase?: string) {
  const base = Object.keys(payload)
    .sort()
    .map((key) => `${key}=${encode(String(payload[key]))}`)
    .join("&");

  const source = passphrase ? `${base}&passphrase=${encode(passphrase)}` : base;
  return createHash("md5").update(source).digest("hex");
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

  const payload: PayFastPayload = {
    merchant_id: merchantId,
    merchant_key: merchantKey,
    amount: params.amount.toFixed(2),
    item_name: params.itemName,
    return_url: params.returnUrl,
    cancel_url: params.cancelUrl ?? params.returnUrl,
    notify_url: params.notifyUrl,
    m_payment_id: params.workspaceId,
    custom_str1: params.workspaceId,
  };

  const signature = buildSignature(payload, passphrase);
  const query = new URLSearchParams(
    Object.entries({ ...payload, signature }).map(([k, v]) => [k, String(v)]),
  ).toString();

  const baseUrl = sandbox ? PAYFAST_SANDBOX_URL : PAYFAST_LIVE_URL;
  return `${baseUrl}?${query}`;
}
