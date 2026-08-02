"use client";

import { useEffect, useState } from "react";
import {
  BUSINESS_SESSION_CLEARED_EVENT,
  BUSINESS_SESSION_SAVED_EVENT,
  getBusinessAuthToken,
} from "@/lib/business-auth";

export function DashboardAuthGate({ children }: { children: React.ReactNode }) {
  // Always render children on SSR/first paint. Blocking on a loading shell was
  // cached by Next and restored on browser back as a permanent "Verifica accesso...".
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    const syncSession = () => {
      if (getBusinessAuthToken()) {
        setDenied(false);
        return;
      }
      setDenied(true);
      window.location.replace("/");
    };

    syncSession();

    window.addEventListener(BUSINESS_SESSION_SAVED_EVENT, syncSession);
    window.addEventListener(BUSINESS_SESSION_CLEARED_EVENT, syncSession);
    window.addEventListener("storage", syncSession);

    return () => {
      window.removeEventListener(BUSINESS_SESSION_SAVED_EVENT, syncSession);
      window.removeEventListener(BUSINESS_SESSION_CLEARED_EVENT, syncSession);
      window.removeEventListener("storage", syncSession);
    };
  }, []);

  if (denied) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f5f2] text-sm text-[#6b746c]">
        Reindirizzamento al login...
      </div>
    );
  }

  return children;
}
