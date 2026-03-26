/** MVP workspace currencies (ISO 4217). */
export const WORKSPACE_CURRENCY_OPTIONS = [
  { value: "USD", label: "USD ($)" },
  { value: "ZAR", label: "ZAR (R)" },
  { value: "ZWL", label: "ZWL (Z$)" },
  { value: "GBP", label: "GBP (£)" },
] as const;

const SUPPORTED = new Set(WORKSPACE_CURRENCY_OPTIONS.map((o) => o.value));

export function normalizeWorkspaceCurrency(input: string | null | undefined): string {
  const code = (input ?? "USD").trim().toUpperCase();
  return SUPPORTED.has(code) ? code : "USD";
}
