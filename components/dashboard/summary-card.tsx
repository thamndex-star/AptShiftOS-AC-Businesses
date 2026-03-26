import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/helpers";
import { normalizeWorkspaceCurrency } from "@/lib/currency";

type SummaryCardProps = {
  label: string;
  value: number;
  /** How to format the primary number */
  format?: "number" | "currency";
  /** ISO currency code when format is currency */
  currency?: string;
  /** Short hint under the value (optional) */
  hint?: string;
};

export function SummaryCard({ label, value, format = "number", currency = "USD", hint }: SummaryCardProps) {
  const code = normalizeWorkspaceCurrency(currency);
  const display =
    format === "currency" ? formatCurrency(value, code) : new Intl.NumberFormat("en-US").format(value);

  return (
    <Card className="p-5">
      <p className="text-sm font-medium leading-snug text-slate-500">{label}</p>
      <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 tabular-nums sm:text-[2.5rem]">{display}</p>
      {hint ? <p className="mt-2 text-xs text-slate-400">{hint}</p> : null}
    </Card>
  );
}
