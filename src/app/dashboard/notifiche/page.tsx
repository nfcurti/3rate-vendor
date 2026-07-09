"use client";

import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { formatApiErrorMessage } from "@/lib/business-auth";
import {
  businessNotificationsApi,
  type BusinessNotification,
} from "@/lib/business-notifications";
import { Sidebar } from "../_components/Sidebar";
import { ViewTransition } from "../_components/ViewTransition";
import { DashboardViewHeader } from "../_components/DashboardViewHeader";

function getString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getNotificationId(notification: BusinessNotification) {
  return typeof notification._id === "string" ? notification._id : undefined;
}

export default function NotifichePage() {
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    message: string;
    tone: "error" | "success";
  } | null>(null);
  const [notifications, setNotifications] = useState<BusinessNotification[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setStatusMessage(null);
      try {
        const payload = await businessNotificationsApi.list();
        if (!cancelled) setNotifications(payload);
      } catch (error) {
        if (!cancelled) {
          setStatusMessage({ message: formatApiErrorMessage(error), tone: "error" });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const allNotificationIds = useMemo(
    () => notifications.map(getNotificationId).filter((id): id is string => Boolean(id)),
    [notifications]
  );

  async function handleMarkAllRead() {
    setMarking(true);
    setStatusMessage(null);
    try {
      await businessNotificationsApi.markRead();
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, readAt: new Date().toISOString() }))
      );
      setStatusMessage({ message: "Notifiche segnate come lette.", tone: "success" });
    } catch (error) {
      setStatusMessage({ message: formatApiErrorMessage(error), tone: "error" });
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f5f2] text-[#1f2b20]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <Sidebar />

        <main className="w-full">
          <ViewTransition>
            <DashboardViewHeader title="Notifiche" backHref="/dashboard" backAriaLabel="Torna alla dashboard" />

            <div className="mx-auto w-full max-w-6xl px-4 py-7 lg:px-8">
              {statusMessage ? (
                <p
                  className={clsx(
                    "mb-4 text-xs font-semibold",
                    statusMessage.tone === "success" ? "text-[#2f6b3c]" : "text-red-600"
                  )}
                >
                  {statusMessage.message}
                </p>
              ) : null}
              <section className="rounded-3xl bg-white p-6 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-[16px] font-semibold tracking-tight text-[#111827]">Centro notifiche</h2>
                  <button
                    type="button"
                    disabled={marking || loading || allNotificationIds.length === 0}
                    onClick={() => void handleMarkAllRead()}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-[12px] font-semibold text-[#1f2b20] hover:cursor-pointer hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCheck className="h-4 w-4" />
                    {marking ? "Aggiornamento..." : "Segna tutte come lette"}
                  </button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-14">
                    <Loader2 className="h-6 w-6 animate-spin text-[#214e3a]" />
                  </div>
                ) : notifications.length ? (
                  <ul className="mt-5 space-y-3">
                    {notifications.map((n, idx) => {
                      const id = getNotificationId(n) ?? String(idx);
                      const title =
                        getString(n.title) || getString(n.subject) || getString(n.type) || "Notifica";
                      const body = getString(n.body) || getString(n.message) || "";
                      const when = getString(n.when) || getString(n.createdAt) || "";

                      return (
                        <li key={id} className="rounded-xl border border-black/10 bg-[#f8faf8] p-4">
                      <div className="flex items-start gap-3">
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ecf8eb] text-[#2d4f36]">
                          <Bell className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold text-[#111827]">{title}</div>
                          {body ? <p className="mt-1 text-[12px] text-[#4b5563]">{body}</p> : null}
                          {when ? (
                            <p className="mt-2 text-[10px] font-semibold text-[#9aa39a]">{when}</p>
                          ) : null}
                        </div>
                      </div>
                    </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-5 text-[12px] font-semibold text-[#6b7280]">
                    Nessuna notifica.
                  </p>
                )}
              </section>
            </div>
          </ViewTransition>
        </main>
      </div>
    </div>
  );
}
