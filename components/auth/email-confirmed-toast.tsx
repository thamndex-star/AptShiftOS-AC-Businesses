"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/toast";

const STORAGE_PREFIX = "aptos:email-confirmed-toast:";

function isEmailConfirmedQuery(searchParams: URLSearchParams) {
  const c = searchParams.get("confirmed");
  return (
    c === "1" ||
    c === "true" ||
    searchParams.get("email_confirmed") === "1" ||
    searchParams.get("email_confirmed") === "true"
  );
}

function EmailConfirmedToastInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const replaceDoneRef = useRef(false);

  useEffect(() => {
    if (!isEmailConfirmedQuery(searchParams)) {
      replaceDoneRef.current = false;
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("confirmed");
    params.delete("email_confirmed");
    const qs = params.toString();
    const cleanPath = qs ? `${pathname}?${qs}` : pathname;

    const dedupeKey = `${STORAGE_PREFIX}${pathname}`;
    if (!sessionStorage.getItem(dedupeKey)) {
      sessionStorage.setItem(dedupeKey, "1");
      toast.success("Email confirmed. You're all set!");
    }

    if (!replaceDoneRef.current) {
      replaceDoneRef.current = true;
      router.replace(cleanPath);
    }
  }, [searchParams, pathname, router, toast]);

  return null;
}

export function EmailConfirmedToast() {
  return (
    <Suspense fallback={null}>
      <EmailConfirmedToastInner />
    </Suspense>
  );
}
