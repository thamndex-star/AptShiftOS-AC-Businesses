"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

export type ToastVariant = "success" | "error" | "warning";

type ToastItem = { id: number; message: string; variant: ToastVariant };

export type ToastApi = {
  /** Show any variant (reusable helper). */
  push: (message: string, variant: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const durationMs: Record<ToastVariant, number> = {
  success: 3500,
  error: 5500,
  warning: 5500,
};

function ToastView({ message, variant }: { message: string; variant: ToastVariant }) {
  const accent =
    variant === "success"
      ? "border-l-emerald-500"
      : variant === "error"
        ? "border-l-red-500"
        : "border-l-amber-500";

  return (
    <div
      role={variant === "success" ? "status" : "alert"}
      className={`pointer-events-auto max-w-sm border border-slate-200/90 border-l-4 bg-white ${accent} rounded-lg px-4 py-3 text-sm leading-snug text-slate-800 shadow-sm ring-1 ring-slate-900/[0.04]`}
    >
      {message}
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const push = useCallback((message: string, variant: ToastVariant) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, variant }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, durationMs[variant]);
  }, []);

  const value: ToastApi = {
    push,
    success: (message) => push(message, "success"),
    error: (message) => push(message, "error"),
    warning: (message) => push(message, "warning"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex max-h-[min(80vh,28rem)] flex-col gap-2 overflow-y-auto sm:bottom-6 sm:right-6"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <ToastView key={t.id} message={t.message} variant={t.variant} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Use inside any client component below `ToastProvider` (e.g. app layout). */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
