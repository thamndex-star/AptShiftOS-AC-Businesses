import { normalizeWorkspaceCurrency } from "./currency";

export function generateInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

/** Format a numeric amount using the workspace ISO currency code (no conversion). */
export function formatCurrency(value: number, currency: string = "USD") {
  const code = normalizeWorkspaceCurrency(currency);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function parseNumber(value: FormDataEntryValue | null) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

export function ok(data?: unknown) {
  return Response.json({ success: true, data }, { status: 200 });
}

export function fail(error: string, status = 400) {
  return Response.json({ success: false, error }, { status });
}
