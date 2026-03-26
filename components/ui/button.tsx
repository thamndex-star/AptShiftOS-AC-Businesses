import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" };

export function Button({ className = "", variant = "primary", ...props }: Props) {
  const base = "rounded-md px-4 py-2 text-sm font-medium transition";
  const styles =
    variant === "primary"
      ? "bg-slate-900 text-white hover:bg-slate-700"
      : variant === "danger"
        ? "bg-red-600 text-white hover:bg-red-500"
        : "bg-white border border-slate-300 hover:bg-slate-100";
  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
