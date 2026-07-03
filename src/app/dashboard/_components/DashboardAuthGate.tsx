"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BUSINESS_SESSION_CLEARED_EVENT,
  BUSINESS_SESSION_SAVED_EVENT,
  getBusinessAuthToken,
} from "@/lib/business-auth";

export function DashboardAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const syncSession = () => {
      if (!getBusinessAuthToken()) {
        router.replace("/");
        return;
      }
      setReady(true);
    };

    syncSession();

    window.addEventListener(BUSINESS_SESSION_SAVED_EVENT, syncSession);
    window.addEventListener(BUSINESS_SESSION_CLEARED_EVENT, syncSession);

    return () => {
      window.removeEventListener(BUSINESS_SESSION_SAVED_EVENT, syncSession);
      window.removeEventListener(BUSINESS_SESSION_CLEARED_EVENT, syncSession);
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f5f2] text-sm text-[#6b746c]">
        Verifica accesso...
      </div>
    );
  }

  return children;
}
